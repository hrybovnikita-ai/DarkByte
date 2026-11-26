"use client";

import { createContext, useContext } from "react";

export type DarkbyteSessionUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: "USER" | "ADMIN";
};

export type AuthContextValue = {
  user: DarkbyteSessionUser | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AppAuthProvider");
  }
  return ctx;
}