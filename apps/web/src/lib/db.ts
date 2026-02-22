import 'server-only';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';

export const sql = databaseUrl ? neon(databaseUrl) : null;

export interface ScoreCard {
  id: string;
  public_id: string;
  score: number;
  grade: string;
  credentials_count: number;
  skills_count: number;
  permissions_count: number;
  network_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  source: 'cli' | 'skill' | 'ci' | 'social_x' | 'social_tg' | 'github' | 'direct' | null;
  campaign: string | null;
  share_theme: 'cyber' | 'meme' | 'minimal' | null;
  cli_version: string | null;
  audit_mode: 'auto' | 'openclaw' | 'crabb' | 'off' | null;
  openclaw_version: string | null;
  created_at: string;
  expires_at: string;
  verified: boolean | null;
  improvement_delta: number | null;
  improvement_previous_score: number | null;
}
