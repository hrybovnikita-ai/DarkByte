import re

SECRET_PATTERNS = [
    re.compile(r"(?i)\b(?:password|passwd|api[_\s-]?key|secret|token)\s*[:=]\s*\S+"),
    re.compile(r"\bsk-[a-zA-Z0-9]{10,}\b"),
    re.compile(r"\bghp_[a-zA-Z0-9]{20,}\b"),
    re.compile(r"\bBearer\s+[a-zA-Z0-9._\-]+\b"),
    re.compile(r"(?i)\bAKIA[0-9A-Z]{16}\b"),
]


def redact_text(text: str) -> str:
    out = text
    for pattern in SECRET_PATTERNS:
        out = pattern.sub("[redacted]", out)
    return out