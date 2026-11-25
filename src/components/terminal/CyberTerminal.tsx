"use client";

import { useCallback, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { WORLDS, DESIGN_COLORS } from "@/config/worlds";

type LogLine = { type: "in" | "out" | "err"; text: string };

const PROMPT = "darkbyte@universe:~$ ";

function buildHelp(): string {
  return [
    "Available commands:",
    "  help    — show this message",
    "  about   — about DARKBYTE 2.0",
    "  worlds  — list digital dimensions",
    "  status  — fictional system status",
    "  clear   — clear terminal output",
  ].join("\n");
}

function buildAbout(): string {
  return [
    "DARKBYTE 2.0 — Multicolor Pixel Universe",
    "Horror · AI · Retro gaming · Eight themed worlds",
    "All terminal output is fictional client-side narrative.",
  ].join("\n");
}

function buildWorlds(): string {
  return WORLDS.map(
    (w) => `  [${w.number}] ${w.title} → ${w.href}`,
  ).join("\n");
}

function buildStatus(): string {
  return [
    "CORE.............. ONLINE",
    "AI MODULE......... STANDBY",
    "MONSTER DB........ INDEXED",
    "WORLDS............ 8/8 RENDERED",
    "AUTH.............. LOCAL DEMO",
    `SYNC COLOR........ ${DESIGN_COLORS.neonLime}`,
  ].join("\n");
}

function runCommand(input: string): { lines: LogLine[]; clear?: boolean } {
  const cmd = input.trim().toLowerCase();

  if (!cmd) {
    return { lines: [] };
  }

  switch (cmd) {
    case "help":
      return { lines: [{ type: "out", text: buildHelp() }] };
    case "about":
      return { lines: [{ type: "out", text: buildAbout() }] };
    case "worlds":
      return { lines: [{ type: "out", text: buildWorlds() }] };
    case "status":
      return { lines: [{ type: "out", text: buildStatus() }] };
    case "clear":
      return { lines: [], clear: true };
    default:
      return {
        lines: [
          {
            type: "err",
            text: `Unknown command: ${input}. Type 'help' for options.`,
          },
        ],
      };
  }
}

type CyberTerminalProps = {
  compact?: boolean;
};

export default function CyberTerminal({ compact = false }: CyberTerminalProps) {
  const [lines, setLines] = useState<LogLine[]>([
    { type: "out", text: "DARKBYTE TERMINAL v2.0 — type 'help' to begin." },
  ]);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const submit = useCallback((raw: string) => {
    const display = `${PROMPT}${raw}`;
    setLines((prev) => [...prev, { type: "in", text: display }]);
    const result = runCommand(raw);
    if (result.clear) {
      setLines([]);
      return;
    }
    if (result.lines.length) {
      setLines((prev) => [...prev, ...result.lines]);
    }
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit(value);
    setValue("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      return;
    }
    if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  }

  return (
    <div
      className={`crt-effect overflow-hidden border bg-black font-mono text-[var(--db-neon-lime)] ${
        compact ? "text-sm" : "text-base"
      }`}
      style={{ borderColor: `${DESIGN_COLORS.neonLime}55` }}
      onClick={() => inputRef.current?.focus()}
      role="region"
      aria-label="Cyber terminal"
    >
      <div
        ref={scrollRef}
        className={`overflow-y-auto p-4 ${compact ? "h-48" : "h-72 sm:h-96"}`}
      >
        {lines.map((line, i) => (
          <pre
            key={`${i}-${line.text.slice(0, 12)}`}
            className={`mb-2 whitespace-pre-wrap break-words ${
              line.type === "err"
                ? "text-[var(--db-blood-red)]"
                : line.type === "in"
                  ? "text-[var(--db-ice-white)]"
                  : ""
            }`}
          >
            {line.text}
          </pre>
        ))}
      </div>
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 border-t border-zinc-800 bg-[#050505] px-4 py-3"
      >
        <span className="shrink-0 text-[var(--db-neon-lime)]">{PROMPT}</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-[var(--db-ice-white)] outline-none"
          aria-label="Terminal command input"
          autoComplete="off"
          spellCheck={false}
        />
        <span className="crt-cursor inline-block h-4 w-2 bg-[var(--db-neon-lime)]" />
      </form>
    </div>
  );
}