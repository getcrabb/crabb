import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if credentials are provided
export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export interface ScoreCard {
  id: string;
  public_id: string;
  delete_token: string;
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
  created_at: string;
  expires_at: string;
}
