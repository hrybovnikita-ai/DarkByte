import re
from typing import Any

NAME_RE = re.compile(r"(?i)\b(?:my name is|call me|i am)\s+([A-Za-z][A-Za-z0-9 _'-]{1,48})", re.I)
PREF_RE = re.compile(
    r"(?i)\b(?:i prefer|i like|i love|i hate|i dislike|please always|remember that i)\s+(.{3,200})",
)
REMEMBER_RE = re.compile(r"(?i)\b(?:remember that|don't forget|keep in mind)\s+(.{3,240})")
FORGET_RE = re.compile(
    r"(?i)\b(?:forget(?: about)?|delete(?: from)? memory|remove from memory)\s+(.{2,200})",
)
FORGET_ALL_RE = re.compile(r"(?i)\b(?:forget everything|delete all my memories|clear my memory)\b")


def extract_from_turn(user: str, assistant: str) -> dict[str, Any]:
    user = user.strip()
    assistant = assistant.strip()
    facts: list[dict[str, Any]] = []
    preferences: list[dict[str, str]] = []
    forget_phrases: list[str] = []
    forget_all = False

    if FORGET_ALL_RE.search(user):
        forget_all = True

    for match in FORGET_RE.finditer(user):
        forget_phrases.append(match.group(1).strip().rstrip("."))

    for match in NAME_RE.finditer(user):
        name = match.group(1).strip()
        facts.append({"kind": "FACT", "content": f"User's name is {name}.", "importance": 0.9})
        preferences.append({"key": "display_name", "value": name})

    for match in PREF_RE.finditer(user):
        phrase = match.group(1).strip().rstrip(".")
        facts.append({"kind": "PREFERENCE", "content": f"User preference: {phrase}", "importance": 0.7})
        preferences.append({"key": f"preference:{phrase[:48].lower()}", "value": phrase})

    for match in REMEMBER_RE.finditer(user):
        phrase = match.group(1).strip().rstrip(".")
        facts.append({"kind": "FACT", "content": phrase, "importance": 0.85})

    if assistant and len(user) > 12:
        snippet = user if len(user) < 160 else user[:157] + "..."
        facts.append(
            {
                "kind": "EPISODE",
                "content": f"Recent topic: {snippet}",
                "importance": 0.35,
            }
        )

    return {
        "facts": facts,
        "preferences": preferences,
        "forget_phrases": forget_phrases,
        "forget_all": forget_all,
    }