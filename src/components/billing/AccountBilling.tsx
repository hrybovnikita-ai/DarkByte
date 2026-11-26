"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-fetch";

type BillingPayment = {
  id: string;
  planName: string;
  billingPeriod: string;
  amountCents: number;
  status: string;
  transactionId: string;
  cardBrand: string | null;
  cardLast4: string | null;
  createdAt: string;
  creditsGranted: boolean;
};

type BillingStatus = {
  subscription: {
    planName: string;
    billingPeriod: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  payments: BillingPayment[];
};

export default function AccountBilling() {
  const { user } = useAuth();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [error, setError] = useState("");
  const [toast] = useState(() => {
    if (typeof window === "undefined") return "";
    const params = new URLSearchParams(window.location.search);
    return params.get("checkout") === "success" && params.get("kind") === "subscription"
      ? "Payment successful! Your subscription credits arrive after Stripe verifies the payment."
      : "";
  });

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const response = await apiFetch("/api/billing/status", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Billing unavailable.");
      setStatus(body.data as BillingStatus);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Billing unavailable.");
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
    <section id="billing" className="mt-10 scroll-mt-24 border border-emerald-900/80 bg-[#101010] p-5 sm:p-7">
      <p className="text-xs tracking-widest text-emerald-400">{"// SUBSCRIPTION BILLING"}</p>
      <h2 className="pixel-font mt-4 text-sm">BILLING &amp; HISTORY</h2>
      {toast && (
        <p role="status" className="mt-4 rounded border border-emerald-800 bg-emerald-950/30 p-3 text-sm text-emerald-200">
          {toast}
        </p>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
      {status?.subscription ? (
        <div className="mt-6 text-sm text-zinc-300">
          <p>
            <span className="text-zinc-500">Active plan:</span>{" "}
            <strong className="text-emerald-300">{status.subscription.planName}</strong> (
            {status.subscription.billingPeriod})
          </p>
          <p className="mt-2">
            <span className="text-zinc-500">Status:</span> {status.subscription.status}
            {status.subscription.cancelAtPeriodEnd ? " · cancels at period end" : ""}
          </p>
          {status.subscription.currentPeriodEnd && (
            <p className="mt-2 text-xs text-zinc-500">
              Current period ends {new Date(status.subscription.currentPeriodEnd).toLocaleString()}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">No active subscription yet.</p>
      )}
      <Link
        href="/#subscriptions"
        className="mt-5 inline-block border border-emerald-700 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-900/30"
      >
        VIEW SUBSCRIPTION PLANS
      </Link>
      <h3 className="mt-8 border-t border-zinc-800 pt-6 text-xs tracking-widest text-zinc-400">BILLING HISTORY</h3>
      {!status ? (
        <p className="mt-4 text-sm text-zinc-500">Loading billing history…</p>
      ) : status.payments.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No subscription payments yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-zinc-800">
          {status.payments.map((payment) => (
            <li key={payment.id} className="py-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <PaymentTitle payment={payment} />
                <span className={payment.status === "SUCCEEDED" ? "text-emerald-400" : "text-amber-400"}>
                  {payment.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {new Date(payment.createdAt).toLocaleString()} · ID {payment.transactionId}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PaymentTitle({ payment }: { payment: BillingPayment }) {
  const method =
    payment.cardBrand && payment.cardLast4
      ? `${payment.cardBrand} ···· ${payment.cardLast4}`
      : "Stripe";
  return (
    <div>
      <p className="text-zinc-200">
        {payment.planName} ({payment.billingPeriod}) — ${(payment.amountCents / 100).toFixed(2)}
      </p>
      <p className="text-xs text-zinc-500">{method}</p>
    </div>
  );
}