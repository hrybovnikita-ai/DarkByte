"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  ArrowLeft,
} from "lucide-react";
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

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const authActions = useAuthActions();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      setMessage("Please complete all fields.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setMessage("Password must include at least one letter and one number.");
      return;
    }

    try {
      const result = await authActions.register(
        name.trim(),
        email.trim(),
        password,
      );
      const extra = result.notice ? ` ${result.notice}` : "";
      setMessage(
        `Account created. Verify your email before signing in.${extra}`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Registration failed.",
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

  const inputStyle =
    "w-full border border-zinc-800 bg-[#080808] py-3 pl-11 pr-4 text-lg text-white outline-none transition placeholder:text-zinc-600 focus:border-red-500";

  return (
    <main className="pixel-grid relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080808] px-5 py-16 text-white">

      {/* BACKGROUND GLOW */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute h-[500px] w-[500px] max-w-full rounded-full bg-red-900/20 blur-[130px]"
      />

      {/* BACK BUTTON */}
      <Link
        href="/"
        className="absolute left-6 top-6 flex items-center gap-2 text-zinc-400 transition hover:text-red-500"
      >
        <ArrowLeft size={18} />
        BACK TO HOME
      </Link>

      <div className="relative z-10 w-full max-w-md">

        {/* LOGO */}
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

          <Link
            href="/"
            className="pixel-font text-xl text-red-500"
          >
            DARK<span className="text-white">BYTE</span>
          </Link>

          <p className="mt-5 tracking-widest text-red-500">
            NEW USER DETECTED
          </p>

        </div>

        {/* REGISTRATION FORM */}
        <div className="border border-red-950 bg-[#101010] p-6 shadow-[0_0_40px_rgba(220,38,38,0.08)] sm:p-8">

          <h1 className="pixel-font text-center text-sm leading-relaxed sm:text-lg">
            CREATE ACCOUNT
          </h1>

          <p className="mt-4 text-center text-xl text-zinc-500">
            Enter the digital darkness.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

            {/* NAME */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block tracking-widest text-zinc-400"
              >
                USERNAME
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600"
                />

                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputStyle}
                  required
                />
              </div>
            </div>

            {/* EMAIL */}
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

            {/* PASSWORD */}
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
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputStyle} pr-12`}
                  minLength={8}
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
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <p className="mt-2 text-sm text-zinc-500">
                Minimum 8 characters.
              </p>
            </div>

            {/* CREATE ACCOUNT */}
            <button
              type="submit"
              className="pixel-font w-full border border-red-500 bg-red-600 px-4 py-5 text-xs text-white transition hover:bg-red-700 hover:shadow-[0_0_25px_rgba(220,38,38,0.35)]"
            >
              CREATE ACCOUNT
            </button>

          </form>

          {/* DIVIDER */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-800" />

            <span className="text-sm tracking-widest text-zinc-500">
              OR CONTINUE WITH
            </span>

            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          {/* GOOGLE BUTTON */}
          <button
            type="button"
            onClick={handleGoogle}
            className="flex w-full items-center justify-center gap-3 border border-zinc-700 bg-[#080808] px-5 py-3 text-lg transition hover:border-red-500 hover:bg-[#151515]"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15z"
              />
              <path
                fill="#34A853"
                d="M24 44c5.5 0 10.1-1.8 13.5-4.5l-6.6-5.1c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44z"
              />
              <path
                fill="#FBBC05"
                d="M12.6 27.9a12 12 0 0 1 0-7.8v-5.3H5.8a20 20 0 0 0 0 18.4z"
              />
              <path
                fill="#EA4335"
                d="M24 11.7c3 0 5.7 1 7.8 3.1l5.8-5.8A20 20 0 0 0 5.8 14.8l6.8 5.3c1.6-4.8 6.1-8.4 11.4-8.4z"
              />
            </svg>

            Continue with Google
          </button>

          {/* STATUS MESSAGE */}
          {message && (
            <p
              role="status"
              className="mt-5 border border-red-900 bg-red-950/20 p-3 text-center text-red-400"
            >
              {message}
            </p>
          )}

          {/* SIGN IN */}
          <p className="mt-7 text-center text-lg text-zinc-500">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-red-500 transition hover:text-red-400"
            >
              Sign in
            </Link>
          </p>

        </div>

        {/* FOOTER */}
        <p className="mt-8 text-center text-sm tracking-widest text-zinc-600">
          DARKBYTE // ACCESS INTERFACE
        </p>

      </div>
    </main>
  );
}
