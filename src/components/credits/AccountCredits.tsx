"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";

type Entry = { id: string; amount: number; kind: string; description: string; createdAt: string; stripeSessionId: string | null };
type Wallet = { userId: string; balance: number; items: Entry[]; nextCursor: string | null };

export default function AccountCredits() {
  const { user } = useAuth();
  const userId = user?.id;
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState<"pending" | "confirmed" | "waiting" | null>(null);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(false);
  const current = wallet?.userId === userId ? wallet : null;

  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!userId) return false;
    try {
      const responses = await Promise.all([
        fetch("/api/credits/balance", { cache: "no-store", signal }),
        fetch("/api/credits/history", { cache: "no-store", signal }),
      ]);
      const [balance, history] = await Promise.all(responses.map((r) => r.json()));
      if (responses.some((r) => !r.ok) || !balance.success || !history.success) {
        throw new Error(balance.error?.message ?? history.error?.message ?? "Could not load credits.");
      }
      if (!mounted.current || signal?.aborted) return false;
      setWallet({ userId, balance: balance.data.balance, ...history.data });
      setError("");
      const query = new URLSearchParams(window.location.search);
      const sessionId = query.get("session_id");
      const confirmed = Boolean(sessionId && history.data.items.some((entry: Entry) => entry.stripeSessionId === sessionId));
      if (query.get("checkout") === "success") setPayment(confirmed ? "confirmed" : "pending");
      window.dispatchEvent(new Event("credits-updated"));
      return confirmed;
    } catch (reason) {
      if (mounted.current && !signal?.aborted) setError(reason instanceof Error ? reason.message : "Could not load credits.");
      return false;
    }
  }, [userId]);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    async function poll() {
      const confirmed = await refresh(controller.signal);
      const returned = new URLSearchParams(window.location.search).get("checkout") === "success";
      if (!controller.signal.aborted && returned && !confirmed) {
        if (++attempts < 30) timer = setTimeout(poll, 2000);
        else setPayment("waiting");
      }
    }
    void poll();
    return () => { mounted.current = false; controller.abort(); if (timer) clearTimeout(timer); };
  }, [refresh]);

  async function loadMore() {
    if (!current?.nextCursor || busy) return;
    setBusy(true);
    try {
      const response = await fetch("/api/credits/history?cursor=" + encodeURIComponent(current.nextCursor), { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error("Could not load more transactions.");
      setWallet((previous) => previous && previous.userId === userId ? {
        ...previous,
        items: [...previous.items, ...body.data.items.filter((entry: Entry) => !previous.items.some((old) => old.id === entry.id))],
        nextCursor: body.data.nextCursor,
      } : previous);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not load more transactions.");
    } finally { setBusy(false); }
  }

  if (!userId) return null;
  return (
    <section id="credits" aria-labelledby="credit-heading" className="mt-10 scroll-mt-24 border border-purple-900 bg-[#101010] p-5 sm:p-7">
      <p className="text-xs tracking-widest text-purple-400">{"// YOUR POWER RESERVE"}</p>
      <h2 id="credit-heading" className="pixel-font mt-4 text-sm">YOUR CREDITS</h2>
      <p className="mt-5 text-4xl font-bold text-purple-300" aria-live="polite">{current?.balance.toLocaleString("en-US") ?? "—"} <span className="text-sm text-zinc-400">CR</span></p>
      {payment && <p role="status" className="mt-4 text-sm text-amber-300">{
        payment === "confirmed" ? "Payment verified. Your credits have been added." :
        payment === "waiting" ? "Payment confirmation is still pending. Refresh shortly; your credits appear after the payment is verified." :
        "Waiting for verified payment confirmation…"
      }</p>}
      <div className="mt-5 flex flex-wrap gap-4 text-sm">
        <Link href="/#pricing" className="border border-purple-600 bg-purple-950/40 px-4 py-2 text-purple-200 hover:bg-purple-900/40">BUY CREDITS</Link>
        <button type="button" onClick={() => void refresh()} className="px-3 py-2 text-zinc-400 hover:text-white">Refresh balance</button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      <h3 className="mt-8 border-t border-zinc-800 pt-6 text-xs tracking-widest text-zinc-400">TRANSACTION HISTORY</h3>
      {!current ? <p className="mt-4 text-sm text-zinc-500">{error ? "History unavailable." : "Loading history…"}</p> :
        current.items.length === 0 ? <p className="mt-4 text-sm text-zinc-500">No transactions yet. Your first credit pack starts here.</p> :
        <ul className="mt-4 divide-y divide-zinc-800">
          {current.items.map((entry) => <li key={entry.id} className="flex items-center justify-between gap-4 py-4 text-sm">
            <div><p className="capitalize text-zinc-200">{entry.description}</p><time dateTime={entry.createdAt} className="mt-1 block text-xs text-zinc-500">{new Date(entry.createdAt).toLocaleString()}</time></div>
            <span className={"shrink-0 font-bold " + (entry.amount > 0 ? "text-purple-300" : "text-red-300")}>{entry.amount > 0 ? "+" : ""}{entry.amount.toLocaleString("en-US")} CR</span>
          </li>)}
        </ul>}
      {current?.nextCursor && <button type="button" disabled={busy} onClick={() => void loadMore()} className="mt-4 text-sm text-purple-300 disabled:opacity-50">{busy ? "Loading…" : "Load older transactions"}</button>}
    </section>
  );
}
