-- CRABB Score Cards Schema

create table if not exists score_cards (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null,
  -- Store only a hash of the delete token (never store raw token)
  delete_token_hash text not null,
  score integer not null check (score >= 0 and score <= 100),
  grade text not null check (grade in ('A', 'B', 'C', 'D', 'F')),

  -- Scanner counts
  credentials_count integer default 0,
  skills_count integer default 0,
  permissions_count integer default 0,
  network_count integer default 0,

  -- Severity counts
  critical_count integer default 0,
  high_count integer default 0,
  medium_count integer default 0,
  low_count integer default 0,

  -- Metadata
  cli_version text,
  audit_mode text check (audit_mode in ('auto', 'openclaw', 'crabb', 'off')),
  openclaw_version text,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '90 days',

  -- v0.8: Verified badge (score >= 75 && no critical)
  verified boolean default null,

  -- v0.8: Improvement delta (for post-fix scans)
  improvement_delta integer default null,
  improvement_previous_score integer default null
);

-- Index for public_id lookups
create index if not exists idx_score_cards_public_id on score_cards(public_id);

-- Index for expiration cleanup
create index if not exists idx_score_cards_expires_at on score_cards(expires_at);

-- RLS policies
alter table score_cards enable row level security;

-- Allow public reads for non-expired cards (read-only)
create policy "Allow public reads"
  on score_cards
  for select
  to anon
  using (expires_at > now());

-- Inserts/deletes should be performed via server-side service role (RLS bypass)

-- Cleanup function for expired cards
create or replace function cleanup_expired_score_cards()
returns void as $$
begin
  delete from score_cards where expires_at < now();
end;
$$ language plpgsql security definer;

-- Optional: Create a scheduled job to run cleanup daily
-- (Configure in Supabase Dashboard > Database > Extensions > pg_cron)
-- select cron.schedule('cleanup-expired-cards', '0 3 * * *', 'select cleanup_expired_score_cards()');

-- Migration v0.8: Add audit_mode and openclaw_version columns
-- Run this on existing databases:
--
-- ALTER TABLE score_cards ADD COLUMN IF NOT EXISTS audit_mode text
--   CHECK (audit_mode IN ('auto', 'openclaw', 'crabb', 'off'));
-- ALTER TABLE score_cards ADD COLUMN IF NOT EXISTS openclaw_version text;

-- Migration v0.8.1: Add verified badge and improvement delta columns
-- Run this on existing databases:
--
-- ALTER TABLE score_cards ADD COLUMN IF NOT EXISTS verified boolean DEFAULT null;
-- ALTER TABLE score_cards ADD COLUMN IF NOT EXISTS improvement_delta integer DEFAULT null;
-- ALTER TABLE score_cards ADD COLUMN IF NOT EXISTS improvement_previous_score integer DEFAULT null;

-- Migration v0.9: Replace raw delete tokens with hashed tokens
-- (requires pgcrypto extension for digest function)
-- create extension if not exists pgcrypto;
-- ALTER TABLE score_cards ADD COLUMN IF NOT EXISTS delete_token_hash text;
-- UPDATE score_cards
--   SET delete_token_hash = encode(digest(delete_token, 'sha256'), 'hex')
--   WHERE delete_token_hash IS NULL AND delete_token IS NOT NULL;
-- ALTER TABLE score_cards ALTER COLUMN delete_token_hash SET NOT NULL;
-- ALTER TABLE score_cards DROP COLUMN IF EXISTS delete_token;
