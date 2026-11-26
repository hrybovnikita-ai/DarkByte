"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { useAuth } from "@/contexts/auth-context";
import PixelSkeleton from "@/components/ui/PixelSkeleton";

type VerifyState = "pending" | "confirmed" | "waiting" | "failed";

function CheckoutSuccessBody() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const kind = params.get("kind");
  const [status, setStatus] = useState<VerifyState>("pending");

  useEffect(() => {
    if (!loading && !user) router.replace("/sign-in?callbackUrl=/checkout/success");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !sessionId) return;
    let cancelled = false;
    let attempts = 0;

    async function verifyCredits() {
      try {
        const response = await fetch("/api/credits/history", { cache: "no-store" });
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error("History unavailable");
        const confirmed = body.data.items.some(
          (entry: { stripeSessionId: string | null }) => entry.stripeSessionId === sessionId,
        );
        if (cancelled) return;
        if (confirmed) {
          setStatus("confirmed");
          window.dispatchEvent(new Event("credits-updated"));
          return;
        }
        if (++attempts < 30) window.setTimeout(verifyCredits, 2000);
        else setStatus("waiting");
      } catch {
        if (!cancelled && ++attempts < 30) window.setTimeout(verifyCredits, 2000);
        else if (!cancelled) setStatus("waiting");
      }
    }

    async function verifySubscription() {
      try {
        const response = await fetch("/api/billing/status", { cache: "no-store" });
        const body = await response.json();
        if (!response.ok || !body.success) throw new Error("Billing unavailable");
        const confirmed = body.data.payments.some(
          (entry: { sessionId: string | null; status: string; creditsGranted: boolean }) =>
            entry.sessionId === sessionId && entry.status === "SUCCEEDED" && entry.creditsGranted,
        );
        if (cancelled) return;
        if (confirmed) {
          setStatus("confirmed");
          window.dispatchEvent(new Event("credits-updated"));
          return;
        }
        if (++attempts < 30) window.setTimeout(verifySubscription, 2000);
        else setStatus("waiting");
      } catch {
        if (!cancelled && ++attempts < 30) window.setTimeout(verifySubscription, 2000);
        else if (!cancelled) setStatus("waiting");
      }
    }

    void (kind === "subscription" ? verifySubscription() : verifyCredits());
    return () => {
      cancelled = true;
    };
  }, [user, sessionId, kind]);

  const isSubscription = kind === "subscription";

  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="text-xs tracking-[0.25em] text-purple-400">{"// PAYMENT RECEIVED"}</p>
      <h1 className="pixel-font mt-6 text-xl text-zinc-100">
        {status === "confirmed" ? "PAYMENT SUCCESSFUL" : "THANK YOU"}
      </h1>
      {loading || !user ? (
        <PixelSkeleton className="mt-10" lines={3} />
      ) : (
        <>
          <p className="mt-6 text-sm leading-relaxed text-zinc-400" role="status">
            {status === "confirmed"
              ? isSubscription
                ? "Your subscription is active and credits have been added. Check your inbox for a test confirmation email."
                : "Your credits are in your account. Spend them across DARKBYTE modules."
              : status === "waiting"
                ? "Stripe confirmed payment, but crediting is still processing. Open your account and refresh in a moment."
                : status === "failed"
                  ? "Payment could not be verified. No credits were granted."
                  : "Verifying your payment with Stripe…"}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href={isSubscription ? "/account#billing" : "/account#credits"}
              className="border border-purple-600 bg-purple-600 px-6 py-3 text-sm font-bold text-[#080808] hover:brightness-110"
            >
              {isSubscription ? "VIEW BILLING" : "VIEW BALANCE"}
            </Link>
            <Link href="/" className="border border-zinc-700 px-6 py-3 text-sm text-zinc-300 hover:border-zinc-500">
              BACK HOME
            </Link>
          </div>
        </>
      )}
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#080808] font-mono text-white">
      <SiteHeader />
      <Suspense fallback={<main className="px-6 py-24"><PixelSkeleton lines={4} /></main>}>
        <CheckoutSuccessBody />
      </Suspense>
      <SiteFooter />
    </div>
  );
}