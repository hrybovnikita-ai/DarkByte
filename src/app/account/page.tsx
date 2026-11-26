"use client";

import Link from "next/link";
import AccountCredits from "@/components/credits/AccountCredits";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import PixelSkeleton from "@/components/ui/PixelSkeleton";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified?: string | null;
};

export default function AccountPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/sign-in");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) {
      return;
    }
    let cancelled = false;
    async function load() {
      const response = await fetch("/api/users/me", { credentials: "include", cache: "no-store" });
      const body = await response.json();
      if (!cancelled && body.success) {
        setProfile(body.data as Profile);
        setName((body.data as Profile).name ?? "");
      }
    }
    queueMicrotask(() => {
      void load();
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/users/me", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const body = await response.json();
    if (body.success) {
      setMessage("Profile updated.");
      setProfile(body.data as Profile);
    } else {
      setMessage(body.error?.message ?? "Update failed.");
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <p className="tracking-widest text-red-500">{"// ACCOUNT SETTINGS"}</p>
      <h1 className="pixel-font mt-4 text-2xl">YOUR PROFILE</h1>

      {loading || !profile ? (
        <PixelSkeleton className="mt-10" lines={5} />
      ) : (
        <form onSubmit={handleSave} className="mt-10 space-y-5">
          <div>
            <label className="text-xs tracking-widest text-zinc-500">EMAIL</label>
            <p className="mt-2 border border-zinc-800 bg-[#101010] p-3 text-zinc-300">
              {profile.email}
            </p>
          </div>
          <div>
            <label htmlFor="name" className="text-xs tracking-widest text-zinc-500">
              DISPLAY NAME
            </label>
            <input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full border border-zinc-800 bg-[#101010] p-3 text-white outline-none focus:border-red-500"
            />
          </div>
          <p className="text-sm text-zinc-500">
            Role: {profile.role}
            {profile.emailVerified ? " · Email verified" : " · Email not verified"}
          </p>
          <button
            type="submit"
            className="pixel-font w-full border border-red-600 bg-red-600 py-4 text-xs text-white hover:bg-red-700"
          >
            SAVE CHANGES
          </button>
          {message && (
            <p className="text-center text-sm text-amber-400">{message}</p>
          )}
        </form>
      )}

      <AccountCredits />

      <Link href="/" className="mt-10 inline-block text-sm text-zinc-500 hover:text-red-500">
        ← Back to home
      </Link>
    </main>
  );
}