import { spawn } from "node:child_process";
import path from "node:path";

const PYTHON_DIR = path.join(process.cwd(), "python");

type MemoryOp = "embed" | "rank" | "extract" | "summarize" | "redact";

function pythonBinary() {
  return process.env.MEMORY_PYTHON?.trim() || (process.platform === "win32" ? "python" : "python3");
}

export function memoryPythonEnabled() {
  return process.env.MEMORY_DISABLE_PYTHON !== "1";
}

export async function runMemoryPython<T>(op: MemoryOp, payload: Record<string, unknown>): Promise<T | null> {
  if (!memoryPythonEnabled()) return null;
  const bin = pythonBinary();
  const args = ["-m", "darkbyte_memory"];
  return new Promise((resolve) => {
    const child = spawn(bin, args, {
      cwd: PYTHON_DIR,
      env: { ...process.env, PYTHONPATH: PYTHON_DIR },
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      if (code !== 0) {
        if (stderr && process.env.NODE_ENV === "development") {
          console.warn("[memory-python]", stderr.slice(0, 300));
        }
        resolve(null);
        return;
      }
      try {
        const parsed = JSON.parse(stdout) as T & { error?: string };
        if (parsed && typeof parsed === "object" && "error" in parsed && parsed.error) {
          resolve(null);
          return;
        }
        resolve(parsed);
      } catch {
        resolve(null);
      }
    });
    child.stdin.write(JSON.stringify({ op, ...payload }));
    child.stdin.end();
  });
}