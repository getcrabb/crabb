import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { sql, ScoreCard } from '@/lib/db';
import { CopyCommand } from '@/components/CopyCommand';
import { ScoreRing } from '@/components/ScoreRing';
import { ConfettiTrigger } from './ConfettiTrigger';
import Link from 'next/link';

interface PageProps {
  params: { id: string };
}

async function getScoreCard(id: string): Promise<ScoreCard | null> {
  if (!sql) {
    if (process.env.NODE_ENV === 'production') {
      console.error('DATABASE_URL not configured in production');
      return null;
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
      cli_version: '0.8.0',
      audit_mode: 'auto',
      openclaw_version: '2.1.0',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      verified: true,
      improvement_delta: 23,
      improvement_previous_score: 62,
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const card = await getScoreCard(params.id);

  if (!card) {
    return { title: 'Score Card Not Found - CRABB' };
  }

  const gradeLabel = getGradeLabel(card.grade);
  const title = `CRABB Score: ${card.score}/100 (Grade ${card.grade})`;
  const description = `Security scan result: ${gradeLabel}. Scanned by CRABB - the friendly security scanner for OpenClaw.`;

  return {
    title,
    description,
    openGraph: { title, description, images: [`/api/og/${params.id}`] },
    twitter: { card: 'summary_large_image', title, description, images: [`/api/og/${params.id}`] },
  };
}

function getGradeLabel(grade: string): string {
  const labels: Record<string, string> = {
    'A': 'Excellent! Your setup is secure.',
    'B': 'Good job! Just a few things to check.',
    'C': 'Needs attention. Some issues to fix.',
    'D': 'Warning! Several security concerns.',
    'F': 'Critical! Immediate action needed.',
  };
  return labels[grade] || 'Unknown';
}

function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    'A': '#10B981',
    'B': '#3B82F6',
    'C': '#F59E0B',
    'D': '#F97316',
    'F': '#EF4444',
  };
  return colors[grade] || '#64748B';
}

function getGradeEmoji(grade: string): string {
  const emojis: Record<string, string> = {
    'A': '🎉',
    'B': '👍',
    'C': '🤔',
    'D': '⚠️',
    'F': '🚨',
  };
  return emojis[grade] || '❓';
}

export default async function ScoreCardPage({ params }: PageProps) {
  const card = await getScoreCard(params.id);

  if (!card) {
    notFound();
  }

  const gradeColor = getGradeColor(card.grade);
  const gradeLabel = getGradeLabel(card.grade);
  const gradeEmoji = getGradeEmoji(card.grade);

  const totalFindings = card.credentials_count + card.skills_count + card.permissions_count + card.network_count;
  const isGoodScore = card.score >= 75;

  return (
    <main className="min-h-screen py-12 px-4">
      {/* Confetti for Grade A */}
      <ConfettiTrigger grade={card.grade} />

      {/* Decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="blob w-[500px] h-[500px] -top-32 -right-32 opacity-40"
          style={{ background: gradeColor }}
        />
        <div className="blob blob-ocean w-[400px] h-[400px] -bottom-32 -left-32 opacity-30" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#34495E] hover:text-[#4ECDC4] transition-colors mb-8 text-sm font-medium group"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="transition-transform group-hover:-translate-x-1"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to CRABB
        </Link>

        {/* Main card */}
        <div className="card p-8 md:p-12 shadow-xl overflow-hidden relative">
          {/* Top accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1"
            style={{ background: `linear-gradient(90deg, ${gradeColor}, ${gradeColor}80)` }}
          />

          {/* Header */}
          <div className="text-center mb-10">
            <div className="text-6xl mb-4 animate-bounce-soft">🦀</div>
            <h1 className="text-2xl font-black text-[#2C3E50] mb-2">
              CRABB Security Score
            </h1>
            <p className="text-[#34495E]">
              OpenClaw installation scanned
            </p>
          </div>

          {/* Score ring */}
          <div className="flex justify-center mb-10">
            <ScoreRing
              score={card.score}
              grade={card.grade}
              color={gradeColor}
            />
          </div>

          {/* Grade badge */}
          <div className="text-center mb-10">
            <div
              className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl"
              style={{ background: `${gradeColor}15` }}
            >
              <span className="text-4xl">{gradeEmoji}</span>
              <div className="text-left">
                <div
                  className="text-4xl font-black"
                  style={{ color: gradeColor }}
                >
                  Grade {card.grade}
                </div>
                <div className="text-sm text-[#34495E] font-medium">{gradeLabel}</div>
              </div>
            </div>
          </div>

          {/* Verified Badge */}
          {card.verified && (
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full font-bold shadow-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4 12 14.01l-3-3" />
                </svg>
                Crabb Verified
              </div>
            </div>
          )}

          {/* Improvement Badge (after fix) */}
          {card.improvement_delta && card.improvement_delta > 0 && (
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-bold shadow-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
                Improved +{card.improvement_delta} points
                <span className="text-white/70 text-sm">
                  (from {card.improvement_previous_score})
                </span>
              </div>
            </div>
          )}

          {/* Celebration message for good scores */}
          {isGoodScore && (
            <div className="text-center mb-8 p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-200">
              <span className="text-emerald-600 font-semibold">
                {card.grade === 'A' ? '🏆 Perfect security! You\'re a star!' : '✨ Great job keeping your setup secure!'}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent my-8" />

          {/* Findings summary */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-[#2C3E50] mb-6 text-center flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
              Findings Summary
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FindingCard
                icon="🔑"
                label="Credentials"
                count={card.credentials_count}
                color="#EF4444"
              />
              <FindingCard
                icon="⚡"
                label="Skills"
                count={card.skills_count}
                color="#F59E0B"
              />
              <FindingCard
                icon="🛡️"
                label="Permissions"
                count={card.permissions_count}
                color="#3B82F6"
              />
              <FindingCard
                icon="🌐"
                label="Network"
                count={card.network_count}
                color="#10B981"
              />
            </div>

            {totalFindings === 0 && (
              <div className="mt-6 text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-600 font-semibold flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <path d="M22 4 12 14.01l-3-3" />
                  </svg>
                  No issues found! Your setup looks secure.
                </span>
              </div>
            )}
          </div>

          {/* Severity breakdown */}
          {(card.critical_count > 0 || card.high_count > 0 || card.medium_count > 0 || card.low_count > 0) && (
            <>
              <div className="h-px bg-gradient-to-r from-transparent via-[#E2E8F0] to-transparent my-8" />

              <div className="mb-8">
                <h2 className="text-lg font-bold text-[#2C3E50] mb-6 text-center flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  By Severity
                </h2>

                <div className="flex justify-center gap-4 flex-wrap">
                  {card.critical_count > 0 && (
                    <SeverityBadge label="Critical" count={card.critical_count} color="#EF4444" />
                  )}
                  {card.high_count > 0 && (
                    <SeverityBadge label="High" count={card.high_count} color="#F97316" />
                  )}
                  {card.medium_count > 0 && (
                    <SeverityBadge label="Medium" count={card.medium_count} color="#F59E0B" />
                  )}
                  {card.low_count > 0 && (
                    <SeverityBadge label="Low" count={card.low_count} color="#10B981" />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Timestamp */}
          <div className="text-center text-sm text-[#64748B] flex items-center justify-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            Scanned on {new Date(card.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>

          {/* Version info */}
          {(card.cli_version || card.audit_mode || card.openclaw_version) && (
            <div className="mt-4 flex justify-center gap-3 flex-wrap">
              {card.cli_version && (
                <span className="px-3 py-1 bg-[#F1F5F9] rounded-full text-xs text-[#64748B] font-mono">
                  crabb v{card.cli_version}
                </span>
              )}
              {card.audit_mode && (
                <span className="px-3 py-1 bg-[#F1F5F9] rounded-full text-xs text-[#64748B]">
                  {card.audit_mode === 'auto' ? '🔄 hybrid' : card.audit_mode === 'openclaw' ? '🔗 openclaw' : '🦀 crabb-only'}
                </span>
              )}
              {card.openclaw_version && (
                <span className="px-3 py-1 bg-[#F1F5F9] rounded-full text-xs text-[#64748B] font-mono">
                  openclaw v{card.openclaw_version}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Share prompt */}
        <div className="text-center mt-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl">
          <p className="text-[#34495E] mb-2 font-medium">
            Share your score on social media! 📣
          </p>
          <p className="text-sm text-[#64748B] mb-4">
            Let others know you take security seriously.
          </p>
          <div className="flex justify-center gap-3">
            <SocialButton
              platform="twitter"
              url={`https://twitter.com/intent/tweet?text=I%20scored%20${card.score}/100%20(Grade%20${card.grade})%20on%20my%20OpenClaw%20security%20scan!%20🦀&url=https://crabb.ai/score/${card.public_id}`}
            />
            <SocialButton
              platform="linkedin"
              url={`https://www.linkedin.com/sharing/share-offsite/?url=https://crabb.ai/score/${card.public_id}`}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-[#34495E] mb-4 font-medium">
            Want to check your own OpenClaw setup?
          </p>
          <CopyCommand command="npx getcrabb" />
        </div>
      </div>
    </main>
  );
}

function FindingCard({
  icon,
  label,
  count,
  color,
}: {
  icon: string;
  label: string;
  count: number;
  color: string;
}) {
  const hasFindings = count > 0;

  return (
    <div
      className="p-4 rounded-xl text-center transition-all hover:scale-105"
      style={{
        background: hasFindings ? `${color}10` : '#F8FAFC',
        border: `2px solid ${hasFindings ? color : '#E2E8F0'}`,
      }}
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div
        className="text-2xl font-bold mb-1"
        style={{ color: hasFindings ? color : '#64748B' }}
      >
        {count}
      </div>
      <div className="text-xs text-[#64748B] uppercase tracking-wide font-medium">
        {label}
      </div>
    </div>
  );
}

function SeverityBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      className="px-4 py-2 rounded-full font-bold flex items-center gap-2"
      style={{ background: `${color}15`, color }}
    >
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      {count} {label}
    </div>
  );
}

function SocialButton({ platform, url }: { platform: 'twitter' | 'linkedin'; url: string }) {
  const icons = {
    twitter: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    linkedin: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  };

  const colors = {
    twitter: '#1DA1F2',
    linkedin: '#0A66C2',
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
      style={{ background: `${colors[platform]}15`, color: colors[platform] }}
    >
      {icons[platform]}
    </a>
  );
}
