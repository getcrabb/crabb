# CRABB Product Analysis (for Skill Runtime)

## 1. Product Snapshot

- Product: `CRABB` CLI security scanner for OpenClaw.
- Goal: produce a security score `0-100` and prioritized findings.
- Core modules: `credentials`, `skills`, `permissions`, `network`.
- Main entrypoint: `packages/cli/src/cli.ts`.

## 2. Execution Modes

- `--audit auto` (default):
  - Use OpenClaw CLI audit if available.
  - Merge OpenClaw findings with CRABB extras (`credentials` + `skills`).
- `--audit openclaw`:
  - Require OpenClaw CLI.
  - Fail if CLI is unavailable.
- `--audit crabb` (or `off`):
  - Run CRABB local scanners only.

Implementation reference: `packages/cli/src/scanners/index.ts`.

## 3. Score Model

- Total score formula: `100 - sum(module penalties)`, minimum `0`.
- Module caps:
  - `credentials`: 40
  - `skills`: 30
  - `permissions`: 20
  - `network`: 10
- Severity bases (CRABB scanners):
  - `critical`: 27.5
  - `high`: 17.5
  - `medium`: 7.5
  - `low`: 2.5
- Grade mapping:
  - A: `>=90`
  - B: `>=75`
  - C: `>=60`
  - D: `>=40`
  - F: `<40`
- Critical finding caps grade at most `C`.

Implementation reference: `packages/cli/src/scoring/index.ts`.

## 4. Scanner Behavior Summary

### Credentials Scanner

- Scans:
  - `openclaw.json`
  - `.env` and `.env.*`
  - `credentials/`
  - `agents/*/(auth-profiles.json|*.json|*.jsonl)`
- Detects:
  - Anthropic/OpenAI/AWS/GitHub/Slack/Stripe/Telegram/Discord patterns
  - Generic key/secret patterns
  - Private key blocks
- Skips placeholders like `your-api-key-here`, `${VAR}`, `TODO`.

File: `packages/cli/src/scanners/credentials.ts`

### Skills Scanner

- Scans markdown files in:
  - `<openclaw>/skills`
  - `<openclaw>/workspace/skills`
- Detects patterns:
  - RCE primitives (`curl | bash`, `eval(`, command execution)
  - Sensitive file access (`~/.ssh`, `/etc/passwd`)
  - Exfil traits (`POST`, `base64 + send`, env dumps)

File: `packages/cli/src/scanners/skills.ts`

### Permissions Scanner

- Reads `openclaw.json`.
- Flags:
  - sandbox disabled/permissive
  - `dmPolicy` too open
  - wildcard/broad allowlist
  - exposed gateway bind/auth/tls config
  - weak filesystem permissions on OpenClaw directories

File: `packages/cli/src/scanners/permissions.ts`

### Network Scanner

- Reads `gateway` config from `openclaw.json`.
- Flags exposed gateway without auth/TLS.
- Also probes local ports: `18789`, `8080`, `3000`.

File: `packages/cli/src/scanners/network.ts`

## 5. OpenClaw Integration Details

- Detect OpenClaw CLI from local `node_modules/.bin/openclaw` or `PATH`.
- Runner executes `openclaw security audit` with capability probing:
  - Retry without unsupported flags (`--no-color`, `--deep`) if needed.
- Parse JSON or text output and map findings into CRABB schema.
- Deduplicate merged findings by fingerprint.

Files:
- `packages/cli/src/openclaw/detection.ts`
- `packages/cli/src/openclaw/runner.ts`
- `packages/cli/src/openclaw/parser.ts`
- `packages/cli/src/openclaw/mapper.ts`

## 6. User-Facing Risks to Prioritize

Prioritize these first in summaries:

1. Exposed gateway without auth/TLS.
2. Disabled sandbox or wildcard allowlist.
3. Exposed credentials or private keys.
4. Skill files containing RCE/exfiltration patterns.

## 7. Known Product Constraints

- Skills scanner is regex/heuristic based; false positives are possible.
- Network scanner checks only a small fixed port set.
- Hybrid mode relies on OpenClaw output format compatibility.
- `--fix` flow requires OpenClaw CLI and can modify local config.

## 8. Recommended Agent Output Shape

Always return:

1. Score + grade + audit mode used.
2. Top 3-5 risks with severity and exact file path.
3. Ordered remediation plan (quick wins first).
4. Re-check command for verification.

## 9. Viral Share Metadata

- CLI supports social attribution fields for `--share` payload:
  - `source` (`social_x`, `social_tg`, `skill`, `github`, `direct`, `cli`, `ci`)
  - `campaign` (up to 64 chars)
  - `theme` (`cyber`, `meme`, `minimal`)
- Web score cards store these fields and expose themed OG images.

## 10. OpenClaw in Telegram

Recommended chat-driven sequence:

1. User asks OpenClaw in Telegram to check security.
2. Agent runs CRABB scan and summarizes score + top risks.
3. If user asks to share, agent runs `--share --source social_tg`.
4. Agent posts only safe output:
   - score, grade, short risks summary, share URL.
5. Agent avoids sending secrets, full file contents, or sensitive logs.
