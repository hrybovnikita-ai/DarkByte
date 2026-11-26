"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthProvider";
import { CREDIT_PLANS, type CreditPlanId } from "@/lib/credit-plans";

const skull = ["00111100", "01111110", "11111111", "11011011", "11011011", "01111110", "00111100", "00100100"];

export default function PricingSection() {
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState<CreditPlanId | null>(null);
  const [error, setError] = useState("");
  const attempt = useRef<{ planId: CreditPlanId; key: string } | null>(null);
  const inFlight = useRef(false);

  async function checkout(planId: CreditPlanId) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(planId);
    setError("");
    if (attempt.current?.planId !== planId) attempt.current = { planId, key: crypto.randomUUID() };
    try {
      const response = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": attempt.current.key },
        body: JSON.stringify({ planId }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        if (response.status === 409) attempt.current = null;
        throw new Error(body.error?.message ?? "Unable to start checkout. Please try again.");
      }
      const destination = new URL(body.data.url);
      if (destination.protocol !== "https:" || destination.hostname !== "checkout.stripe.com") {
        throw new Error("Invalid checkout destination.");
      }
      window.location.assign(destination.href);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Checkout unavailable. Please try again.");
      setBusy(null);
      inFlight.current = false;
    }
  }

  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="pricing-section mx-auto max-w-6xl scroll-mt-28 px-6 py-24">
      <div className="mb-14 text-center">
        <p className="mb-4 text-xs tracking-[0.25em] text-red-400">{"// UPGRADE YOUR POWER"}</p>
        <h2 id="pricing-heading" className="pixel-font text-xl leading-relaxed sm:text-3xl">CHOOSE YOUR PLAN</h2>
        <p className="mt-5 text-zinc-400">Unlock more power. Explore beyond the darkness.</p>
      </div>
      <div className="grid gap-7 md:grid-cols-3">
        {CREDIT_PLANS.map((plan) => (
          <article key={plan.id} className={"credit-plan " + (plan.id === "pro" ? "credit-plan-popular" : "")}
            style={{ "--plan-color": plan.color } as CSSProperties}>
            {plan.id === "pro" && <span className="credit-popular pixel-font">MOST POPULAR</span>}
            <div aria-hidden="true" className="mx-auto mb-7 grid w-14 grid-cols-8 [filter:drop-shadow(0_0_12px_var(--plan-color))]">
              {skull.flatMap((row, y) => [...row].map((pixel, x) => (
                <span key={y + "-" + x} className="aspect-square" style={{ background: pixel === "1" ? plan.color : "transparent" }} />
              )))}
            </div>
            <h3 className="pixel-font text-sm uppercase" style={{ color: plan.color }}>{plan.name}</h3>
            <p className="mt-6 text-4xl font-bold">${plan.amountCents / 100}<span className="ml-2 text-xs font-normal text-zinc-500">USD</span></p>
            <p className="mt-3 text-sm text-zinc-400">One-time payment</p>
            <div className="my-6 border-y border-zinc-800 py-6">
              <p className="text-3xl font-bold" style={{ color: plan.color }}>{plan.credits.toLocaleString("en-US")}</p>
              <p className="mt-2 text-xs tracking-widest text-zinc-300">DARKBYTE CREDITS</p>
            </div>
            <ul className="mb-7 space-y-4 text-left text-sm text-zinc-300">
              {plan.features.map((feature) => <li key={feature}><span aria-hidden="true" className="mr-3" style={{ color: plan.color }}>✓</span>{feature}</li>)}
            </ul>
            {user || loading ? (
              <button type="button" className="credit-buy" disabled={loading || busy !== null} onClick={() => void checkout(plan.id)}>
                {busy === plan.id ? "OPENING CHECKOUT…" : "BUY CREDITS"}
              </button>
            ) : (
              <Link href="/sign-in" className="credit-buy" aria-label={"Sign in to buy " + plan.name + " credits"}>BUY CREDITS</Link>
            )}
          </article>
        ))}
      </div>
      {error && <p role="alert" className="mt-6 border border-red-900 bg-red-950/20 p-4 text-center text-sm text-red-300">{error}</p>}
      <p className="mt-8 text-center text-xs tracking-widest text-zinc-400">SECURE PAYMENTS // STRIPE POWERED</p>
      <p className="mt-3 text-center text-xs text-zinc-500">Test mode · No real charges. Credit packs do not unlock modules marked coming soon.</p>
    </section>
  );
}
