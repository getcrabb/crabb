# CRABB - Security Scanner for OpenClaw AI Agents

CLI security scanner that produces a CRABB SCORE (0-100) with prioritized findings.

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

# CI-friendly (no colors)
crabb --no-color
```

## Options

| Flag | Short | Description |
|------|-------|-------------|
| `--path <dir>` | `-p` | Path to OpenClaw directory |
| `--json` | `-j` | Output results as JSON |
| `--share` | `-s` | Share score card to crabb.ai |
| `--no-color` | | Disable colored output |
| `--help` | `-h` | Show help message |
| `--version` | `-v` | Show version number |

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Score >= 75, no Critical/High findings |
| 1 | Score < 75 or Critical/High findings present |
| 2 | Scan failed (IO error, OpenClaw not found) |

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
