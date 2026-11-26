import { createHash } from "node:crypto";

export function memoryContentHash(content: string): string {
  const norm = content.trim().toLowerCase().replace(/\s+/g, " ");
  return createHash("sha256").update(norm).digest("hex");
}