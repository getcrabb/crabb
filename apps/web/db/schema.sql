-- CRABB Score Cards Schema (Postgres / Neon)

create extension if not exists pgcrypto;

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

-- Cleanup function for expired cards
create or replace function cleanup_expired_score_cards()
returns void as $$
begin
  delete from score_cards where expires_at < now();
end;
$$ language plpgsql;

-- Optional: schedule cleanup via external cron/automation.
