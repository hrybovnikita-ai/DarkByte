"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { useAuthActions } from "@/components/auth/useAuthActions";

const skull = [
  "0011111100",
  "0111111110",
  "1111111111",
  "1100110011",
  "1100110011",
  "1111001111",
  "0111111110",
  "0010101000",
  "0011111000",
];

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const authActions = useAuthActions();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setMessage("Please complete all fields.");
      return;
    }

    try {
      await authActions.signInWithEmail(email.trim(), password);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Sign-in failed.",
      );
    }
  }

  async function handleGoogle() {
    try {
      await authActions.signInWithGoogle();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Google sign-in failed.",
      );
    }
  }

  async function handleReset() {
    if (!email.trim()) {
      setMessage("Enter your email to receive a reset link.");
      return;
    }
    try {
      const msg = await authActions.requestPasswordReset(email.trim());
      setMessage(msg);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Password reset failed.",
      );
    }
  }

  const inputStyle =
    "w-full border border-zinc-800 bg-[#080808] py-3 pl-11 pr-4 text-lg text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500";

  return (
    <main className="pixel-grid relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080808] px-5 py-16 text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-[500px] w-[500px] max-w-full rounded-full bg-red-900/20 blur-[130px]"
      />

      <Link
        href="/"
        className="absolute left-6 top-6 flex items-center gap-2 text-zinc-400 transition hover:text-red-500"
      >
        <ArrowLeft size={18} />
        BACK TO HOME
      </Link>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div
            role="img"
            aria-label="DarkByte pixel skull"
            className="pixel-float mb-7 grid grid-cols-10 drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]"
          >
            {skull.flatMap((row, y) =>
              row.split("").map((pixel, x) => (
                <div
                  key={`${y}-${x}`}
                  className="h-2 w-2"
                  style={{
                    backgroundColor:
                      pixel === "1"
                        ? y < 3
                          ? "#ff4545"
                          : "#b91c1c"
                        : "transparent",
                  }}
                />
              ))
            )}
          </div>

          <Link href="/" className="pixel-font text-xl text-red-500">
            DARK<span className="text-white">BYTE</span>
          </Link>

          <p className="mt-5 tracking-widest text-red-500">
            RETURNING USER
          </p>
        </div>

        <div className="border border-red-950 bg-[#101010] p-6 shadow-[0_0_40px_rgba(220,38,38,0.08)] sm:p-8">
          <h1 className="pixel-font text-center text-sm leading-relaxed sm:text-lg">
            SIGN IN
          </h1>

          <p className="mt-4 text-center text-xl text-zinc-500">
            Re-enter the digital darkness.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block tracking-widest text-zinc-400"
              >
                EMAIL ADDRESS
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputStyle}
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block tracking-widest text-zinc-400"
              >
                PASSWORD
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                />

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputStyle} pr-12`}
                  required
                />

                <button
                  type="button"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="pixel-font w-full border border-red-500 bg-red-600 px-4 py-5 text-xs text-white transition hover:bg-red-700 hover:shadow-[0_0_25px_rgba(220,38,38,0.35)]"
            >
              SIGN IN
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="w-full text-sm text-zinc-500 underline-offset-4 hover:text-red-400 hover:underline"
            >
              Forgot password?
            </button>
          </form>

          {!authActions.configured && (
            <p className="mt-4 text-center text-xs text-amber-500">
              Auth.js is not fully configured. Set AUTH_SECRET and DATABASE_URL
              in .env.local (see .env.example).
            </p>
          )}
          {authActions.status &&
            !authActions.status.googleOAuthConfigured && (
              <p className="mt-2 text-center text-xs text-zinc-600">
                Google OAuth is not configured yet.
              </p>
            )}

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-sm tracking-widest text-zinc-500">
              OR CONTINUE WITH
            </span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 border border-zinc-700 bg-[#080808] px-5 py-3 text-lg transition hover:border-red-500 hover:bg-[#151515]"
          >
            Continue with Google
          </button>

          {message && (
            <p
              role="status"
              className="mt-5 border border-red-900 bg-red-950/20 p-3 text-center text-red-400"
            >
              {message}
            </p>
          )}

          <p className="mt-7 text-center text-lg text-zinc-500">
            No account yet?{" "}
            <Link
              href="/sign-up"
              className="text-red-500 transition hover:text-red-400"
            >
              Sign up
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-sm tracking-widest text-zinc-600">
          DARKBYTE // ACCESS INTERFACE
        </p>
      </div>
    </main>
  );
}