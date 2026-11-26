from __future__ import annotations

from typing import Any


def summarize_messages(messages: list[dict[str, str]], max_chars: int = 900) -> str:
    """Extractive summary: first user intents + last exchange."""
    if not messages:
        return ""
    users = [m["content"].strip() for m in messages if m.get("role") == "user" and m.get("content")]
    assistants = [
        m["content"].strip() for m in messages if m.get("role") == "assistant" and m.get("content")
    ]
    parts: list[str] = []
    if users:
        parts.append(f"User goals: {'; '.join(users[:3])}")
    if assistants:
        parts.append(f"Latest assistant reply: {assistants[-1][:280]}")
    body = " ".join(parts).strip()
    if len(body) > max_chars:
        return body[: max_chars - 3] + "..."
    return body