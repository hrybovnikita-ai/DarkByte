"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-fetch";

export default function CreditBalance() {
  const { user } = useAuth();
  const [result, setResult] = useState<{ userId: string; balance: number | null; error: boolean } | null>(null);
  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await apiFetch("/api/credits/balance", { cache: "no-store", signal: controller.signal });
        if (response.status === 401) return;
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error("Balance unavailable");
        if (!controller.signal.aborted) setResult({ userId: userId!, balance: body.data.balance, error: false });
      } catch {
        if (!controller.signal.aborted) setResult({ userId: userId!, balance: null, error: true });
      }
    }
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 30_000);
    window.addEventListener("focus", refresh);
    window.addEventListener("credits-updated", refresh);
    return () => {
      controller.abort();
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("credits-updated", refresh);
    };
  }, [userId]);
  if (!userId) return null;
  const current = result?.userId === userId ? result : null;
  return (
    <Link href="/account#credits" className="shrink-0 border border-purple-800 bg-purple-950/20 px-2 py-2 text-xs text-purple-300 transition hover:border-purple-400 sm:px-3"
      aria-label={current?.error ? "Credit balance unavailable. Open account to retry." : "Your credit balance"}
      title={current?.error ? "Balance unavailable" : "View balance and transaction history"}>
      <span aria-live="polite">{current?.error ? "—" : current?.balance?.toLocaleString("en-US") ?? "…"}</span>
      <span className="ml-1">CR</span>
    </Link>
  );
}
