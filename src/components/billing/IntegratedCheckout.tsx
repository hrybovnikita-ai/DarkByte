"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import CheckoutSummaryPanel from "@/components/billing/CheckoutSummaryPanel";
import StripeEmbeddedPayment from "@/components/billing/StripeEmbeddedPayment";
import { stripePublishableKey } from "@/lib/stripe-client";

type CheckoutMode = "stripe" | "demo";
type PayMethod = "visa" | "mastercard" | "google_pay" | "apple_pay";

function resolveMode(pathname: string, queryMode: string | null): CheckoutMode {
  if (pathname.includes("/checkout/demo")) return "demo";
  if (pathname.includes("/checkout/stripe")) return "stripe";
  if (queryMode === "demo") return "demo";
  return stripePublishableKey() ? "stripe" : "demo";
}

function IntegratedCheckoutBody({ forcedMode }: { forcedMode?: CheckoutMode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const planId = (params.get("plan") ?? "pro") as SubscriptionPlanId;
  const [interval, setInterval] = useState<BillingInterval>(
    (BILLING_PERIODS as readonly string[]).includes(params.get("interval") ?? "")
      ? (params.get("interval") as BillingInterval)
      : "month",
  );
  const payMode = forcedMode ?? resolveMode(pathname, params.get("mode"));
  const [method, setMethod] = useState<PayMethod>("visa");
  const [phase, setPhase] = useState<"form" | "processing" | "error">("form");
  const [message, setMessage] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("US");
  const [address, setAddress] = useState("");
  const attempt = useRef<{ key: string } | null>(null);
  const inFlight = useRef(false);

  const plan = findSubscriptionPlan(planId);
  const offer = plan ? subscriptionOffer(plan.id, interval) : null;

  useEffect(() => {
    if (!loading && !user) {
      const back = `${pathname}?plan=${planId}&interval=${interval}`;
      router.replace(`/sign-in?callbackUrl=${encodeURIComponent(back)}`);
    }
  }, [loading, user, router, planId, interval, pathname]);

  async function submitDemoPayment() {
    if (inFlight.current || !offer || !plan) return;
    inFlight.current = true;
    setPhase("processing");
    setMessage("");
    if (!attempt.current) attempt.current = { key: crypto.randomUUID() };
    await new Promise((resolve) => window.setTimeout(resolve, 1600));
    try {
      const response = await fetch("/api/demo/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": attempt.current.key },
        body: JSON.stringify({ planId: plan.id, interval, paymentMethod: method }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Demo payment failed.");
      router.push(
        `/checkout/demo/success?transactionId=${encodeURIComponent(body.data.transactionId)}&plan=${planId}&interval=${interval}`,
      );
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Demo payment unavailable.");
      setPhase("form");
      inFlight.current = false;
    }
  }

  function switchMode(next: CheckoutMode) {
    const base = next === "demo" ? "/checkout/demo" : "/checkout/stripe";
    router.replace(`${base}?plan=${planId}&interval=${interval}`);
  }

  if (!plan || !offer) {
    return (
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-sm text-red-300">Unknown plan.</p>
        <Link href="/#subscriptions" className="mt-8 inline-block border border-zinc-600 px-6 py-3 text-sm">
          VIEW PLANS
        </Link>
      </main>
    );
  }

  const stripeHref = `/checkout/stripe?plan=${planId}&interval=${interval}`;
  const demoHref = `/checkout/demo?plan=${planId}&interval=${interval}`;

  return (
    <main className="checkout-shell mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <div className="checkout-columns grid gap-10 lg:grid-cols-[minmax(280px,1fr)_minmax(320px,1.15fr)]">
        <CheckoutSummaryPanel
          planId={planId}
          interval={interval}
          mode={payMode}
          onIntervalChange={(next) => {
            setInterval(next);
            router.replace(`${pathname}?plan=${planId}&interval=${next}`);
          }}
        />

        <section className="checkout-form-panel rounded-2xl border border-zinc-700/80 bg-[#0c0c0e]/95 p-6 shadow-[0_0_40px_#a855f710] sm:p-8">
          <nav className="mb-8 flex gap-2 rounded-full border border-zinc-700 bg-black/40 p-1" aria-label="Checkout mode">
            <button
              type="button"
              className={"flex-1 rounded-full px-4 py-2 text-xs tracking-widest " + (payMode === "stripe" ? "bg-purple-600 text-black" : "text-zinc-400")}
              onClick={() => switchMode("stripe")}
            >
              STRIPE SANDBOX
            </button>
            <button
              type="button"
              className={"flex-1 rounded-full px-4 py-2 text-xs tracking-widest " + (payMode === "demo" ? "bg-amber-500 text-black" : "text-zinc-400")}
              onClick={() => switchMode("demo")}
            >
              DEMO PAYMENT
            </button>
          </nav>

          {payMode === "demo" && (
            <div className="mb-6 rounded-lg border border-amber-600/50 bg-amber-950/30 px-4 py-3 text-xs text-amber-100">
              <strong className="pixel-font text-amber-400">DEMO MODE</strong> — Do not enter real banking information.
              Card fields never leave your browser.
            </div>
          )}

          {payMode === "stripe" ? (
            loading || !user ? (
              <PixelSkeleton lines={8} />
            ) : stripePublishableKey() ? (
              <StripeEmbeddedPayment planId={planId} interval={interval} contactEmail={user.email} />
            ) : (
              <div className="rounded-lg border border-zinc-700 p-5 text-sm text-zinc-400">
                Stripe embedded checkout needs test keys in <code className="text-purple-300">.env.local</code>.
                <Link href={demoHref} className="mt-4 block text-amber-400 hover:underline">
                  Try demo checkout instead →
                </Link>
              </div>
            )
          ) : phase === "processing" ? (
            <div className="py-16 text-center" role="status">
              <div className="demo-spinner mx-auto" />
              <p className="pixel-font mt-8 text-sm text-amber-300">PROCESSING DEMO PAYMENT…</p>
            </div>
          ) : (
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                void submitDemoPayment();
              }}
            >
              <fieldset>
                <legend className="text-xs tracking-widest text-zinc-500">CONTACT INFORMATION</legend>
                <label className="mt-3 block text-xs text-zinc-500">Email</label>
                <input
                  readOnly
                  value={user?.email ?? ""}
                  className="checkout-input mt-1 w-full"
                />
              </fieldset>

              <fieldset>
                <legend className="text-xs tracking-widest text-zinc-500">PAYMENT METHOD</legend>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {(
                    [
                      ["visa", "Card · Visa"],
                      ["mastercard", "Card · Mastercard"],
                      ["google_pay", "Google Pay"],
                      ["apple_pay", "Apple Pay"],
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      key={value}
                      className={
                        "checkout-method-option flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-3 text-xs " +
                        (method === value ? "border-purple-500 bg-purple-950/40" : "border-zinc-700")
                      }
                    >
                      <input
                        type="radio"
                        name="pay-method"
                        className="accent-purple-500"
                        checked={method === value}
                        onChange={() => setMethod(value)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {(method === "visa" || method === "mastercard") && (
                <fieldset className="space-y-3">
                  <legend className="text-xs tracking-widest text-zinc-500">CARD INFORMATION</legend>
                  <input
                    className="checkout-input w-full"
                    placeholder="Card number (any value)"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    autoComplete="off"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="checkout-input"
                      placeholder="MM / YY"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                    />
                    <input className="checkout-input" placeholder="CVC" value={cvc} onChange={(e) => setCvc(e.target.value)} />
                  </div>
                  <input
                    className="checkout-input w-full"
                    placeholder="Full name on card"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </fieldset>
              )}

              <fieldset className="space-y-3">
                <legend className="text-xs tracking-widest text-zinc-500">BILLING ADDRESS</legend>
                <select className="checkout-input w-full" value={country} onChange={(e) => setCountry(e.target.value)}>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="ES">Spain</option>
                  <option value="DE">Germany</option>
                  <option value="UA">Ukraine</option>
                </select>
                <input
                  className="checkout-input w-full"
                  placeholder="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </fieldset>

              {loading || !user ? (
                <PixelSkeleton lines={1} />
              ) : (
                <button type="submit" className="checkout-cta w-full">
                  PAY AND SUBSCRIBE (DEMO)
                </button>
              )}
              {phase === "error" && message && (
                <p role="alert" className="text-center text-sm text-red-300">
                  {message}
                </p>
              )}
            </form>
          )}

          <p className="mt-8 text-center text-[10px] leading-relaxed text-zinc-600">
            By subscribing you agree to DARKBYTE test billing terms. {payMode === "demo" ? "Demo credits are isolated." : "Stripe sandbox only."}
          </p>
        </section>
      </div>

      {pathname === "/checkout" && (
        <p className="mt-8 text-center text-xs text-zinc-500">
          Direct links: <Link href={stripeHref} className="text-purple-400">Stripe embedded</Link>
          {" · "}
          <Link href={demoHref} className="text-amber-400">Demo checkout</Link>
        </p>
      )}
    </main>
  );
}

export default function IntegratedCheckout({ forcedMode }: { forcedMode?: CheckoutMode }) {
  return (
    <Suspense fallback={<main className="px-6 py-24"><PixelSkeleton lines={8} /></main>}>
      <IntegratedCheckoutBody forcedMode={forcedMode} />
    </Suspense>
  );
}