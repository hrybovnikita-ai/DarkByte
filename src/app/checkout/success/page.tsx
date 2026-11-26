"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { useAuth } from "@/contexts/AuthProvider";
import PixelSkeleton from "@/components/ui/PixelSkeleton";

function CheckoutSuccessBody() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"pending" | "confirmed" | "waiting">("pending");

  useEffect(() => {
    if (!loading && !user) router.replace("/sign-in?callbackUrl=/checkout/success");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || !sessionId) return;
    let cancelled = false;
    let attempts = 0;
    async function verify() {
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
        if (++attempts < 30) window.setTimeout(verify, 2000);
        else setStatus("waiting");
      } catch {
        if (!cancelled && ++attempts < 30) window.setTimeout(verify, 2000);
        else if (!cancelled) setStatus("waiting");
      }
    }
    void verify();
    return () => { cancelled = true; };
  }, [user, sessionId]);

  return (
    <main className="mx-auto max-w-lg px-6 py-24 text-center">
      <p className="text-xs tracking-[0.25em] text-purple-400">{"// PAYMENT RECEIVED"}</p>
      <h1 className="pixel-font mt-6 text-xl text-zinc-100">THANK YOU</h1>
      {loading || !user ? (
        <PixelSkeleton className="mt-10" lines={3} />
      ) : (
        <>
          <p className="mt-6 text-sm leading-relaxed text-zinc-400" role="status">
            {status === "confirmed"
              ? "Your credits are in your account. Spend them across DARKBYTE modules."
              : status === "waiting"
                ? "Stripe confirmed payment, but crediting is still processing. Open your account and refresh in a moment."
                : "Verifying your payment with Stripe…"}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/account#credits"
              className="border border-purple-600 bg-purple-600 px-6 py-3 text-sm font-bold text-[#080808] hover:brightness-110"
            >
              VIEW BALANCE
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