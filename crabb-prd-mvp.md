## PRD: Crabb.ai — Security Scanner for OpenClaw AI Agents

**Version:** v0.5  
**Date:** 2026‑02‑01  
**Owner:** Product / Security  
**Status:** Draft → MVP build  

---

### 1) Product Summary

**Crabb.ai** is a CLI security scanner for locally installed **OpenClaw** AI agents. Users run one command and get:

- **CRABB SCORE (0–100)** — an overall security posture score
- A prioritized list of **findings** with clear remediation steps
- Optional: a **shareable score card** at `crabb.ai/score/<id>` to drive a viral loop

MVP principle: **fast, understandable, no need to “be a security engineer.”**

---

### 2) Context and Problem

OpenClaw (100k+ GitHub stars) gives users a personal AI assistant with access to messengers, files, shell, etc. This increases the risk surface area significantly, while a typical user:

- stores API keys/tokens unsafely (plaintext, `.env` in obvious places)
- installs skills/plugins from untrusted sources (possible malware / data exfiltration)
- keeps permissions and network egress overly broad
- does not understand the practical risks or what to fix

**Problem in one sentence:** users want the magic of agents, but don’t want to become security experts.

---

### 3) Goals and Success Criteria

#### Product Goals (MVP)

1. Deliver a **measurable, understandable** result in < 1 minute: score + top risks.
2. Make security **social/viral**: scan → share → friends scan.
3. Preserve trust: **no sensitive data leakage**, transparent behavior.

#### Success Metrics (first month after public release)

- **200+** created share score cards (primary metric; sharing is the only time we receive data)
- **500+** GitHub stars (proxy for dev interest)
- Quality: < **5%** complaints about “scary/false” results (issues/support)

> Note: “1,000 scans” is intentionally removed — the CLI is offline by default and we do not count local runs to preserve privacy.

---

### 4) Non‑Goals (Out of scope for MVP)

- One‑click auto‑fixes (MVP provides guidance only)
- Continuous monitoring / daemon / agent (Pro)
- Full SAST/DAST of the user’s entire codebase
- Deep dynamic sandbox execution of skills
- Enterprise features (SSO, org dashboards, compliance)

---

### 5) Target Audience and Personas

#### Primary persona: “Tech Enthusiast”

- Installed OpenClaw “because it’s cool”
- Comfortable with CLI basics, not security
- Motivation: “quickly check if I messed up”

#### Secondary persona: “Indie Builder / Dev”

- Sets up an agent for self/team and wants to demonstrate “we’re safe”
- Motivation: CI checks later, sharing results

#### Anti‑persona (not targeting in MVP)

- Red team / professional attackers (different tool category)

---

### 6) User Journey and Key Scenarios

#### Scenario A: Quick check

1. User sees landing page → copies command
2. Runs `npx getcrabb`
3. Receives score + 3–7 key findings + next steps

#### Scenario B: Share result

1. After the scan, user opts in via `--share`
2. Receives `crabb.ai/score/<id>`
3. Shares to X/Telegram/Discord → others click → run scan

#### Scenario C: Before/after improvement

1. User fixes 1–2 items
2. Runs scan again
3. Sees score increase and “closed” risks

---

### 7) MVP Scope: Functional Requirements

## 7.1 CLI Scanner (MVP)

**Install/run command (MVP):**

```bash
npx getcrabb
```

Optional after global install: `crabb` or `getcrabb`

#### Core requirements

- Scans a local OpenClaw installation (default: `~/.openclaw/`)
- Produces:
  - overall score 0–100
  - findings list with severity and remediation
  - short “Top 3 risks” summary

#### OpenClaw filesystem map (what we scan)

```text
~/.openclaw/
├── openclaw.json                                # Main config (permissions, settings)
├── credentials/
│   ├── oauth.json                               # OAuth tokens (legacy)
│   ├── whatsapp-allowFrom.json                  # Pairing approvals (WhatsApp)
│   ├── telegram-allowFrom.json                  # Pairing approvals (Telegram)
│   └── <channel>-allowFrom.json                 # Pairing approvals (other channels)
├── agents/
│   └── <agentId>/
│       ├── agent/
│       │   └── auth-profiles.json               # Auth credentials per agent
│       ├── sessions/
│       │   └── *.jsonl                          # Session transcripts (possible leaks)
│       ├── sessions.json                        # Session index (metadata)
│       └── openclaw-agent.json                  # Agent config (optional)
├── skills/                                      # Shared skills (managed/local)
├── workspace/
│   ├── AGENTS.md
│   ├── SOUL.md
│   ├── TOOLS.md
│   ├── .env                                     # Possible secrets
│   └── skills/                                  # Workspace skills
│       └── <skill-name>/
│           └── SKILL.md
```

> Sources:  
> - https://docs.openclaw.ai/start/getting-started  
> - https://docs.openclaw.ai/gateway/security  
> - https://docs.openclaw.ai/tools/skills  
> - https://docs.openclaw.ai/concepts/session  

#### CLI Output (human‑readable)

Example:

```text
🦀 Crabb.ai — Security Scanner for OpenClaw

✔ OpenClaw detected
⚠ Found 1 exposed credential(s)
✔ All skills look safe
⚠ Found 3 permission issue(s)
✔ Network configuration secure

YOUR CRABB SCORE: 73/100  C
🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀🦀⬜⬜⬜⬜⬜

Top risks:
1) [HIGH] Exposed credential: Telegram bot token in auth-profiles.json
2) [MEDIUM] DM policy set to "open" — anyone can message your agent
3) [MEDIUM] Channel allowlist contains wildcard "*"

Run with --share to get a shareable score card
```

#### CLI Flags (MVP)

- `--path <dir>`: custom OpenClaw path (if not default)
- `--json`: machine‑readable JSON output (CI/automation)
- `--share`: create shareable score card (explicit opt‑in; **the only time the CLI makes a network call**)
- `--no-color`: CI/log compatibility

#### Exit codes (CI‑friendly)

- `0` — scan completed, score ≥ 75 and no Critical findings
- `1` — scan completed, score < 75 or any Critical/High findings
- `2` — scan failed (IO, permissions, OpenClaw not found)

---

## 7.2 Scanning Modules (MVP)

### Module 1: Credentials Scanner

**What we detect:**

- API keys (Anthropic, OpenAI, Discord, Telegram, Slack, AWS, etc.)
- Private keys, tokens, passwords in plaintext
- `.env` files containing secrets

**Where we scan:**

- `openclaw.json`
- `credentials/oauth.json`
- `credentials/<channel>-allowFrom.json`
- `agents/*/agent/auth-profiles.json`
- `agents/*/sessions/*.jsonl` (search for accidental leaks in transcripts/logs)
- `.env` files (root and workspace)

**Detection patterns (examples):**

- Anthropic: `sk-ant-api03-[A-Za-z0-9_-]{93}`
- OpenAI: `sk-[A-Za-z0-9]{48}`
- Discord: `[MN][A-Za-z0-9]{23,}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27}`
- Telegram: `[0-9]{8,10}:[A-Za-z0-9_-]{35}`
- Generic: `(?i)(api[_-]?key|secret|token|password)\s*[:=]\s*["']?[A-Za-z0-9_-]{16,}`

**Placeholders / ignore patterns:**

- `your-api-key-here`, `xxx`, `${...}`, `<...>`, `TODO`, `REPLACE`

**Safety requirement:**  
Never print or upload actual secrets. Output only: type, file, line number (redacted preview if safe).

---

### Module 2: Skills Scanner

**Suspicious code heuristics (testing examples):**

> Important: this is **not** a “known malicious skill blocklist.”  
> MVP uses static analysis heuristics and signatures.

**Suspicious patterns in `SKILL.md` (examples):**

- **Critical (Remote Code Execution):**
  - `curl | bash`, `wget | sh`, `eval(fetch`
  - `netcat` + exec patterns
  - `/etc/passwd`, `~/.ssh/` access
- **High (Data Exfiltration):**
  - `curl -X POST` with data
  - `base64` encode + send
  - cookie/localStorage access
- **Medium:**
  - unrestricted file read patterns
  - environment variable dumping

**Where we scan:**

- `<workspace>/skills/` (for all workspaces from `openclaw.json`; default: `~/.openclaw/workspace/skills/`)
- `~/.openclaw/skills/` (shared skills: managed/local)
- `skills.load.extraDirs` (if configured in `openclaw.json`; treated as trusted code directories)

---

### Module 3: Permissions Scanner

**What we analyze in `openclaw.json`:**

| Setting | Safe | Risky | Notes |
|---------|------|-------|------|
| `agents.defaults.sandbox.mode` | `"non-main"` (or `"all"`) | `"off"` / not set (defaults to `"off"`) | Enum: `off|non-main|all` |
| DM policy (per‑channel) | `"pairing"` / `"allowlist"` / `"disabled"` | `"open"` | WhatsApp/Telegram: `channels.<ch>.dmPolicy`; Discord/Slack: `channels.<ch>.dm.policy` |
| Allowlist (per‑channel) | specific list | `"*"` wildcard | Key differs per channel; treat wildcard as high risk |
| `gateway.bind` | `"loopback"` | `"lan"` / `"tailnet"` / `"custom"` | `"auto"` is conditional (can fall back to non‑loopback) |
| `gateway.auth` | token/password configured | missing/misconfigured | Non‑loopback binds require token/password; `gateway.remote.token` does **not** secure local auth |
| `gateway.controlUi.allowInsecureAuth` | `false` / not set | `true` | Security downgrade |
| `gateway.controlUi.dangerouslyDisableDeviceAuth` | `false` / not set | `true` | Critical security downgrade |
| `logging.redactSensitive` | `"tools"` (default) | `"off"` | If `"off"` → secrets may leak into logs |

> Source: https://docs.openclaw.ai/gateway/security

**File permissions checks:**

- `~/.openclaw/` should be `700` (owner only)
- credential files should be `600`

---

### Module 4: Network Scanner

**What we check:**

- `gateway.bind` mode:
  - `"loopback"` = safe baseline
  - `"lan" | "tailnet" | "custom"` = expanded attack surface → require `gateway.auth.*` + firewall
  - `"auto"` = conditional; treat as “needs verification”
- TLS configuration (disabled = high risk)
- privileged ports (< 1024)
- webhook authentication

**Active port scan (localhost only):**

- port **18789** — standard OpenClaw gateway port
- port **8080** — common alternative
- port **3000** — dev server

> Scan only `127.0.0.1`. Never scan external addresses.

---

## 7.3 Scoring (CRABB SCORE 0–100)

### Model: risk‑based with caps

**Principle:** start from 100 and subtract penalties for findings. Each module has a cap (maximum penalty).

### Module risk caps

| Module | Max Penalty (Cap) | Rationale |
|--------|-------------------|-----------|
| Credentials | 40 | Secret leakage often equals full compromise |
| Skills | 30 | Malicious skill code can steal everything |
| Permissions | 20 | Broad permissions increase attack surface |
| Network | 10 | Exposure matters, but usually needs additional exploitation |
| **Total** | **100** | |

### Severity → penalty

| Severity | Base Penalty | With confidence |
|----------|--------------|----------------|
| Critical | 25–30 | × confidence (0.5–1.0) |
| High | 15–20 | × confidence |
| Medium | 5–10 | × confidence |
| Low | 2–3 | × confidence |
| Info | 0 | Guidance only |

### Scoring formula

```text
module_risk = min(cap, sum(finding_penalty × confidence))
total_score = 100 - (cred_risk + skill_risk + perm_risk + net_risk)
```

### Grades

| Score | Grade | Label |
|-------|-------|-------|
| 90–100 | A | Excellent |
| 75–89 | B | Good |
| 60–74 | C | Needs Attention |
| 40–59 | D | Poor |
| 0–39 | F | Critical Risk |

**Special rule:** if there is at least one **Critical** finding, the grade **cannot be better than C**, even if the numeric score is higher.

### Aggregation rules

- **Dedup:** one secret type in one file = one finding
- **Confidence:** low‑confidence heuristics use penalty × 0.5
- **Cap enforcement:** each module cannot subtract more than its cap

---

## 7.4 Shareable Score Card (MVP)

### Behavior

- Created only via `--share` (opt‑in)
- **The only moment when the CLI makes a network call**
- Returns: `https://crabb.ai/score/<public_id>`
- Public page shows:
  - CRABB SCORE and grade
  - summary counts (no sensitive details)
  - CTA: `npx getcrabb`
- Generates OG image for social sharing

### What the CLI sends to the server (safe aggregates only)

```json
{
  "score": 73,
  "grade": "C",
  "counts": {
    "credentials": 1,
    "skills": 0,
    "permissions": 3,
    "network": 0
  },
  "cli_version": "1.0.0"
}
```

**Never sent:**

- file paths
- variable/key names
- domains/endpoints
- raw findings
- machine identifiers

### Retention

- Score cards are stored for 90 days
- A delete token is returned on creation (delete without an account)

---

## 7.5 Landing Page (MVP)

### URL: crabb.ai

### Must‑have sections

1. **Hero:** “Is your AI agent leaking your secrets?”
2. **One‑liner install:** `npx getcrabb`
3. **What we scan:** 4 modules with icons
4. **Example output:** terminal screenshot/ASCII
5. **FAQ:**
   - “Is this safe?” — runs locally; no data sent without `--share`
   - “What’s OpenClaw?” — link to openclaw.ai
   - “Is it open source?” — yes, MIT, github.com/getcrabb/crabb
   - “How is this different from `openclaw security audit`?” — see differentiation section

---

### 8) Tech Stack

#### CLI (packages/cli)

- **Runtime:** Node.js ≥ 18 (OpenClaw users typically have Node ≥ 22)
- **Language:** TypeScript 5.3+
- **Build:** tsup (ESM)
- **Dependencies:**
  - chalk 5.3 — colors
  - ora 8.0 — spinners
  - boxen 7.1 — boxes
- **Distribution:** npm package `getcrabb`

#### Web (apps/web)

- **Framework:** Next.js 14+ (App Router)
- **Hosting:** Vercel
- **Database:** Supabase (PostgreSQL)
- **OG images:** @vercel/og

#### Monorepo

- **Tool:** Turborepo
- **Package Manager:** pnpm

```text
crabb/
├── apps/
│   └── web/              # Next.js (crabb.ai)
├── packages/
│   └── cli/              # CLI scanner
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

#### Repository

- **GitHub:** github.com/getcrabb/crabb
- **License:** MIT

---

### 9) Non‑Functional Requirements

#### Performance

- Typical scan: **< 10 seconds**
- Progress indicator for long operations

#### Compatibility

- macOS / Linux: **must‑have**
- Windows: **nice‑to‑have** (WSL supported)

#### Reliability

- Clear errors: “OpenClaw not found at ~/.openclaw”
- Graceful degradation when optional files are missing

#### Security & privacy by design

- **Offline by default:** zero network calls unless `--share`
- **No telemetry:** we do not track local scans
- **Redaction:** secrets never appear in output or share payload
- **Minimal deps:** reduce supply‑chain risk
- **Open source:** full transparency

---

### 10) Data and API (MVP)

#### Supabase schema

**Table: `score_cards`**

```sql
create table score_cards (
  id uuid primary key default gen_random_uuid(),
  public_id text unique not null,      -- short id for URL
  delete_token text not null,          -- for deletion without account
  score integer not null,              -- 0-100
  grade text not null,                 -- A/B/C/D/F
  credentials_count integer default 0,
  skills_count integer default 0,
  permissions_count integer default 0,
  network_count integer default 0,
  cli_version text,
  created_at timestamptz default now(),
  expires_at timestamptz default now() + interval '90 days'
);
```

#### API endpoints

- `POST /api/share` — create score card, returns `{ publicId, deleteToken, url }`
- `GET /score/[id]` — render score card page
- `GET /api/og/[id]` — generate OG image
- `DELETE /api/share/[id]` — delete with token

> Naming: endpoint is `/api/share` (not `/api/scan`) to avoid implying that the server performs scanning.

---

### 11) Analytics (MVP)

**No telemetry for local scans.**

We collect data **only** when the user runs `--share`:

- `share_created` — score, grade, cli_version
- `score_page_viewed` — aggregated referrer (no PII)

We do **not** collect:

- count of local scans
- machine/user identifiers
- IP addresses beyond standard server logs

---

### 12) Competitors and Alternatives

#### Direct alternative: OpenClaw built‑in `security audit`

OpenClaw includes:

```bash
openclaw security audit [--deep] [--fix]
```

**What `openclaw security audit` does:**

- checks gateway exposure and auth
- analyzes allowlists and group policies
- verifies filesystem permissions
- checks `logging.redactSensitive`
- flags `allowInsecureAuth`, `dangerouslyDisableDeviceAuth`

> Sources: https://docs.openclaw.ai/gateway/security, https://docs.openclaw.ai/cli/security

#### Differentiation: why Crabb.ai

| Feature | `openclaw security audit` | Crabb.ai |
|---------|---------------------------|----------|
| **Unified Score (0–100)** | ❌ Mostly pass/fail checks | ✅ Score + grade |
| **Shareable score card** | ❌ | ✅ Viral loop |
| **OG image for socials** | ❌ | ✅ |
| **Skills static analysis** | Basic | Extended (heuristics) |
| **Credentials deep scan** | Partial | Extended (regex + context) |
| **Documented stable exit codes** | Not documented | ✅ 0/1/2 with clear semantics |
| **Standalone (no OpenClaw CLI required)** | ❌ Requires OpenClaw CLI | ✅ `npx getcrabb` |

Positioning: Crabb.ai is a “security audit with a human‑friendly score and shareability.”

#### Indirect competitors (generic secret scanners)

- TruffleHog — scans git history for secrets
- Gitleaks — pre‑commit secret scanning
- Semgrep — code SAST

Why they are not direct competitors:

- not tailored to AI agent configs
- do not scan agent permissions/skills/network posture
- no unified score / share workflow

---

### 13) Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| False positives → loss of trust | confidence scoring, “why flagged”, placeholder detection |
| False negatives → reputation risk | honest disclaimers, fast ruleset updates |
| Data leakage via sharing | opt‑in `--share`, strict payload (aggregates only), delete token |
| Supply‑chain attack on CLI | minimal deps, signed releases, open source |
| Legal wording (“malware”) | careful language (“risky patterns”), disclaimers |
| “Why if OpenClaw has audit?” | clear differentiation (score, share, UX) |

---

### 14) Future (Post‑MVP / Pro)

- Continuous monitoring + alerts
- Auto‑fix suggestions
- CI/CD integration (GitHub Action)
- Policy packs (team standards)
- Slack/Telegram notifications
- Expansion to other agent frameworks
- Community skill blocklist (with verification) — post‑MVP

---

### 15) Acceptance Criteria

**CLI is ready when:**

- [x] `npx getcrabb` produces a score on test configurations
- [x] `--json` outputs a valid JSON schema
- [x] secrets never appear in output (redaction tests)
- [x] exit codes behave as specified (0/1/2)
- [x] without `--share` the CLI makes 0 network calls

**Share is ready when:**

- [x] `--share` returns a link
- [x] payload contains only safe aggregates
- [x] page loads without login
- [x] OG image renders in social previews
- [x] delete token returned in response

**Launch is ready when:**

- [x] landing page is live on crabb.ai
- [x] npm package is published (`getcrabb@0.1.1`)
- [x] GitHub repo is public with README
- [x] privacy policy is published
- [x] differentiation vs `openclaw security audit` is explained in FAQ

---

### 16) Open Questions

1. ~~Where does OpenClaw store permissions/skills?~~ **Resolved:** documented in OpenClaw docs.
2. ~~Do we need network ruleset updates in MVP?~~ **Resolved:** no; ship with the CLI release.
3. ~~Share opt‑in or opt‑out?~~ **Resolved:** opt‑in via `--share`.
4. ~~Minimum Windows support?~~ **Resolved:** WSL supported; native Windows post‑MVP.
5. ~~High‑risk threshold?~~ **Resolved:** score < 75 or any Critical findings.
6. ~~Telemetry?~~ **Resolved:** no telemetry; data only via `--share`.
7. Community skill blocklist verification — **Deferred to post‑MVP**.

---

### 17) Disclaimers (for landing/README)

> **Crabb.ai is not a replacement for a professional security audit.** It runs automated checks for common misconfigurations but cannot guarantee complete security. Always follow OpenClaw’s official security guidelines: docs.openclaw.ai/gateway/security.

> **“Risky patterns” ≠ “malware.”** Crabb.ai uses heuristics to identify potentially dangerous code patterns. A flagged skill is not necessarily malicious — it may be legitimate. Always review findings manually.

---

### 18) Changelog

| Version | Date | Changes |
|---------|------|---------|
| v0.1 | 2026‑02‑01 | Initial draft |
| v0.2 | 2026‑02‑01 | Added tech stack, scoring details, OpenClaw filesystem map |
| v0.3 | 2026‑02‑01 | Added competitor analysis, removed telemetry, renamed `/api/scan` → `/api/share` |
| v0.4 | 2026‑02‑01 | Fixed paths per OpenClaw docs (sessions, allowFrom), corrected dmPolicy values, gateway.bind modes, logging.redactSensitive format, security flags |
| v0.5 | 2026‑02‑01 | Fixed skills scan paths (`~/.openclaw/skills`, workspaces, `skills.load.extraDirs`), clarified DM key differences (Discord/Slack), sandbox.mode values, gateway.auth semantics, updated file tree and Network Scanner checks |
| v0.6 | 2026‑02‑01 | Implementation status update |
| v0.7 | 2026‑02‑01 | Web app implementation |
| v0.8 | 2026‑02‑01 | OpenClaw Audit Wrapper: hybrid scanning, fix flow, consent gate, delta reporting |

---

### 19) Implementation Status

#### Completed (CLI MVP)

| Component | Status | Notes |
|-----------|--------|-------|
| Monorepo setup | ✅ Done | Turborepo + pnpm |
| CLI package structure | ✅ Done | `packages/cli` with tsup build |
| Credentials Scanner | ✅ Done | Anthropic, OpenAI, GitHub, AWS, Slack, Stripe, Discord, Telegram + generic patterns |
| Skills Scanner | ✅ Done | RCE, exfiltration, sensitive file access patterns |
| Permissions Scanner | ✅ Done | sandbox, dmPolicy, allowlist, gateway, file permissions |
| Network Scanner | ✅ Done | gateway config, port scan (18789, 8080, 3000) |
| Scoring System | ✅ Done | 0-100 score, grades A-F, critical finding rule |
| Terminal Output | ✅ Done | chalk, ora, boxen with crab emoji |
| JSON Output | ✅ Done | `--json` flag |
| Exit Codes | ✅ Done | 0/1/2 as specified |
| Unit Tests | ✅ Done | 42 tests passing |
| README | ✅ Done | Root + CLI package |

#### Completed (Web)

| Component | Status | Notes |
|-----------|--------|-------|
| apps/web (Next.js) | ✅ Done | Landing page with terminal demo |
| POST /api/share | ✅ Done | Creates score card (mock without Supabase) |
| GET /score/[id] | ✅ Done | Score card page |
| GET /api/og/[id] | ✅ Done | OG image generation |
| DELETE /api/share/[id] | ✅ Done | Delete endpoint |
| Privacy policy | ✅ Done | /privacy page |
| Supabase schema | ✅ Done | SQL ready in supabase/schema.sql |

#### Completed (Launch)

| Component | Status | Notes |
|-----------|--------|-------|
| Supabase project | ✅ Done | Database configured with RLS |
| Environment vars | ✅ Done | Vercel env vars set |
| Vercel deploy | ✅ Done | https://crabb.ai |
| npm publish | ✅ Done | `getcrabb@0.1.1` |
| Domain setup | ✅ Done | crabb.ai + www.crabb.ai |

---

### 🎉 MVP COMPLETE

All acceptance criteria met. Live at:
- **Website:** https://crabb.ai
- **npm:** https://npmjs.com/package/getcrabb
- **GitHub:** https://github.com/getcrabb/crabb

---

### v0.8 Implementation Status (OpenClaw Audit Wrapper)

#### Completed (v0.8)

| Component | Status | Notes |
|-----------|--------|-------|
| Types extension | ✅ Done | AuditMode, FindingSource, OpenClawInfo, ScanDelta |
| OpenClaw detection | ✅ Done | `src/openclaw/detection.ts` |
| OpenClaw runner | ✅ Done | `src/openclaw/runner.ts` |
| Output parser | ✅ Done | `src/openclaw/parser.ts` — JSON + text |
| Severity mapper | ✅ Done | `src/openclaw/mapper.ts` |
| Path override | ✅ Done | `src/openclaw/path-override.ts` |
| CLI flags | ✅ Done | --audit, --deep, --fix, --yes, --print-openclaw |
| Hybrid scanning | ✅ Done | `scanners/index.ts` — merge logic |
| Fix consent | ✅ Done | `src/fix/consent.ts` |
| Delta calculation | ✅ Done | `src/fix/delta.ts` |
| Fix orchestration | ✅ Done | `src/fix/index.ts` |
| Terminal output | ✅ Done | New print functions |
| JSON output | ✅ Done | meta object |
| Unit tests | ✅ Done | 71 tests passing |

#### New CLI Flags (v0.8)

```
--audit <auto|openclaw|crabb|off>   Audit mode (default: auto)
--deep                               Deep audit (OpenClaw only)
--fix                                Run openclaw --fix
--yes                                Skip fix confirmation
--print-openclaw                     Debug: show raw output
```

#### v0.8 Architecture

```
Hybrid Mode (--audit auto):
┌─────────────────────────────────────────┐
│  OpenClaw CLI                           │
│  └─ permissions/network findings        │
├─────────────────────────────────────────┤
│  Crabb Extras                           │
│  └─ credentials/skills findings         │
├─────────────────────────────────────────┤
│  Merge + Dedup by fingerprint           │
│  └─ Unified CRABB SCORE                 │
└─────────────────────────────────────────┘

Fix Flow:
1. Pre-scan → show findings
2. Consent prompt (or --yes)
3. openclaw security audit --fix
4. Post-scan → delta
5. Before/After comparison
```
