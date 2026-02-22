---
name: crabb-security-audit
description: Run CRABB CLI security audits for OpenClaw installations and convert results into actionable remediation plans. Use when a user asks to check OpenClaw/agent security, run `crabb`, interpret score/findings, harden sandbox/network/skills/credentials settings, compare before/after results, produce CI-friendly JSON security reports, or drive safe opt-in social sharing from chat channels such as Telegram.
---

# Crabb Security Audit

## Overview

Run `crabb` against an OpenClaw directory, interpret findings by severity and module, and return prioritized fixes that improve security score quickly.
Load `references/crabb-product-analysis.md` when detailed scanner behavior, scoring weights, or hybrid audit details are required.

## Quick Start

1. Detect CLI availability.
   - `crabb --version`
   - Fallback: `npx -y getcrabb --version`
2. Resolve scan path.
   - Default: `~/.openclaw`
   - Use user-provided path when specified
3. Run scan.
   - Human-readable: `crabb --path "<path>"`
   - Machine-readable: `crabb --path "<path>" --json`
4. Summarize result.
   - Score and grade
   - Critical/high findings
   - Top 3 risks and next actions
5. Offer viral share (opt-in only).
   - Ask first: `Want a share card?`
   - Share only after explicit `yes`.

## Proactive Share Offer (Opt-In)

Always follow this pattern:

1. Run scan and show results.
2. Offer share with explicit consent request.
   - Example: `Want me to generate a share card? It only sends aggregate counts.`
3. If user says `yes`, run share command.
4. If user says `no`, stop and do not repeat immediately.
5. Never auto-share without consent.

Use local cooldown helper to avoid chat spam:

1. Check cooldown:
   - `python "<skill>/scripts/telegram_share_offer.py" should-offer --user "<chat_or_user_id>" --cooldown-hours 24`
2. If `should_offer` is true:
   - Ask for consent and record shown:
   - `python "<skill>/scripts/telegram_share_offer.py" record --user "<chat_or_user_id>" --event shown`
3. On user response:
   - Accepted: record + share
   - Declined: record and stop
   - `python "<skill>/scripts/telegram_share_offer.py" record --user "<chat_or_user_id>" --event accepted`
   - `python "<skill>/scripts/telegram_share_offer.py" record --user "<chat_or_user_id>" --event declined`

## Workflow

1. Confirm target directory.
   - Prefer explicit user path.
   - Use `~/.openclaw` when omitted.
   - Stop and request path if directory is missing.
2. Choose audit mode.
   - Default: `--audit auto`
   - Use `--audit crabb` if OpenClaw CLI is unavailable or user asks for Crabb-only scan.
   - Use `--deep` only when user asks for deeper OpenClaw checks.
3. Run scan and capture output.
   - Prefer JSON: `crabb --path "<path>" --json --audit <mode>`
   - Fall back to human output if JSON mode is unavailable.
4. Prioritize risks.
   - Sort by severity: `critical > high > medium > low`.
   - Break ties by confidence and exploitability.
   - Escalate credentials exposure and public gateway findings first.
5. Build remediation plan.
   - Give quick wins first (10-15 minutes).
   - Then provide hardening tasks with expected impact.
6. Verify improvements.
   - Re-run the same scan command.
   - Report score delta and remaining blockers.

## OpenClaw Telegram Flow

Use this when CRABB is invoked by an OpenClaw agent that receives commands from Telegram.

1. Interpret user intent from Telegram message.
   - `quick check` -> run scan only.
   - `share` or `challenge` -> run scan + share card.
2. Run scan command first.
   - `crabb --path "<path>" --json --audit auto`
3. If user asks to publish/share, run:
   - `crabb --path "<path>" --share --source social_tg --campaign tg-share-card --share-theme meme`
4. For proactive offer (when user asked only to check):
   - Use cooldown helper before prompting.
   - Ask consent once.
   - On `yes`, run share command above.
   - On `no`, record decline and finish.
5. Return in the chat:
   - final score and grade,
   - share URL,
   - one short challenge line user can forward.
6. Never expose secrets or raw credential values in Telegram responses.

## Fix Mode

Use fix mode only after explicit confirmation because it modifies local OpenClaw configuration.

1. Run guided fix:
   - `crabb --path "<path>" --fix`
2. Run non-interactive fix:
   - `crabb --path "<path>" --fix --yes`
3. Re-scan immediately and report what changed.
4. Fall back to manual remediation if OpenClaw CLI is unavailable.

## Interpretation Rules

- Treat exit code `0` as acceptable baseline (`score >= 75` and no critical/high).
- Treat exit code `1` as actionable risk.
- Treat exit code `2` as scan failure (path/IO/OpenClaw dependency issue).
- Avoid printing full secrets; report type, path, and line only.

## Remediation Cheatsheet

- `sandbox.mode: "disabled"` -> set to `"strict"`.
- `dmPolicy: "allow"` -> set to `"ask"` or `"deny"`.
- `allowlist: ["*"]` -> replace with explicit hosts.
- `gateway.bind: "0.0.0.0"` -> set to `"localhost"` unless remote access is required.
- `gateway.auth: false` -> set to `true`.
- `gateway.tls: false` on non-local bind -> set to `true`.
- Secrets in configs or session logs -> rotate keys and move to secure storage.

## Response Template

1. Security posture: `<score>/100`, `<grade>`, audit mode `<mode>`.
2. Top risks: 3-5 findings with severity and file path.
3. Action plan: ordered fixes with expected impact.
4. Re-check command: `crabb --path "<path>" --json`.
5. Social challenge line: `Can you beat this score? Share card challenge: <url>`.
6. Telegram-ready variant: `Forward this check: <url>`.

## References

- Read `references/crabb-product-analysis.md` for architecture and scanner-specific details.
- Read `references/openclaw-telegram-agents-snippet.md` for copy-paste agent policy text.
