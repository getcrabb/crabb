import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { supabase, ScoreCard } from '@/lib/supabase';
import { getGradeColor, getGradeLabel } from '@/lib/utils';

async function getScoreCard(id: string): Promise<ScoreCard | null> {
  if (!supabase) {
    // Return mock data for development
    return {
      id: 'mock-id',
      public_id: id,
      delete_token: 'mock-token',
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
      openclaw_version: null,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('score_cards')
    .select('*')
    .eq('public_id', id)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return data as ScoreCard;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const card = await getScoreCard(params.id);

  if (!card) {
    return new Response('Not found', { status: 404 });
  }

  const gradeColor = getGradeColor(card.grade);
  const gradeLabel = getGradeLabel(card.grade);

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a2e',
          fontFamily: 'monospace',
        }}
      >
        {/* Background gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 0%, rgba(255,107,53,0.1) 0%, transparent 50%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px',
          }}
        >
          {/* Crab emoji */}
          <div style={{ fontSize: 80, marginBottom: 20 }}>🦀</div>

          {/* Title */}
          <div
            style={{
              fontSize: 32,
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: 40,
            }}
          >
            CRABB SCORE
          </div>

          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 20 }}>
            <span
              style={{
                fontSize: 120,
                fontWeight: 'bold',
                color: gradeColor,
              }}
            >
              {card.score}
            </span>
            <span style={{ fontSize: 40, color: '#6b7280', marginLeft: 10 }}>
              / 100
            </span>
          </div>

          {/* Grade */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40 }}>
            <span style={{ fontSize: 28, color: '#ffffff' }}>Grade: </span>
            <span
              style={{
                fontSize: 36,
                fontWeight: 'bold',
                color: gradeColor,
                marginLeft: 10,
              }}
            >
              {card.grade}
            </span>
            <span style={{ fontSize: 24, color: '#6b7280', marginLeft: 10 }}>
              ({gradeLabel})
            </span>
          </div>

          {/* Findings */}
          <div
            style={{
              display: 'flex',
              gap: 30,
              fontSize: 20,
              color: '#9ca3af',
            }}
          >
            <span>🚨 {card.critical_count} Critical</span>
            <span>⚠️ {card.high_count} High</span>
            <span>🟡 {card.medium_count} Medium</span>
          </div>

          {/* URL */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              fontSize: 24,
              color: '#FF6B35',
            }}
          >
            crabb.ai
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
