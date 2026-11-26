"use client";

import { SignIn, SignUp, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { safeCallbackUrl } from "@/lib/safe-callback";

export function ClerkAuthPanel({ mode }: { mode: "sign-in" | "sign-up" }) {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#080808] text-zinc-500">Loading…</main>}>
      <ClerkAuthPanelInner mode={mode} />
    </Suspense>
  );
}

function ClerkAuthPanelInner({ mode }: { mode: "sign-in" | "sign-up" }) {
  const Component = mode === "sign-in" ? SignIn : SignUp;
  const alternateHref = mode === "sign-in" ? "/sign-up" : "/sign-in";
  const alternateLabel = mode === "sign-in" ? "Sign up" : "Sign in";
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const destination = safeCallbackUrl(search.get("callbackUrl")) ?? "/account";
  const onAuthRoot = pathname === "/sign-in" || pathname === "/sign-up";

  useEffect(() => {
    if (isLoaded && isSignedIn && onAuthRoot) {
      router.replace(destination);
    }
  }, [destination, isLoaded, isSignedIn, onAuthRoot, router]);

  if (!isLoaded || (isSignedIn && onAuthRoot)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] text-zinc-500">
        Restoring session…
      </main>
    );
  }

  return (
    <main className="pixel-grid relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080808] px-5 py-16 text-white">
      <Link href="/" className="absolute left-6 top-6 text-zinc-400 transition hover:text-red-500">
        ← BACK TO HOME
      </Link>
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="pixel-font text-xl text-red-500">
            DARK<span className="text-white">BYTE</span>
          </Link>
        </div>
        <Component
          routing="path"
          path={mode === "sign-in" ? "/sign-in" : "/sign-up"}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl={destination}
        />
        <p className="mt-6 text-center text-sm text-zinc-500">
          {mode === "sign-in" ? "No account yet?" : "Already registered?"}{" "}
          <Link href={alternateHref} className="text-red-500 hover:text-red-400">
            {alternateLabel}
          </Link>
        </p>
      </div>
    </main>
  );
}