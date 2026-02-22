# OpenClaw AGENTS.md Snippet (Telegram)

Use this block in the OpenClaw workspace `AGENTS.md` to enforce safe proactive sharing.

```md
## CRABB Telegram Share Policy

- When user asks for a security check, run scan first and return score + top risks.
- Do not auto-share.
- After scan, you may proactively offer a share card exactly once per cooldown window.
- Share only after explicit user confirmation (`yes`, `share`, `publish`).
- If user declines, acknowledge and do not re-prompt until cooldown expires.
- Never include secrets, token values, or raw credential contents in chat responses.

### Commands

1) Scan:
`crabb --path "~/.openclaw" --json --audit auto`

2) Cooldown check (24h default):
`python "<skill>/scripts/telegram_share_offer.py" should-offer --user "<chat_or_user_id>" --cooldown-hours 24`

3) Record offer shown:
`python "<skill>/scripts/telegram_share_offer.py" record --user "<chat_or_user_id>" --event shown`

4) Record accepted and share:
`python "<skill>/scripts/telegram_share_offer.py" record --user "<chat_or_user_id>" --event accepted`
`crabb --path "~/.openclaw" --share --source social_tg --campaign tg-share-card --share-theme meme`

5) Record declined:
`python "<skill>/scripts/telegram_share_offer.py" record --user "<chat_or_user_id>" --event declined`
```

## Suggested Telegram Reply Templates

### After scan

`Security check done: <score>/100 (Grade <grade>). Top risk: <risk>.`

### Proactive offer (opt-in)

`Want me to generate a share card for Telegram/X? It sends only aggregate metrics, not secrets.`

### If accepted

`Done. Share card: <url>`
`Challenge: can your friends beat this score?`

### If declined

`Understood. I won't post anything.`
