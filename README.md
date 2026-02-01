# CRABB

> Security Scanner for OpenClaw AI Agents

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

CRABB is a CLI tool that scans your OpenClaw AI agent configuration for security vulnerabilities and produces a score from 0-100 with prioritized findings.

## Features

- **Offline by default** — No network calls without explicit `--share` flag
- **Privacy-first** — Never outputs actual secrets, only findings metadata
- **Four security scanners** — Credentials, Skills, Permissions, Network
- **CI-friendly** — JSON output, exit codes, no-color mode

## Quick Start

```bash
npm install -g getcrabb

# Scan default OpenClaw installation
crabb

# Scan custom directory
crabb --path ./my-openclaw

# JSON output for CI
crabb --json
```

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

## Project Structure

```
crabb/
├── packages/cli/     # CLI scanner (npm: getcrabb)
└── apps/web/         # Score card sharing website [TODO]
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

## License

MIT
