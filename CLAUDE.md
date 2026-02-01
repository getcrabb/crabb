# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crabb.ai — CLI security scanner for OpenClaw AI agents. Produces a CRABB SCORE (0–100) with prioritized findings and optional shareable score card.

## Tech Stack

- **Monorepo:** Turborepo + pnpm
- **CLI (packages/cli):** Node.js ≥18, TypeScript 5.3+, tsup (ESM build)
- **Web (apps/web):** Next.js 14+ (App Router), Vercel, Supabase
- **Key CLI deps:** chalk, ora, boxen

## Project Structure

```
crabb/
├── apps/
│   └── web/                      # Next.js landing + score cards (crabb.ai)
│       ├── src/app/              # App Router pages
│       │   ├── page.tsx          # Landing page
│       │   ├── privacy/          # Privacy policy
│       │   ├── score/[id]/       # Score card page
│       │   └── api/              # API routes
│       │       ├── share/        # POST create, DELETE
│       │       └── og/[id]/      # OG image generation
│       ├── src/components/       # React components
│       ├── src/lib/              # Supabase client, utils
│       └── supabase/schema.sql   # Database schema
├── packages/
│   └── cli/                      # CLI scanner (npm: getcrabb)
│       ├── src/
│       │   ├── cli.ts            # Entry point
│       │   ├── types/            # TypeScript types
│       │   ├── config/           # OpenClaw paths config
│       │   ├── scanners/         # Security scanners (4 modules)
│       │   ├── scoring/          # Score calculation
│       │   ├── output/           # Terminal + JSON output
│       │   ├── share/            # Share API client
│       │   ├── openclaw/         # v0.8: OpenClaw CLI integration
│       │   ├── fix/              # v0.8: Fix flow (consent, delta)
│       │   └── utils/            # Utilities (fs, redact)
│       └── fixtures/             # Test fixtures
├── turbo.json
└── pnpm-workspace.yaml
```

## Common Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run CLI locally
cd packages/cli && pnpm dev -- --path ./fixtures/clean

# Run web locally
cd apps/web && pnpm dev
```

## CLI Architecture

Four scanning modules with risk-based scoring:

1. **Credentials Scanner** (cap: 40 pts) — detects API keys, tokens, secrets in config files and session logs
2. **Skills Scanner** (cap: 30 pts) — static analysis for suspicious patterns in SKILL.md files
3. **Permissions Scanner** (cap: 20 pts) — analyzes openclaw.json settings (sandbox, DM policy, allowlists, gateway)
4. **Network Scanner** (cap: 10 pts) — checks gateway bind mode, TLS, auth config, localhost ports

Score formula: `100 - sum(min(module_cap, findings_penalty))`

## v0.8 Architecture: OpenClaw Audit Wrapper

Crabb v0.8 pivots from standalone scanner to wrapper over `openclaw security audit`:

**Hybrid Mode (auto):**
- OpenClaw CLI handles permissions/network scanning
- Crabb provides "extra" scanners (credentials, skills)
- Results merged and deduplicated by fingerprint

**Crabb-Only Mode:**
- All 4 scanners run natively
- No OpenClaw CLI dependency

**Fix Flow:**
1. Pre-scan → show findings
2. Consent prompt (skippable with `--yes`)
3. Run `openclaw security audit --fix`
4. Post-scan → calculate delta
5. Display before/after comparison

**New Modules:**
- `src/openclaw/` — detection, runner, parser, mapper, path-override
- `src/fix/` — consent gate, delta calculation, orchestration

**OpenClaw Module Details:**
- `detection.ts` — findOpenClawPath(), getOpenClawVersion(), detectOpenClaw()
- `runner.ts` — runOpenClawAudit() with timeout and path override
- `parser.ts` — parseAuditOutput() auto-detects JSON vs text
- `mapper.ts` — mapOpenClawFinding(), createCrabbFinding(), severity mapping table
- `path-override.ts` — createPathOverride() for custom --path via HOME symlink

**Fix Module Details:**
- `consent.ts` — askFixConsent() with findings preview
- `delta.ts` — calculateDelta() returns fixed/new/unchanged findings
- `index.ts` — runFixFlow() orchestrates pre-scan → consent → fix → post-scan

## CLI Flags

**Basic:**
- `--path <dir>` — custom OpenClaw path (default: ~/.openclaw/)
- `--json` — machine-readable output
- `--share` — create shareable score card (only network call)
- `--no-color` — CI compatibility

**Audit Mode (v0.8):**
- `--audit <mode>` — auto|openclaw|crabb|off (default: auto)
  - `auto` — Use OpenClaw CLI if available, else Crabb-only
  - `openclaw` — Require OpenClaw CLI
  - `crabb` — Use Crabb scanners only
  - `off` — Skip audit entirely
- `--deep` — Request deep audit (OpenClaw only)

**Fix Mode (v0.8):**
- `--fix` — Run OpenClaw `--fix` after scan
- `--yes` — Skip confirmation prompt for `--fix`

**Debug:**
- `--print-openclaw` — Show raw OpenClaw CLI output

## Exit Codes

- `0` — score ≥75, no Critical findings
- `1` — score <75 or Critical/High findings
- `2` — scan failed (IO error, OpenClaw not found)

## OpenClaw Paths Scanned

```
~/.openclaw/
├── openclaw.json
├── credentials/
├── agents/*/agent/auth-profiles.json
├── agents/*/sessions/*.jsonl
├── skills/
└── workspace/skills/
```

## API Endpoints (apps/web)

- `POST /api/share` — create score card
- `GET /score/[id]` — render score card page
- `GET /api/og/[id]` — OG image generation
- `DELETE /api/share/[id]` — delete with token

## Privacy Rules

- CLI is offline by default — network calls only with `--share`
- Never print or upload actual secrets — output only type, file, line (redacted)
- Share payload contains only aggregates (score, grade, counts)

## Testing

**Unit Tests (71 passing):**
- `src/scoring/index.test.ts` — scoring formula, grades
- `src/utils/redact.test.ts` — secret redaction
- `src/scanners/*.test.ts` — credentials, skills, permissions
- `src/openclaw/detection.test.ts` — PATH detection, version parsing
- `src/openclaw/parser.test.ts` — JSON/text parsing
- `src/openclaw/mapper.test.ts` — severity mapping
- `src/fix/delta.test.ts` — before/after diff

**Fixtures:**
- `fixtures/clean/` — clean OpenClaw config for testing
- `fixtures/openclaw-output/` — mock OpenClaw audit outputs (JSON, text, malformed)

**Run Tests:**
```bash
cd packages/cli && pnpm test
```
