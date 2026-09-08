"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* =========================================================
   EARNNOVA LOGO — SAME AS DASHBOARD
   ========================================================= */

function LogoMark() {
  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <div className="absolute inset-0 rounded-[15px] bg-blue-600/20 blur-md" />

      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[15px] border border-blue-400/20 bg-gradient-to-br from-white via-slate-100 to-blue-50 shadow-xl">
        <div className="absolute -right-3 -top-3 h-7 w-7 rounded-full bg-blue-500/20 blur-md" />

        <div className="relative flex items-center justify-center">
          <span className="text-[21px] font-black italic tracking-[-0.15em] text-slate-950">
            E
          </span>

          <span className="-ml-0.5 text-[21px] font-black italic tracking-[-0.15em] text-blue-600">
            N
          </span>
        </div>

        <div className="absolute bottom-1.5 left-2 h-[2px] w-5 rounded-full bg-blue-500" />
      </div>
    </div>
  );
}

/* =========================================================
   EYE ICON
   ========================================================= */

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.2A10.6 10.6 0 0 1 12 4c6.5 0 10 8 10 8a18.2 18.2 0 0 1-3.1 4.3" />
      <path d="M6.6 6.6C3.7 8.6 2 12 2 12s3.5 8 10 8c1.7 0 3.2-.4 4.5-1.1" />
    </svg>
  );
}

/* =========================================================
   ARROW ICON
   ========================================================= */

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/* =========================================================
   SHIELD ICON
   ========================================================= */

function ShieldIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/* =========================================================
   LOGIN PAGE
   ========================================================= */

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (loginError) {
        console.error("Supabase login error:", loginError);

        const message = loginError.message.toLowerCase();

        if (
          message.includes("invalid login") ||
          message.includes("invalid credentials")
        ) {
          setError("Incorrect email or password.");
        } else if (message.includes("email not confirmed")) {
          setError(
            "Email verification is enabled in Supabase. Please disable email confirmation in Supabase Authentication settings."
          );
        } else {
          setError(loginError.message);
        }

        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Login failed. Please try again.");
        setLoading(false);
        return;
      }

      if (!data.session) {
        setError(
          "Could not create a login session. Please try again."
        );
        setLoading(false);
        return;
      }

      localStorage.setItem("earnNovaLoggedIn", "true");
      localStorage.setItem("earnNovaUserEmail", cleanEmail);

      if (data.user.user_metadata?.full_name) {
        localStorage.setItem(
          "earnNovaUserName",
          data.user.user_metadata.full_name
        );
      }

      if (rememberMe) {
        localStorage.setItem("earnNovaRemember", "true");
      } else {
        localStorage.removeItem("earnNovaRemember");
      }

      /*
       * IMPORTANT:
       * Login ke baad hamesha Dashboard.
       * No redirect query.
       */
      window.location.replace("/dashboard");
    } catch (err) {
      console.error("Unexpected login error:", err);

      setError(
        "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">

          <a
            href="/"
            className="flex items-center gap-3"
          >
            <LogoMark />

            <div>
              <div className="text-[20px] font-black tracking-tight text-slate-950">
                Earn<span className="text-blue-600">Nova</span>
              </div>

              <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Earn • Grow • Repeat
              </div>
            </div>
          </a>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 sm:block">
              Don&apos;t have an account?
            </span>

            <a
              href="/signup"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
            >
              Sign Up
            </a>
          </div>

        </div>
      </header>

      {/* MAIN */}

      <section className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl items-center px-5 py-10 sm:px-8">

        <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 lg:grid-cols-2">

          {/* LEFT */}

          <div className="relative hidden overflow-hidden bg-slate-950 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">

            <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl" />

            <div className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative z-10">

              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-300">
                <ShieldIcon />
                Secure Account
              </div>

              <h1 className="max-w-lg text-4xl font-black leading-tight text-white xl:text-5xl">
                Welcome
                <span className="block text-blue-400">
                  Back!
                </span>
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 text-slate-400">
                Login to your EarnNova account and continue
                earning through tasks, referrals and rewards.
              </p>

            </div>

            <div className="relative z-10 mt-12 space-y-4">

              {[
                "Access your earning dashboard",
                "Manage your wallet and earnings",
                "Complete tasks and earn rewards",
                "Track your referral income",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                    ✓
                  </div>

                  <span className="text-sm font-medium text-slate-300">
                    {item}
                  </span>
                </div>
              ))}

            </div>

          </div>

          {/* RIGHT */}

          <div className="p-6 sm:p-10 lg:p-12 xl:p-14">

            <div className="mx-auto max-w-md">

              <div className="mb-8">

                <p className="mb-2 text-sm font-bold uppercase tracking-widest text-blue-600">
                  Account Login
                </p>

                <h2 className="text-3xl font-black tracking-tight text-slate-950">
                  Sign in to EarnNova
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Enter your account details to continue.
                </p>

              </div>

              {/* ERROR */}

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-600">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* EMAIL */}

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

                {/* PASSWORD */}

                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="block text-sm font-bold text-slate-700"
                    >
                      Password
                    </label>

                    <a
                      href="/forgot-password"
                      className="text-xs font-bold text-blue-600 hover:text-blue-700"
                    >
                      Forgot Password?
                    </a>

                  </div>

                  <div className="relative">

                    <input
                      id="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                      disabled={loading}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    >
                      <EyeIcon
                        open={showPassword}
                      />
                    </button>

                  </div>

                </div>

                {/* REMEMBER */}

                <label className="flex cursor-pointer items-center gap-3">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(
                        e.target.checked
                      )
                    }
                    disabled={loading}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />

                  <span className="text-sm font-medium text-slate-600">
                    Remember me
                  </span>

                </label>

                {/* LOGIN */}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      Login to Account
                      <ArrowIcon />
                    </>
                  )}

                </button>

              </form>

              {/* SIGNUP */}

              <div className="my-7 flex items-center gap-4">

                <div className="h-px flex-1 bg-slate-200" />

                <span className="text-xs font-semibold text-slate-400">
                  OR
                </span>

                <div className="h-px flex-1 bg-slate-200" />

              </div>

              <p className="text-center text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <a
                  href="/signup"
                  className="font-extrabold text-blue-600 hover:text-blue-700"
                >
                  Create Account
                </a>
              </p>

              {/* SECURITY */}

              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                <div className="mt-0.5 text-blue-600">
                  <ShieldIcon />
                </div>

                <div>

                  <p className="text-xs font-extrabold text-slate-700">
                    Your account is protected
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Your login information is securely handled
                    by Supabase authentication.
                  </p>

                </div>

              </div>

            </div>
          </div>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-slate-400 sm:flex-row sm:px-8">

          <p>
            © 2026 EarnNova. All rights reserved.
          </p>

          <div className="flex gap-5">

            <a
              href="/privacy"
              className="hover:text-slate-600"
            >
              Privacy
            </a>

            <a
              href="/terms"
              className="hover:text-slate-600"
            >
              Terms
            </a>

          </div>

        </div>

      </footer>

    </main>
  );
}