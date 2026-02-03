import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generatePublicId, generateDeleteToken } from '@/lib/utils';
import { checkRateLimit } from '@/lib/rate-limit';

if (!supabaseAdmin) {
  console.warn('Supabase admin not configured - share API will return mock responses or errors');
}

interface SharePayload {
  score: number;
  grade?: string;
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

const VALID_AUDIT_MODES = new Set(['auto', 'openclaw', 'crabb', 'off']);

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

function isMissingColumn(error: { message?: string; details?: string }, column: string): boolean {
  const message = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
  return message.includes(`column`) && message.includes(column.toLowerCase()) && message.includes('does not exist');
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`share:${ip}`, { limit: 20, windowMs: 60_000 });

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

    const publicId = generatePublicId();
    const deleteToken = generateDeleteToken();
    const deleteTokenHash = hashDeleteToken(deleteToken);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://crabb.ai';

    // Return mock response if Supabase not configured
    if (!supabaseAdmin) {
      if (!supabase) {
        return NextResponse.json({
          id: publicId,
          url: `${baseUrl}/score/${publicId}`,
          deleteToken,
        });
      }

      console.error('Supabase admin not configured; cannot persist score card');
      return NextResponse.json({ error: 'Supabase admin not configured' }, { status: 500 });
    }

    const scannerSummary = Array.isArray(payload.scannerSummary) ? payload.scannerSummary : [];
    const getScannerCount = (name: string) =>
      toCount(scannerSummary.find(s => s.scanner === name)?.findingsCount);

    const insertPayload = {
      public_id: publicId,
      delete_token_hash: deleteTokenHash,
      score: normalizedScore,
      grade,
      credentials_count: getScannerCount('credentials'),
      skills_count: getScannerCount('skills'),
      permissions_count: getScannerCount('permissions'),
      network_count: getScannerCount('network'),
      critical_count: toCount(payload.criticalCount),
      high_count: toCount(payload.highCount),
      medium_count: toCount(payload.mediumCount),
      low_count: toCount(payload.lowCount),
      cli_version: payload.cliVersion ?? null,
      audit_mode: VALID_AUDIT_MODES.has(payload.auditMode ?? '') ? payload.auditMode : null,
      openclaw_version: payload.openclawVersion ?? null,
      verified,
      improvement_delta: toInteger(payload.improvement?.delta),
      improvement_previous_score: toInteger(payload.improvement?.previousScore),
    };

    let { data, error } = await supabaseAdmin
      .from('score_cards')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error && isMissingColumn(error, 'delete_token_hash')) {
      // Fallback for legacy schema without delete_token_hash
      const legacyPayload = {
        ...insertPayload,
        delete_token: deleteToken,
      };
      delete (legacyPayload as { delete_token_hash?: string }).delete_token_hash;

      const legacyInsert = await supabaseAdmin
        .from('score_cards')
        .insert(legacyPayload)
        .select('id')
        .single();

      data = legacyInsert.data;
      error = legacyInsert.error;
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to create score card' }, { status: 500 });
    }

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
