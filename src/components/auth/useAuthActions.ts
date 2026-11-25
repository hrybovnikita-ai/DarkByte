"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type AuthStatus = {
  authConfigured: boolean;
  googleOAuthConfigured: boolean;
  emailConfigured: boolean;
  databaseConfigured: boolean;
};

export function useAuthActions() {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch("/api/health");
      const body = await response.json();
      if (!cancelled && body.success) {
        setStatus(body.data.auth ?? null);
      }
    }
    queueMicrotask(() => {
      void load();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const configured = Boolean(status?.authConfigured);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error?.message ?? "Registration failed.");
      }
      return body.data as {
        notice?: string;
        emailVerification?: { emailSent: boolean; reason?: string };
      };
    },
    [],
  );

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error === "EMAIL_NOT_VERIFIED") {
        throw new Error(
          "Verify your email before signing in. Check your inbox or contact support.",
        );
      }
      if (result?.error || !result?.ok) {
        throw new Error("Invalid email or password.");
      }
      router.push("/");
      router.refresh();
    },
    [router],
  );

  const signInWithGoogle = useCallback(async () => {
    if (!status?.googleOAuthConfigured) {
      throw new Error(
        "Google sign-in is not configured. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET.",
      );
    }
    await signIn("google", { callbackUrl: "/" });
  }, [status?.googleOAuthConfigured]);

  const requestPasswordReset = useCallback(async (email: string) => {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const body = await response.json();
    if (!response.ok || !body.success) {
      throw new Error(body.error?.message ?? "Password reset failed.");
    }
    return body.data.message as string;
  }, []);

  return {
    configured,
    status,
    register,
    signInWithEmail,
    signInWithGoogle,
    requestPasswordReset,
  };
}