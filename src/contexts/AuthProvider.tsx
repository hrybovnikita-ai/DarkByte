"use client";

import { SessionProvider, useSession, signOut as nextAuthSignOut } from "next-auth/react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

export type DarkbyteSessionUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: "USER" | "ADMIN";
};

type AuthContextValue = {
  user: DarkbyteSessionUser | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthContextBridge({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();

  const user = useMemo((): DarkbyteSessionUser | null => {
    if (!session?.user?.email || !session.user.id) {
      return null;
    }
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      role: session.user.role ?? "USER",
    };
  }, [session]);

  const signOut = useCallback(async () => {
    await nextAuthSignOut({ callbackUrl: "/" });
  }, []);

  const value = useMemo(
    (): AuthContextValue => ({
      user,
      loading: status === "loading",
      configured: status !== "loading",
      signOut,
    }),
    [user, status, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus>
      <AuthContextBridge>{children}</AuthContextBridge>
    </SessionProvider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}