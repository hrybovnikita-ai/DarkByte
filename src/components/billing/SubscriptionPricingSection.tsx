"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import {
  BILLING_PERIODS,
  SUBSCRIPTION_PLANS,
  subscriptionOffer,
  type BillingInterval,
} from "@/lib/subscription-plans";
import { useAuth } from "@/contexts/auth-context";

const skull = ["00111100", "01111110", "11111111", "11011011", "11011011", "01111110", "00111100", "00100100"];

export default function SubscriptionPricingSection() {
  const { user, loading } = useAuth();
  const [interval, setInterval] = useState<BillingInterval>("month");

  return (
    <section
      id="subscriptions"
      aria-labelledby="subscriptions-heading"
      className="pricing-section mx-auto max-w-6xl scroll-mt-28 px-6 py-24"
    >
      <div className="mb-14 text-center">
        <p className="mb-4 text-xs tracking-[0.25em] text-emerald-400">{"// SUBSCRIBE & RECHARGE"}</p>
        <h2 id="subscriptions-heading" className="pixel-font text-xl leading-relaxed sm:text-3xl">
          SUBSCRIPTION PLANS
        </h2>
        <p className="mt-5 text-zinc-400">
          Recurring credits every billing period. Stripe Checkout in test mode — no real charges.
        </p>
        <div className="mt-8 inline-flex gap-2 rounded-full border border-zinc-700 p-1" role="tablist" aria-label="Billing period">
          {BILLING_PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              role="tab"
              aria-selected={interval === period}
              className={
                "rounded-full px-5 py-2 text-xs tracking-widest transition " +
                (interval === period
                  ? "bg-emerald-600 text-[#080808]"
                  : "text-zinc-400 hover:text-white")
              }
              onClick={() => setInterval(period)}
            >
              {period === "month" ? "MONTHLY" : "YEARLY"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-7 md:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const offer = subscriptionOffer(plan.id, interval)!;
          const href = `/checkout?plan=${plan.id}&interval=${interval}`;
          return (
            <article
              key={plan.id}
              className={"credit-plan " + (plan.id === "pro" ? "credit-plan-popular" : "")}
              style={{ "--plan-color": plan.color } as CSSProperties}
            >
              {plan.id === "pro" && <span className="credit-popular pixel-font">RECOMMENDED</span>}
              <div
                aria-hidden="true"
                className="mx-auto mb-7 grid w-14 grid-cols-8 [filter:drop-shadow(0_0_12px_var(--plan-color))]"
              >
                {skull.flatMap((row, y) =>
                  [...row].map((pixel, x) => (
                    <span
                      key={y + "-" + x}
                      className="aspect-square"
                      style={{ background: pixel === "1" ? plan.color : "transparent" }}
                    />
                  )),
                )}
              </div>
              <h3 className="pixel-font text-sm uppercase" style={{ color: plan.color }}>
                {plan.name}
              </h3>
              <p className="mt-6 text-4xl font-bold">
                ${offer.amountCents / 100}
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  USD / {interval === "month" ? "mo" : "yr"}
                </span>
              </p>
              <p className="mt-3 text-sm text-zinc-400">{offer.label} billing</p>
              <div className="my-6 border-y border-zinc-800 py-6">
                <p className="text-3xl font-bold" style={{ color: plan.color }}>
                  {offer.credits.toLocaleString("en-US")}
                </p>
                <p className="mt-2 text-xs tracking-widest text-zinc-300">CREDITS / PERIOD</p>
              </div>
              <ul className="mb-7 space-y-4 text-left text-sm text-zinc-300">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <span aria-hidden="true" className="mr-3" style={{ color: plan.color }}>
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              {user || loading ? (
                <Link
                  href={loading ? "#" : href}
                  className={"credit-buy " + (loading ? "pointer-events-none opacity-60" : "")}
                  aria-label={`Subscribe to ${plan.name} ${offer.label}`}
                >
                  {loading ? "LOADING…" : "UPGRADE / SUBSCRIBE"}
                </Link>
              ) : (
                <Link
                  href={`/sign-in?callbackUrl=${encodeURIComponent(href)}`}
                  className="credit-buy"
                  aria-label={`Sign in to subscribe to ${plan.name}`}
                >
                  SIGN IN TO SUBSCRIBE
                </Link>
              )}
            </article>
          );
        })}
      </div>
      <p className="mt-8 text-center text-xs tracking-widest text-zinc-400">
        VISA · MASTERCARD · GOOGLE PAY · APPLE PAY · IN-APP CHECKOUT
      </p>
      <p className="mt-3 text-center text-xs text-zinc-500">Sandbox test mode only. Stripe collects card details — never stored on DARKBYTE.</p>
    </section>
  );
}