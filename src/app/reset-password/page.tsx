"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent, Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      setMessage("Missing reset token. Use the link from your email.");
      return;
    }
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email: email.trim(), password }),
    });
    const body = await response.json();
    if (body.success) {
      setMessage("Password updated. You can sign in now.");
      return;
    }
    setMessage(body.error?.message ?? "Reset failed.");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className="w-full border border-zinc-800 bg-[#101010] p-3 text-white"
        required
      />
      <input
        type="password"
        placeholder="New password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="w-full border border-zinc-800 bg-[#101010] p-3 text-white"
        minLength={8}
        required
      />
      <button
        type="submit"
        className="pixel-font w-full border border-red-600 bg-red-600 py-4 text-xs"
      >
        UPDATE PASSWORD
      </button>
      {message && <p className="text-sm text-amber-400">{message}</p>}
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="pixel-font text-xl">RESET PASSWORD</h1>
      <Suspense fallback={<p className="mt-6 text-zinc-500">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
      <Link href="/sign-in" className="mt-8 inline-block text-sm text-red-500">
        Sign in
      </Link>
    </main>
  );
}