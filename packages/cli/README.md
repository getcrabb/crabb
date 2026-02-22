# CRABB - Security Scanner for OpenClaw AI Agents

CLI security scanner that produces a CRABB SCORE (0-100) with prioritized findings.

**v0.8**: Now supports hybrid scanning with OpenClaw CLI integration and guided fix flow.

## Installation

```bash
npm install -g getcrabb
```

## Usage

```bash
# Scan default OpenClaw installation (~/.openclaw/)
crabb

# Scan custom directory
crabb --path ./my-openclaw

# Output as JSON
crabb --json

# Create shareable score card
crabb --share

# Share with social attribution + meme theme
crabb --share --source social_x --campaign share-card-challenge --share-theme meme

# OpenClaw Telegram share
crabb --share --source social_tg --campaign tg-share-card --share-theme meme

# CI-friendly (no colors)
crabb --no-color
```

### Audit Mode (v0.8)

```bash
# Auto-detect: use OpenClaw CLI if available, else Crabb-only
crabb --audit auto

# Require OpenClaw CLI (fails if not found)
crabb --audit openclaw

# Crabb scanners only (no OpenClaw CLI dependency)
crabb --audit crabb

# Request deep audit (OpenClaw only)
crabb --deep
```

### Fix Mode (v0.8)

```bash
# Scan, show findings, prompt for fix, show before/after delta
crabb --fix

# Non-interactive fix (skip confirmation prompt)
crabb --fix --yes

# Apply fix and exit immediately (no post-scan)
crabb --fix-only --yes
```

## Options

| Flag | Short | Description |
|------|-------|-------------|
| `--path <dir>` | `-p` | Path to OpenClaw directory |
| `--json` | `-j` | Output results as JSON |
| `--share` | `-s` | Share score card to crabb.ai |
| `--source <name>` | | Share source: cli, skill, ci, social_x, social_tg, github, direct |
| `--campaign <name>` | | Optional campaign tag for share attribution |
| `--share-theme <theme>` | | Share card theme: cyber, meme, minimal |
| `--no-color` | | Disable colored output |
| `--help` | `-h` | Show help message |
| `--version` | `-v` | Show version number |
| `--audit <mode>` | | Audit mode: auto, openclaw, crabb, off |
| `--deep` | | Request deep audit (OpenClaw only) |
| `--fix` | | Run OpenClaw --fix after scan |
| `--fix-only` | | Apply fix and exit (no post-rescan) |
| `--yes` | | Skip confirmation prompt for --fix |
| `--print-openclaw` | | Debug: show raw OpenClaw output |

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Score >= 75, no Critical/High findings |
| 1 | Score < 75 or Critical/High findings present |
| 2 | Scan failed (IO error, OpenClaw not found, --audit openclaw but CLI missing) |

## Audit Modes (v0.8)

| Mode | OpenClaw CLI | Scanners |
|------|--------------|----------|
| `auto` (default) | Used if available | Hybrid: OpenClaw + Crabb extras |
| `openclaw` | Required | OpenClaw audit only |
| `crabb` | Not used | Crabb scanners only |
| `off` | Not used | Same as crabb |

**Hybrid mode** combines:
- **OpenClaw CLI** → permissions, network checks
- **Crabb extras** → credentials, skills deep scan

Results are merged and deduplicated by fingerprint.

## Fix Flow (v0.8)

When you run `crabb --fix`:

1. **Pre-scan** — analyze current state
2. **Consent** — show findings, ask for confirmation
3. **Fix** — run `openclaw security audit --fix`
4. **Post-scan** — verify fixes applied
5. **Delta** — show before/after comparison

Use `--yes` to skip the confirmation prompt (for CI/automation).

## Scanners

### Credentials Scanner (max 40 points)
Detects API keys, tokens, and secrets in:
- `openclaw.json`
- `credentials/*`
- `agents/*/auth-profiles.json`
- `agents/*/sessions/*.jsonl`
- `.env` files

Supports: Anthropic, OpenAI, AWS, GitHub, Slack, Stripe, Discord, Telegram, and generic patterns.

### Skills Scanner (max 30 points)
Static analysis for suspicious patterns in SKILL.md files:
- **Critical**: Remote code execution, curl piped to bash
- **High**: Data exfiltration, environment access
- **Medium**: Broad file access patterns
- **Low**: General network/file operations

### Permissions Scanner (max 20 points)
Analyzes `openclaw.json` configuration:
- Sandbox mode (strict/permissive/disabled)
- DM policy settings
- Allowlist wildcards
- Gateway bind/auth/TLS settings
- File permissions (700/600)

### Network Scanner (max 10 points)
Checks gateway configuration and local ports:
- Gateway bind mode analysis
- TLS and auth configuration
- Localhost port scan (18789, 8080, 3000)

## Score Calculation

```
score = 100 - sum(min(module_cap, module_penalty))
penalty = sum(severity_base × confidence)

Severity base:
- Critical: 27.5
- High: 17.5
- Medium: 7.5
- Low: 2.5
```

## Grades

| Grade | Score | Notes |
|-------|-------|-------|
| A | 90+ | Excellent security posture |
| B | 75+ | Good, minor improvements recommended |
| C | 60+ | Fair, review findings |
| D | 40+ | Poor, immediate action needed |
| F | <40 | Critical security issues |

**Note**: Critical findings cap the maximum grade at C.

## Privacy

- **Offline by default**: No network calls without `--share`
- **No secrets in output**: All findings show type, file, and line only (redacted)
- **Share payload**: Contains only aggregates (score, grade, counts)

## License

MIT
