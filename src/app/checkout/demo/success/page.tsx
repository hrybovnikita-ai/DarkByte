"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import PixelSkeleton from "@/components/ui/PixelSkeleton";
import { findSubscriptionPlan, subscriptionOffer, type BillingInterval } from "@/lib/subscription-plans";

function DemoSuccessBody() {
  const params = useSearchParams();
  const transactionId = params.get("transactionId") ?? "";
  const planId = params.get("plan") ?? "pro";
  const interval = (params.get("interval") ?? "month") as BillingInterval;
  const plan = findSubscriptionPlan(planId);
  const offer = plan ? subscriptionOffer(plan.id, interval) : null;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setRevealed(true), 400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main
      className={
        "mx-auto max-w-lg px-6 py-24 text-center transition-all duration-700 " +
        (revealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")
      }
    >
      <p className="text-xs tracking-[0.25em] text-amber-400">{"// DEMO PAYMENT"}</p>
      <div className="demo-success-pulse mx-auto mt-8 flex h-20 w-20 items-center justify-center rounded-full border-2 border-amber-500 text-3xl text-amber-300">
        ✓
      </div>
      <h1 className="pixel-font mt-8 text-2xl text-zinc-100">PAYMENT SUCCESSFUL</h1>
      <p className="mt-4 text-sm text-amber-200/90">DEMO MODE — isolated demo credits only. Check your inbox for confirmation.</p>
      {plan && offer && (
        <dl className="mt-10 space-y-3 border border-zinc-800 bg-[#101010] p-6 text-left text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Subscription</dt>
            <dd className="font-bold text-white">{plan.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Amount (simulated)</dt>
            <dd>${(offer.amountCents / 100).toFixed(2)} USD</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Transaction ID</dt>
            <dd className="font-mono text-xs text-emerald-300 break-all">{transactionId || "—"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Status</dt>
            <dd className="text-emerald-400">Successful</dd>
          </div>
        </dl>
      )}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Link
          href="/account#demo-billing"
          className="border border-amber-600 bg-amber-600 px-6 py-3 text-sm font-bold text-[#080808]"
        >
          VIEW DEMO BILLING
        </Link>
        <Link href="/" className="border border-zinc-700 px-6 py-3 text-sm text-zinc-300">
          BACK HOME
        </Link>
      </div>
    </main>
  );
}

export default function DemoCheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#080808] font-mono text-white">
      <SiteHeader />
      <Suspense fallback={<main className="px-6 py-24"><PixelSkeleton lines={5} /></main>}>
        <DemoSuccessBody />
      </Suspense>
      <SiteFooter />
    </div>
  );
}