"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { loadStripe, type StripeElementsOptions } from "@stripe/stripe-js";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import type { SubscriptionPlanId } from "@/lib/subscription-plans";
import type { BillingInterval } from "@/lib/subscription-plans";
import PixelSkeleton from "@/components/ui/PixelSkeleton";

type Boot = {
  clientSecret: string;
  publishableKey: string;
  returnUrl: string;
};

function PaymentForm({ returnUrl, disabled, onError }: { returnUrl: string; disabled?: boolean; onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  async function pay(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements || busy) return;
    setBusy(true);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });
    if (result.error) onError(result.error.message ?? "Payment failed.");
    setBusy(false);
  }

  return (
    <form onSubmit={(event) => void pay(event)} className="space-y-6">
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        type="submit"
        disabled={!stripe || !elements || busy || disabled}
        className="checkout-cta w-full"
      >
        {busy ? "PROCESSING…" : "PAY AND SUBSCRIBE"}
      </button>
    </form>
  );
}

export default function StripeEmbeddedPayment({
  planId,
  interval,
  contactEmail,
}: {
  planId: SubscriptionPlanId;
  interval: BillingInterval;
  contactEmail: string;
}) {
  const [boot, setBoot] = useState<Boot | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const attempt = useRef(crypto.randomUUID());

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/stripe/embedded-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Idempotency-Key": attempt.current },
          body: JSON.stringify({ planId, interval }),
        });
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error(body.error?.message ?? "Stripe unavailable.");
        if (!cancelled) setBoot(body.data as Boot);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Stripe unavailable.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [planId, interval]);

  if (loading) return <PixelSkeleton lines={6} />;
  if (error) return <p role="alert" className="text-sm text-red-300">{error}</p>;
  if (!boot) return null;

  const stripePromise = loadStripe(boot.publishableKey);
  const options: StripeElementsOptions = {
    clientSecret: boot.clientSecret,
    appearance: {
      theme: "night",
      variables: {
        colorPrimary: "#a855f7",
        colorBackground: "#0a0a0a",
        colorText: "#f4f4f5",
        colorDanger: "#ef4444",
        fontFamily: "ui-monospace, Consolas, monospace",
        borderRadius: "6px",
      },
      rules: {
        ".Input": { border: "1px solid #3f3f46", boxShadow: "0 0 12px #a855f712" },
        ".Label": { color: "#a1a1aa" },
      },
    },
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">Contact · {contactEmail}</p>
      <Elements stripe={stripePromise} options={options}>
        <PaymentForm returnUrl={boot.returnUrl} onError={setError} />
      </Elements>
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <p className="text-xs text-zinc-500">Secured by Stripe Payment Element · card & wallet options when available</p>
    </div>
  );
}