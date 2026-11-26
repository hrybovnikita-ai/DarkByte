import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";

export default function CheckoutCancelledPage() {
  return (
    <div className="min-h-screen bg-[#080808] font-mono text-white">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-xs tracking-[0.25em] text-amber-400">{"// CHECKOUT ABORTED"}</p>
        <h1 className="pixel-font mt-6 text-xl text-zinc-100">PAYMENT CANCELLED</h1>
        <p className="mt-6 text-sm leading-relaxed text-zinc-400">
          No charge was made. Your credit balance is unchanged. Return to pricing when you are ready.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/#pricing"
            className="border border-purple-600 bg-purple-950/40 px-6 py-3 text-sm text-purple-200 hover:bg-purple-900/40"
          >
            VIEW PRICING
          </Link>
          <Link href="/account#credits" className="border border-zinc-700 px-6 py-3 text-sm text-zinc-300 hover:border-zinc-500">
            MY ACCOUNT
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}