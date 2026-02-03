import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Public (anon) client for read-only access
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

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
  cli_version: string | null;
  audit_mode: 'auto' | 'openclaw' | 'crabb' | 'off' | null;
  openclaw_version: string | null;
  created_at: string;
  expires_at: string;
  // v0.8: Verified badge
  verified: boolean | null;
  // v0.8: Improvement delta (post-fix)
  improvement_delta: number | null;
  improvement_previous_score: number | null;
}
