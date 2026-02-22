import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { sql } from '@/lib/db';
import { generatePublicId, generateDeleteToken } from '@/lib/utils';
import { checkRateLimit } from '@/lib/rate-limit';

if (!sql && process.env.NODE_ENV !== 'production') {
  console.warn('Neon database not configured - share API will return mock responses');
}

interface SharePayload {
  score: number;
  grade?: string;
  source?: ShareSource;
  campaign?: string;
  theme?: ShareTheme;
  scannerSummary: {
    scanner: string;
    findingsCount: number;
    penalty: number;
  }[];
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  timestamp: string;
  // v0.8 fields
  cliVersion?: string;
  auditMode?: 'auto' | 'openclaw' | 'crabb' | 'off';
  openclawVersion?: string | null;
  // v0.8: Verified badge
  verified?: boolean;
  // v0.8: Improvement delta
  improvement?: {
    previousScore: number;
    delta: number;
  };
}

type ShareSource =
  | 'cli'
  | 'skill'
  | 'ci'
  | 'social_x'
  | 'social_tg'
  | 'github'
  | 'direct';

type ShareTheme = 'cyber' | 'meme' | 'minimal';

const VALID_AUDIT_MODES = new Set(['auto', 'openclaw', 'crabb', 'off']);
const VALID_SHARE_SOURCES: ReadonlySet<ShareSource> = new Set([
  'cli',
  'skill',
  'ci',
  'social_x',
  'social_tg',
  'github',
  'direct',
]);
const VALID_SHARE_THEMES: ReadonlySet<ShareTheme> = new Set(['cyber', 'meme', 'minimal']);

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') || 'unknown';
}

function hashDeleteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function deriveGrade(score: number, criticalCount: number): string {
  if (criticalCount > 0) {
    if (score >= 75) return 'C';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }

  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

function toCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  return 0;
}

function toInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  return null;
}

function normalizeSource(value: unknown): ShareSource {
  if (typeof value !== 'string') return 'cli';
  const normalized = value.toLowerCase() as ShareSource;
  return VALID_SHARE_SOURCES.has(normalized) ? normalized : 'cli';
}

function normalizeTheme(value: unknown): ShareTheme {
  if (typeof value !== 'string') return 'cyber';
  const normalized = value.toLowerCase() as ShareTheme;
  return VALID_SHARE_THEMES.has(normalized) ? normalized : 'cyber';
}

function normalizeCampaign(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 64);
  return safe || null;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = await checkRateLimit(`share:${ip}`, { limit: 20, windowMs: 60_000 });

  if (!rate.ok) {
    const retryAfter = Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000));
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  }

  try {
    const payload: SharePayload = await request.json();

    if (typeof payload.score !== 'number' || Number.isNaN(payload.score)) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }

    const normalizedScore = Math.round(payload.score);
    if (normalizedScore < 0 || normalizedScore > 100) {
      return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    }

    const criticalCount = toCount(payload.criticalCount);
    const grade = deriveGrade(normalizedScore, criticalCount);
    const verified = normalizedScore >= 75 && criticalCount === 0;
    const source = normalizeSource(payload.source);
    const shareTheme = normalizeTheme(payload.theme);
    const campaign = normalizeCampaign(payload.campaign);

    const publicId = generatePublicId();
    const deleteToken = generateDeleteToken();
    const deleteTokenHash = hashDeleteToken(deleteToken);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://crabb.ai';

    // Return mock response if DB not configured (local/dev only)
    if (!sql) {
      if (process.env.NODE_ENV === 'production') {
        console.error('DATABASE_URL not configured in production');
        return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
      }
      return NextResponse.json({
        id: publicId,
        url: `${baseUrl}/score/${publicId}`,
        deleteToken,
      });
    }

    const scannerSummary = Array.isArray(payload.scannerSummary) ? payload.scannerSummary : [];
    const getScannerCount = (name: string) =>
      toCount(scannerSummary.find(s => s.scanner === name)?.findingsCount);

    await sql`
      INSERT INTO score_cards (
        public_id,
        delete_token_hash,
        score,
        grade,
        credentials_count,
        skills_count,
        permissions_count,
        network_count,
        critical_count,
        high_count,
        medium_count,
        low_count,
        source,
        campaign,
        share_theme,
        cli_version,
        audit_mode,
        openclaw_version,
        verified,
        improvement_delta,
        improvement_previous_score
      ) VALUES (
        ${publicId},
        ${deleteTokenHash},
        ${normalizedScore},
        ${grade},
        ${getScannerCount('credentials')},
        ${getScannerCount('skills')},
        ${getScannerCount('permissions')},
        ${getScannerCount('network')},
        ${toCount(payload.criticalCount)},
        ${toCount(payload.highCount)},
        ${toCount(payload.mediumCount)},
        ${toCount(payload.lowCount)},
        ${source},
        ${campaign},
        ${shareTheme},
        ${payload.cliVersion ?? null},
        ${VALID_AUDIT_MODES.has(payload.auditMode ?? '') ? payload.auditMode : null},
        ${payload.openclawVersion ?? null},
        ${verified},
        ${toInteger(payload.improvement?.delta)},
        ${toInteger(payload.improvement?.previousScore)}
      );
    `;

    return NextResponse.json({
      id: publicId,
      url: `${baseUrl}/score/${publicId}`,
      deleteToken,
    });
  } catch (err) {
    console.error('Share error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
