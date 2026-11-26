const SECRET_PATTERNS = [
  /\b(?:password|passwd|api[_\s-]?key|secret|token)\s*[:=]\s*\S+/gi,
  /\bsk-[a-zA-Z0-9]{10,}\b/g,
  /\bghp_[a-zA-Z0-9]{20,}\b/g,
  /\bBearer\s+[a-zA-Z0-9._\-]+\b/g,
  /\bAKIA[0-9A-Z]{16}\b/g,
];

export function redactSensitiveText(text: string): string {
  let out = text;
  for (const pattern of SECRET_PATTERNS) {
    out = out.replace(pattern, "[redacted]");
  }
  return out;
}