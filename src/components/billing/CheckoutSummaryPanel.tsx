"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import {
  type BillingInterval,
  type SubscriptionPlanId,
  findSubscriptionPlan,
  subscriptionOffer,
} from "@/lib/subscription-plans";

type Props = {
  planId: SubscriptionPlanId;
  interval: BillingInterval;
  onIntervalChange?: (interval: BillingInterval) => void;
  mode: "stripe" | "demo";
  annualSavingsPercent?: number;
};

export default function CheckoutSummaryPanel({
  planId,
  interval,
  onIntervalChange,
  mode,
  annualSavingsPercent = 17,
}: Props) {
  const plan = findSubscriptionPlan(planId);
  const offer = plan ? subscriptionOffer(plan.id, interval) : null;
  const alternate = interval === "month" ? "year" : "month";
  const alternateOffer = plan ? subscriptionOffer(plan.id, alternate) : null;

  if (!plan || !offer) return null;

  const monthlyEquivalent =
    alternate === "year" && alternateOffer ? alternateOffer.amountCents / 12 / 100 : null;

  return (
    <aside className="checkout-summary flex flex-col gap-6" aria-labelledby="checkout-summary-heading">
      <div className="flex items-center gap-3 text-sm text-zinc-400">
        <Link href="/#subscriptions" className="hover:text-white" aria-label="Back to plans">
          ←
        </Link>
        <span className="pixel-font text-xs text-purple-400">DARKBYTE</span>
      </div>

      <h1 id="checkout-summary-heading" className="pixel-font text-sm leading-relaxed text-zinc-100 sm:text-base">
        Subscribe to {plan.name}
      </h1>
      <p className="text-4xl font-bold tracking-tight text-white">
        ${(offer.amountCents / 100).toFixed(2)}
        <span className="text-lg font-normal text-zinc-500"> per {interval === "month" ? "month" : "year"}</span>
      </p>

      <article
        className="checkout-glass-panel rounded-xl border border-zinc-700/80 p-5"
        style={{ "--plan-color": plan.color } as CSSProperties}
      >
        <div className="flex gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-zinc-600 bg-black/60 text-xl"
            style={{ color: plan.color, boxShadow: `0 0 20px ${plan.color}33` }}
            aria-hidden="true"
          >
            ⬢
          </div>
          <div>
            <p className="font-semibold text-white">{plan.name}</p>
            <p className="text-sm text-zinc-400">{offer.label} · {offer.credits.toLocaleString()} credits / period</p>
            <p className="mt-2 text-lg font-bold" style={{ color: plan.color }}>
              ${(offer.amountCents / 100).toFixed(2)}
            </p>
          </div>
        </div>
        <p className="mt-4 border-t border-zinc-800 pt-4 text-xs leading-relaxed text-zinc-500">
          {plan.features[0]}
        </p>
      </article>

      {onIntervalChange && alternateOffer && (
        <label className="checkout-glass-panel flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-zinc-700/60 p-4">
          <span className="text-sm text-zinc-300">
            Save with annual billing
            <span className="ml-2 rounded bg-emerald-950 px-2 py-0.5 text-xs text-emerald-400">
              ~{annualSavingsPercent}%
            </span>
          </span>
          <input
            type="checkbox"
            className="h-5 w-5 accent-purple-500"
            checked={interval === "year"}
            onChange={() => onIntervalChange(interval === "month" ? "year" : "month")}
          />
        </label>
      )}

      <dl className="space-y-3 border-t border-zinc-800 pt-4 text-sm">
        <div className="flex justify-between text-zinc-400">
          <dt>Subtotal</dt>
          <dd className="text-white">${(offer.amountCents / 100).toFixed(2)}</dd>
        </div>
        <div className="flex justify-between text-base font-bold text-white">
          <dt>Total due today</dt>
          <dd>${(offer.amountCents / 100).toFixed(2)}</dd>
        </div>
      </dl>

      <p className="text-xs text-zinc-500">
        {mode === "demo" ? (
          <span className="text-amber-400">DEMO MODE — simulated only</span>
        ) : (
          <span className="text-emerald-400">Stripe sandbox · test mode</span>
        )}
      </p>
      {monthlyEquivalent !== null && interval === "year" && (
        <p className="text-xs text-zinc-500">≈ ${monthlyEquivalent.toFixed(2)} / month billed yearly</p>
      )}
    </aside>
  );
}
