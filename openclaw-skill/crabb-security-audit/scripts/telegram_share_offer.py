#!/usr/bin/env python3
"""
Helper for proactive share-offer flow in chat agents.

It keeps local, privacy-safe state for:
- whether a share offer should be shown (cooldown)
- basic local funnel counters: shown/accepted/declined

No network calls. No secrets stored.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

DEFAULT_STATE_PATH = "~/.openclaw/workspace/.crabb-share-offer.json"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_iso(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def to_iso(dt: datetime) -> str:
    return dt.isoformat()


@dataclass
class OfferDecision:
    should_offer: bool
    reason: str


def default_state() -> dict[str, Any]:
    return {"version": 1, "users": {}}


def load_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return default_state()
    try:
        data = json.loads(path.read_text())
    except Exception:
        return default_state()
    if not isinstance(data, dict):
        return default_state()
    users = data.get("users")
    if not isinstance(users, dict):
        data["users"] = {}
    if "version" not in data:
        data["version"] = 1
    return data


def save_state(path: Path, state: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2, sort_keys=True))


def get_user_slot(state: dict[str, Any], user_key: str) -> dict[str, Any]:
    users = state.setdefault("users", {})
    slot = users.get(user_key)
    if not isinstance(slot, dict):
        slot = {}
        users[user_key] = slot
    stats = slot.get("stats")
    if not isinstance(stats, dict):
        stats = {"shown": 0, "accepted": 0, "declined": 0}
        slot["stats"] = stats
    for key in ("shown", "accepted", "declined"):
        if not isinstance(stats.get(key), int):
            stats[key] = 0
    return slot


def should_offer(slot: dict[str, Any], cooldown_hours: int, now: datetime) -> OfferDecision:
    last_offer = parse_iso(slot.get("last_offer_at"))
    if not last_offer:
        return OfferDecision(True, "no_history")

    cooldown = timedelta(hours=max(0, cooldown_hours))
    if now - last_offer < cooldown:
        return OfferDecision(False, "cooldown")
    return OfferDecision(True, "cooldown_expired")


def record_event(slot: dict[str, Any], event: str, now: datetime) -> None:
    stats = slot["stats"]
    stats[event] = int(stats.get(event, 0)) + 1

    if event == "shown":
        slot["last_offer_at"] = to_iso(now)
    elif event == "accepted":
        slot["last_accept_at"] = to_iso(now)
    elif event == "declined":
        slot["last_decline_at"] = to_iso(now)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Manage local proactive share-offer state for Telegram/OpenClaw flows.",
    )
    parser.add_argument(
        "--state-file",
        default=DEFAULT_STATE_PATH,
        help="Path to local state JSON file.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    should = sub.add_parser("should-offer", help="Decide if offer should be shown.")
    should.add_argument("--user", required=True, help="Stable user/chat key.")
    should.add_argument(
        "--cooldown-hours",
        type=int,
        default=24,
        help="Cooldown after the last shown offer.",
    )

    record = sub.add_parser("record", help="Record funnel event.")
    record.add_argument("--user", required=True, help="Stable user/chat key.")
    record.add_argument(
        "--event",
        required=True,
        choices=["shown", "accepted", "declined"],
        help="Event to record.",
    )

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    state_path = Path(args.state_file).expanduser()
    state = load_state(state_path)
    now = utc_now()

    if args.command == "should-offer":
        slot = get_user_slot(state, args.user)
        decision = should_offer(slot, args.cooldown_hours, now)
        payload = {
            "should_offer": decision.should_offer,
            "reason": decision.reason,
            "cooldown_hours": args.cooldown_hours,
            "user": args.user,
            "state_file": str(state_path),
        }
        print(json.dumps(payload, separators=(",", ":")))
        return 0

    if args.command == "record":
        slot = get_user_slot(state, args.user)
        record_event(slot, args.event, now)
        save_state(state_path, state)
        payload = {
            "ok": True,
            "event": args.event,
            "user": args.user,
            "stats": slot["stats"],
            "state_file": str(state_path),
        }
        print(json.dumps(payload, separators=(",", ":")))
        return 0

    parser.error("Unknown command")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
