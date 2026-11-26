"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import {
  BILLING_PERIODS,
  findSubscriptionPlan,
  subscriptionOffer,
  type BillingInterval,
  type SubscriptionPlanId,
} from "@/lib/subscription-plans";
import { useAuth } from "@/contexts/auth-context";
import PixelSkeleton from "@/components/ui/PixelSkeleton";

const TEST_CARDS = [
  { label: "Visa — success", number: "4242424242424242" },
  { label: "Mastercard — success", number: "5555555555554444" },
  { label: "Generic decline", number: "4000000000000002" },
  { label: "Expiry", number: "12/29" },
  { label: "CVC", number: "123" },
  { label: "Cardholder", number: "TEST USER" },
] as const;

function isAllowedCheckoutUrl(url: string) {
  try {
    const destination = new URL(url);
    return destination.protocol === "https:" && destination.hostname === "checkout.stripe.com";
  } catch {
    return false;
  }
}

function CheckoutBody() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const planId = (params.get("plan") ?? "pro") as SubscriptionPlanId;
  const interval = (BILLING_PERIODS as readonly string[]).includes(params.get("interval") ?? "")
    ? (params.get("interval") as BillingInterval)
    : "month";
  const plan = findSubscriptionPlan(planId);
  const offer = plan ? subscriptionOffer(plan.id, interval) : null;

  const [phase, setPhase] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const attempt = useRef<{ key: string } | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      const back = `/checkout?plan=${planId}&interval=${interval}`;
      router.replace(`/sign-in?callbackUrl=${encodeURIComponent(back)}`);
    }
  }, [loading, user, router, planId, interval]);

  async function launchCheckout() {
    if (inFlight.current || !offer) return;
    inFlight.current = true;
    setPhase("loading");
    setMessage("");
    if (!attempt.current) attempt.current = { key: crypto.randomUUID() };
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": attempt.current.key },
        body: JSON.stringify({ planId: plan!.id, interval }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        if (response.status === 409) attempt.current = null;
        throw new Error(body.error?.message ?? "Unable to start checkout. Please try again.");
      }
      if (!isAllowedCheckoutUrl(body.data.url)) throw new Error("Invalid checkout destination.");
      window.location.assign(body.data.url);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Checkout unavailable. Please try again.");
      setPhase("error");
      inFlight.current = false;
    }
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard may be blocked */
    }
  }

  if (!plan || !offer) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-sm text-red-300">Unknown plan. Return to pricing and choose a subscription.</p>
        <Link href="/#subscriptions" className="mt-8 inline-block border border-zinc-600 px-6 py-3 text-sm text-zinc-200">
          VIEW PLANS
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-20">
      <p className="text-xs tracking-[0.25em] text-emerald-400">DARKBYTE — Checkout</p>
      <h1 className="pixel-font mt-4 text-xl text-zinc-100">SECURE STRIPE CHECKOUT</h1>
      <p className="mt-4 text-sm text-zinc-400">
        {plan.name} · ${(offer.amountCents / 100).toFixed(2)} USD · {offer.label}
      </p>

      <article className="billing-checkout-card mt-10 rounded-2xl border border-zinc-700 bg-[#121212] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-300">
          <span className="billing-pay-logo">VISA</span>
          <span className="billing-pay-logo">Mastercard</span>
          <span className="billing-pay-logo">Google Pay</span>
          <span className="billing-pay-logo">Apple Pay</span>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-400">
          Card number, expiry, CVC, name and billing email are collected on Stripe&apos;s hosted page. DARKBYTE never
          sees or stores full card data.
        </p>
        {loading || !user ? (
          <PixelSkeleton className="mt-8" lines={2} />
        ) : (
          <button
            type="button"
            className="credit-buy mt-8 w-full"
            disabled={phase === "loading"}
            onClick={() => void launchCheckout()}
          >
            {phase === "loading" ? "OPENING STRIPE CHECKOUT…" : "CONTINUE TO STRIPE"}
          </button>
        )}
        {phase === "error" && message && (
          <p role="alert" className="mt-4 text-center text-sm text-red-300">
            {message}
          </p>
        )}
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-emerald-400">
          <span aria-hidden="true">🛡</span>
          Test mode only · No real money charged
        </p>
      </article>

      <section className="mt-10 rounded-2xl border border-zinc-800 bg-[#0d0d0d] p-6" aria-labelledby="test-cards">
        <p id="test-cards" className="text-xs tracking-widest text-zinc-500">
          STRIPE SANDBOX TEST DATA
        </p>
        <div className="mt-4 rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black p-5">
          <div className="flex items-start justify-between gap-4">
            <BrandChip />
            <span className="text-xs font-bold text-lime-400">VISA TEST</span>
          </div>
          <p className="mt-6 font-mono text-2xl tracking-widest text-white">4242&nbsp;4242&nbsp;4242&nbsp;4242</p>
          <div className="mt-6 flex justify-between text-xs text-zinc-400">
            <div>
              <p className="tracking-widest">CARDHOLDER</p>
              <p className="mt-1 text-white">TEST USER</p>
            </div>
            <div className="text-right">
              <p className="tracking-widest">EXPIRES</p>
              <p className="mt-1 text-white">12/29</p>
            </div>
          </div>
        </div>
        <ul className="mt-4 divide-y divide-zinc-800">
          {TEST_CARDS.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span className="text-zinc-400">{row.label}</span>
              <button
                type="button"
                className="font-mono text-zinc-200 hover:text-emerald-300"
                onClick={() => void copy(row.number)}
                aria-label={`Copy ${row.label}`}
              >
                {row.number}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function BrandChip() {
  return (
    <div className="text-[10px] leading-none text-amber-400" aria-hidden="true">
      <p className="font-bold tracking-widest text-amber-500">DARKBYTE</p>
      <p className="mt-2 text-lg">⬢</p>
    </div>
  );
}

export default function CheckoutLauncher() {
  return (
    <Suspense fallback={<main className="px-6 py-24"><PixelSkeleton lines={5} /></main>}>
      <CheckoutBody />
    </Suspense>
  );
}