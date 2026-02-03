# Crabb Security Scan Action

Run [Crabb](https://crabb.ai) security scans on your OpenClaw agent configuration in GitHub Actions.

## Usage

```yaml
name: Security Scan
on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Crabb Security Scan
        uses: getcrabb/crabb/.github/actions/crabb-scan@main
        with:
          path: ~/.openclaw
          fail-on-score: 75
```

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `path` | Path to OpenClaw directory | `~/.openclaw` |
| `fail-on-score` | Fail if score below threshold (0-100) | `75` |
| `audit-mode` | Audit mode: `auto`, `openclaw`, `crabb`, `off` | `auto` |
| `deep` | Run deep audit (OpenClaw only) | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `score` | Security score (0-100) |
| `grade` | Letter grade (A-F) |
| `critical-count` | Number of critical findings |
| `high-count` | Number of high findings |
| `result-json` | Full scan result as JSON |

## Examples

### Basic Usage

```yaml
- uses: getcrabb/crabb/.github/actions/crabb-scan@main
```

### Custom Threshold

```yaml
- uses: getcrabb/crabb/.github/actions/crabb-scan@main
  with:
    fail-on-score: 80
```

### Deep Scan with OpenClaw

```yaml
- uses: getcrabb/crabb/.github/actions/crabb-scan@main
  with:
    audit-mode: openclaw
    deep: true
```

### Use Outputs

```yaml
- name: Run Crabb Scan
  id: crabb
  uses: getcrabb/crabb/.github/actions/crabb-scan@main

- name: Comment on PR
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: `## Crabb Security Scan

        - Score: ${{ steps.crabb.outputs.score }}/100
        - Grade: ${{ steps.crabb.outputs.grade }}
        - Critical: ${{ steps.crabb.outputs.critical-count }}
        - High: ${{ steps.crabb.outputs.high-count }}`
      })
```

## Badge

Add a badge to your README:

```markdown
[![Crabb Score](https://crabb.ai/api/badge/YOUR_SCORE_ID)](https://crabb.ai/score/YOUR_SCORE_ID)
```

## Exit Codes

- `0` - Scan passed (score >= threshold, no critical findings)
- `1` - Scan failed (score < threshold or critical findings)

## License

MIT
