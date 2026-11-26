"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-fetch";

type DemoStatus = {
  isolated: boolean;
  demoCreditBalance: number;
  subscription: {
    planName: string;
    billingPeriod: string;
    demoCredits: number;
    currentPeriodEnd: string | null;
  } | null;
  payments: Array<{
    transactionId: string;
    planName: string;
    amountCents: number;
    paymentMethod: string;
    status: string;
    createdAt: string;
    receiptSent: boolean;
  }>;
};

export default function AccountDemoBilling() {
  const { user } = useAuth();
  const [status, setStatus] = useState<DemoStatus | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiFetch("/api/demo/billing/status", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Demo billing unavailable.");
      setStatus(body.data as DemoStatus);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Demo billing unavailable.");
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  if (!user) return null;

  return (
    <section
      id="demo-billing"
      className="mt-10 scroll-mt-24 border border-amber-900/70 bg-[#101010] p-5 sm:p-7"
    >
      <p className="text-xs tracking-widest text-amber-400">{"// DEMO ENVIRONMENT"}</p>
      <h2 className="pixel-font mt-4 text-sm">DEMO BILLING (ISOLATED)</h2>
      <p className="mt-3 text-xs leading-relaxed text-amber-200/80">
        Demo credits and subscriptions do not affect your real balance or paid features.
      </p>
      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      <p className="mt-5 text-3xl font-bold text-amber-300">
        {status?.demoCreditBalance.toLocaleString("en-US") ?? "—"}{" "}
        <span className="text-sm text-zinc-500">DEMO CR</span>
      </p>
      {status?.subscription && (
        <p className="mt-4 text-sm text-zinc-300">
          Demo plan: <strong>{status.subscription.planName}</strong> ({status.subscription.billingPeriod})
        </p>
      )}
      <Link
        href="/#subscriptions"
        className="mt-5 inline-block border border-amber-700 px-4 py-2 text-sm text-amber-200 hover:bg-amber-950/40"
      >
        TRY DEMO CHECKOUT
      </Link>
      <h3 className="mt-8 border-t border-zinc-800 pt-6 text-xs tracking-widest text-zinc-400">DEMO HISTORY</h3>
      {!status ? (
        <p className="mt-4 text-sm text-zinc-500">Loading…</p>
      ) : status.payments.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No demo payments yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-800 text-sm">
          {status.payments.map((payment) => (
            <li key={payment.transactionId} className="py-4">
              <p className="text-zinc-200">
                {payment.planName} — ${(payment.amountCents / 100).toFixed(2)} · {payment.paymentMethod}
              </p>
              <p className="mt-1 font-mono text-xs text-zinc-500">{payment.transactionId}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}