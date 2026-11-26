"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ClerkAuthProvider } from "@/contexts/ClerkAuthProvider";

export function AppAuthProvider({
  children,
  mode,
}: {
  children: ReactNode;
  mode: "clerk" | "authjs";
}) {
  if (mode === "clerk") {
    return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
  }
  return <AuthProvider>{children}</AuthProvider>;
}