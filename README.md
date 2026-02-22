# CRABB

> Security Scanner for OpenClaw AI Agents

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/getcrabb.svg)](https://www.npmjs.com/package/getcrabb)

CRABB is a CLI tool that scans your OpenClaw AI agent configuration for security vulnerabilities and produces a score from 0-100 with prioritized findings.

**v0.8**: Hybrid scanning with OpenClaw CLI integration + guided fix flow.

## Features

- **Offline by default** — No network calls without explicit `--share` flag
- **Privacy-first** — Never outputs actual secrets, only findings metadata
- **Four security scanners** — Credentials, Skills, Permissions, Network
- **CI-friendly** — JSON output, exit codes, no-color mode
- **Hybrid mode (v0.8)** — Combines OpenClaw audit + Crabb extras
- **Fix flow (v0.8)** — Guided fixes with consent gate and delta reporting

## Quick Start

```bash
npm install -g getcrabb

# Scan default OpenClaw installation
crabb

# Scan custom directory
crabb --path ./my-openclaw

# JSON output for CI
crabb --json

# Fix issues (v0.8)
crabb --fix

# Social share (challenge-ready card)
crabb --share --source social_x --campaign share-card-challenge --share-theme meme

# OpenClaw Telegram share flow
crabb --share --source social_tg --campaign tg-share-card --share-theme meme
```

For chat agents (Telegram/Discord), treat `--share` as opt-in: run scan first, then ask consent before sharing.

## Score Card

```
╭──────────────────────────────╮
│   🦀 CRABB SCORE             │
│      85 / 100                │
│      Grade: B                │
│                              │
│   🚨 Critical: 0             │
│   ⚠️ High:     1             │
│   🟡 Medium:   2             │
│   ℹ️ Low:      3             │
╰──────────────────────────────╯
```

## Scanners

| Scanner | Max Points | Checks |
|---------|------------|--------|
| Credentials | 40 | API keys, tokens, secrets in config files |
| Skills | 30 | Dangerous patterns in SKILL.md files |
| Permissions | 20 | Sandbox mode, allowlists, gateway config |
| Network | 10 | Gateway exposure, TLS, open ports |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Score ≥ 75, no Critical/High findings |
| 1 | Score < 75 or Critical/High findings |
| 2 | Scan failed (IO error, path not found) |

## CLI Options (v0.8)

```
Basic:
  -p, --path <dir>     Path to OpenClaw directory
  -j, --json           Output results as JSON
  -s, --share          Share score card to crabb.ai
      --source <name>  Share source: cli|skill|ci|social_x|social_tg|github|direct
      --campaign <id>  Optional campaign tag (up to 64 chars)
      --share-theme    cyber|meme|minimal (default: cyber)
      --no-color       Disable colored output

Audit Mode:
      --audit <mode>   auto|openclaw|crabb|off (default: auto)
      --deep           Request deep audit (OpenClaw only)

Fix Mode:
      --fix            Run OpenClaw --fix after scan
      --yes            Skip confirmation prompt
```

## Project Structure

```
crabb/
├── packages/cli/     # CLI scanner (npm: getcrabb)
│   ├── src/
│   │   ├── scanners/ # 4 security scanners
│   │   ├── openclaw/ # v0.8: OpenClaw CLI integration
│   │   └── fix/      # v0.8: Fix flow
└── apps/web/         # Score card sharing website (crabb.ai)
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Run CLI locally
cd packages/cli && pnpm dev -- --path ./fixtures/clean
```

### Web App Env

The score sharing site in `apps/web` expects these environment variables:

- `DATABASE_URL` (Neon Postgres connection string)
- `NEON_DATABASE_URL` (optional alias; used if `DATABASE_URL` is not set)
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (optional, for multi-instance rate limiting)
- `NEXT_PUBLIC_BASE_URL` (optional, defaults to `https://crabb.ai`)

## License

MIT
