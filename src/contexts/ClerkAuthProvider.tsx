"use client";

import { ClerkProvider, useAuth as useClerkAuth, useUser } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AuthContext,
  type AuthContextValue,
  type DarkbyteSessionUser,
} from "@/contexts/auth-context";
import { apiFetch } from "@/lib/api-fetch";

const clerkAppearance = {
  variables: {
    colorPrimary: "#dc2626",
    colorBackground: "#101010",
    colorInputBackground: "#080808",
    colorText: "#fafafa",
    colorInputText: "#fafafa",
    borderRadius: "4px",
  },
  elements: {
    card: "border border-red-950 bg-[#101010] shadow-none",
    formButtonPrimary: "bg-red-600 hover:bg-red-700",
  },
};

function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { signOut: clerkSignOut } = useClerkAuth();
  const [dbUser, setDbUser] = useState<DarkbyteSessionUser | null>(null);
  const [resolvedFor, setResolvedFor] = useState("");
  const clerkId = isSignedIn ? clerkUser?.id ?? "" : "";

  useEffect(() => {
    if (!isLoaded || !clerkId) return;
    let cancelled = false;
    void (async () => {
      const response = await apiFetch("/api/users/me", { cache: "no-store" });
      const body = await response.json().catch(() => null);
      if (cancelled) return;
      if (!response.ok || !body?.success) {
        setDbUser(null);
        setResolvedFor(clerkId);
        return;
      }
      setDbUser({
        id: body.data.id,
        email: body.data.email,
        name: body.data.name ?? clerkUser?.fullName ?? null,
        image: body.data.image ?? clerkUser?.imageUrl ?? null,
        role: body.data.role ?? "USER",
      });
      setResolvedFor(clerkId);
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, clerkId, clerkUser?.fullName, clerkUser?.imageUrl]);

  const user = useMemo((): DarkbyteSessionUser | null => {
    if (!clerkId || resolvedFor !== clerkId || !dbUser) return null;
    return dbUser;
  }, [clerkId, dbUser, resolvedFor]);

  const signOut = useCallback(async () => {
    await clerkSignOut({ redirectUrl: "/" });
  }, [clerkSignOut]);

  const value = useMemo(
    (): AuthContextValue => ({
      user,
      loading: !isLoaded || (Boolean(clerkId) && resolvedFor !== clerkId),
      configured: true,
      signOut,
    }),
    [user, isLoaded, clerkId, resolvedFor, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function ClerkAuthProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/account"
      signUpFallbackRedirectUrl="/account"
      afterSignOutUrl="/"
    >
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}
