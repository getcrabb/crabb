import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { sql, ScoreCard } from '@/lib/db';
import { getGradeColor, getGradeLabel } from '@/lib/utils';

type ShareTheme = 'cyber' | 'meme' | 'minimal';

interface ThemeConfig {
  background: string;
  panel: string;
  heading: string;
  text: string;
  accent: string;
  muted: string;
  emoji: string;
  footerTag: string;
}

const VALID_THEMES: ReadonlySet<ShareTheme> = new Set(['cyber', 'meme', 'minimal']);

const THEMES: Record<ShareTheme, ThemeConfig> = {
  cyber: {
    background: 'linear-gradient(135deg, #0B1021 0%, #172554 100%)',
    panel: 'rgba(13, 20, 45, 0.85)',
    heading: '#E0F2FE',
    text: '#F8FAFC',
    accent: '#22D3EE',
    muted: '#93C5FD',
    emoji: '🦀',
    footerTag: '#ShareCardChallenge',
  },
  meme: {
    background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 50%, #F97316 100%)',
    panel: 'rgba(255, 255, 255, 0.14)',
    heading: '#FFF7ED',
    text: '#FFFFFF',
    accent: '#FDE047',
    muted: '#FBCFE8',
    emoji: '🔥',
    footerTag: '#CanYouBeatMe',
  },
  minimal: {
    background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
    panel: 'rgba(255, 255, 255, 0.95)',
    heading: '#0F172A',
    text: '#111827',
    accent: '#2563EB',
    muted: '#475569',
    emoji: '✅',
    footerTag: '#SecureByDefault',
  },
};

function normalizeTheme(value: string | null | undefined): ShareTheme | null {
  if (!value) return null;
  const normalized = value.toLowerCase() as ShareTheme;
  return VALID_THEMES.has(normalized) ? normalized : null;
}

function resolveTheme(cardTheme: ScoreCard['share_theme'], queryTheme: string | null): ShareTheme {
  return normalizeTheme(queryTheme) ?? normalizeTheme(cardTheme) ?? 'cyber';
}

async function getScoreCard(id: string): Promise<ScoreCard | null> {
  if (!sql) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL not configured in production');
    }
    return {
      id: 'mock-id',
      public_id: id,
      score: 85,
      grade: 'B',
      credentials_count: 0,
      skills_count: 1,
      permissions_count: 2,
      network_count: 1,
      critical_count: 0,
      high_count: 1,
      medium_count: 2,
      low_count: 1,
      source: 'social_x',
      campaign: 'share-card-challenge',
      share_theme: 'cyber',
      cli_version: '0.8.0',
      audit_mode: 'auto',
      openclaw_version: null,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      verified: true,
      improvement_delta: null,
      improvement_previous_score: null,
    };
  }

  const rows = await sql`
    SELECT
      id,
      public_id,
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
      created_at,
      expires_at,
      verified,
      improvement_delta,
      improvement_previous_score
    FROM score_cards
    WHERE public_id = ${id} AND expires_at > NOW()
    LIMIT 1
  `;

  return (rows?.[0] as ScoreCard | undefined) ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const card = await getScoreCard(params.id);

  if (!card) {
    return new Response('Not found', { status: 404 });
  }

  const theme = resolveTheme(card.share_theme, request.nextUrl.searchParams.get('theme'));
  const style = THEMES[theme];
  const gradeColor = getGradeColor(card.grade);
  const gradeLabel = getGradeLabel(card.grade);

  const sourceLabelMap: Record<NonNullable<ScoreCard['source']>, string> = {
    cli: 'CLI',
    skill: 'Skill',
    ci: 'CI',
    social_x: 'X',
    social_tg: 'Telegram',
    github: 'GitHub',
    direct: 'Direct',
  };

  const sourceLabel = card.source ? sourceLabelMap[card.source] : null;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          position: 'relative',
          justifyContent: 'center',
          alignItems: 'center',
          background: style.background,
          fontFamily: 'system-ui, sans-serif',
          color: style.text,
        }}
      >
        <div
          style={{
            width: 1040,
            height: 520,
            borderRadius: 36,
            background: style.panel,
            border: `2px solid ${style.accent}55`,
            display: 'flex',
            flexDirection: 'column',
            padding: '38px 46px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.28)',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                fontSize: 28,
                color: style.heading,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              CRABB SCORE
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div
                style={{
                  display: 'flex',
                  padding: '8px 14px',
                  borderRadius: 999,
                  fontSize: 18,
                  background: `${style.accent}22`,
                  color: style.accent,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                {theme}
              </div>
              {sourceLabel && (
                <div
                  style={{
                    display: 'flex',
                    padding: '8px 14px',
                    borderRadius: 999,
                    fontSize: 18,
                    background: '#ffffff22',
                    color: style.text,
                    fontWeight: 600,
                  }}
                >
                  {sourceLabel}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontSize: 64 }}>{style.emoji}</span>
                <span style={{ fontSize: 54, fontWeight: 800, color: gradeColor }}>
                  {card.score}/100
                </span>
              </div>
              <div style={{ display: 'flex', fontSize: 34, color: style.text, fontWeight: 700 }}>
                Grade {card.grade} • {gradeLabel}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                minWidth: 330,
                fontSize: 26,
                color: style.muted,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Critical</span>
                <span style={{ color: '#F87171', fontWeight: 700 }}>{card.critical_count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>High</span>
                <span style={{ color: '#FB923C', fontWeight: 700 }}>{card.high_count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Medium</span>
                <span style={{ color: '#FACC15', fontWeight: 700 }}>{card.medium_count}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Low</span>
                <span style={{ color: '#34D399', fontWeight: 700 }}>{card.low_count}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 24,
              color: style.muted,
              borderTop: `1px solid ${style.accent}44`,
              paddingTop: 18,
            }}
          >
            <div style={{ display: 'flex' }}>crabb.ai/score/{card.public_id}</div>
            <div style={{ display: 'flex', color: style.accent, fontWeight: 700 }}>
              {style.footerTag}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
