"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/* =========================================================
   ICONS
   ========================================================= */

function LogoMark() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 shadow-lg shadow-blue-500/20">
      <span className="text-lg font-black text-white">E</span>
    </div>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     LOGIN
     ========================================================= */

  async function handleLogin(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail || !password) {
        setError(
          "Please enter your email and password."
        );

        setLoading(false);
        return;
      }

      const {
        data,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (loginError) {
        setError(loginError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError(
          "Login failed. Please try again."
        );

        setLoading(false);
        return;
      }

      /* =====================================================
         PROFILE
         ===================================================== */

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, full_name, email, role, membership, is_blocked, block_reason"
        )
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "Profile error:",
          profileError
        );

        await supabase.auth.signOut();

        setError(
          "Could not load your account profile."
        );

        setLoading(false);
        return;
      }

      if (!profile) {
        await supabase.auth.signOut();

        setError(
          "Account profile was not found."
        );

        setLoading(false);
        return;
      }

      /* =====================================================
         ADMIN PROTECTION
         ===================================================== */

      if (profile.role === "admin") {
        await supabase.auth.signOut();

        setError(
          "Please use the admin login page."
        );

        setLoading(false);
        return;
      }

      /* =====================================================
         BLOCKED ACCOUNT
         ===================================================== */

      if (profile.is_blocked) {
        await supabase.auth.signOut();

        setError(
          profile.block_reason
            ? `Your account is blocked: ${profile.block_reason}`
            : "Your account is blocked. Please contact support."
        );

        setLoading(false);
        return;
      }

      /* =====================================================
         LOCAL SESSION INFO
         ===================================================== */

      localStorage.setItem(
        "earnNovaLoggedIn",
        "true"
      );

      localStorage.setItem(
        "earnNovaUserEmail",
        cleanEmail
      );

      localStorage.setItem(
        "earnNovaUserId",
        data.user.id
      );

      if (profile.full_name) {
        localStorage.setItem(
          "earnNovaUserName",
          profile.full_name
        );
      }

      localStorage.setItem(
        "earnNovaRemember",
        remember ? "true" : "false"
      );

      /* =====================================================
         IMPORTANT
         Keep the selected plan if user selected one before
         login. After login, send user to activation.
         ===================================================== */

      const selectedPlan =
        localStorage.getItem(
          "earnNovaSelectedPlan"
        );

      if (selectedPlan) {
        try {
          const parsed = JSON.parse(selectedPlan);

          if (
            parsed?.name &&
            parsed.name in {
              Starter: 2.5,
              Basic: 5,
              Pro: 10,
              Premium: 20,
              VIP: 50,
            }
          ) {
            window.location.replace(
              `/activate?plan=${encodeURIComponent(
                parsed.name
              )}`
            );

            return;
          }
        } catch {
          localStorage.removeItem(
            "earnNovaSelectedPlan"
          );
        }
      }

      /* =====================================================
         NORMAL LOGIN
         ===================================================== */

      window.location.replace("/dashboard");
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  }

  /* =========================================================
     UI
     ========================================================= */

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-10 text-white">
      {/* BACKGROUND GLOW */}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute bottom-[-200px] right-[-100px] h-[420px] w-[420px] rounded-full bg-cyan-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* LOGO */}

        <div className="mb-8 text-center">
          <div className="mb-5 inline-flex items-center gap-3">
            <LogoMark />

            <span className="text-2xl font-black tracking-tight">
              Earn<span className="text-cyan-400">Nova</span>
            </span>
          </div>

          <h1 className="text-3xl font-black tracking-tight">
            Welcome Back
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Login to continue to your EarnNova account.
          </p>
        </div>

        {/* LOGIN CARD */}

        <div className="rounded-3xl border border-blue-500/15 bg-slate-900/90 p-6 shadow-2xl shadow-blue-950/20 backdrop-blur md:p-7">
          {/* SECURITY BADGE */}

          <div className="mb-6 flex items-center gap-2 rounded-xl border border-blue-500/15 bg-blue-500/5 px-3 py-2.5 text-xs text-blue-300">
            <ShieldIcon />

            <span>
              Secure EarnNova account login
            </span>
          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
              {error}
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >
            {/* EMAIL */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* PASSWORD */}

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-300">
                  Password
                </label>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/forgot-password"
                    )
                  }
                  className="text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
                >
                  Forgot password?
                </button>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {/* REMEMBER */}

            <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) =>
                  setRemember(e.target.checked)
                }
                disabled={loading}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 accent-cyan-400"
              />

              Remember me
            </label>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3.5 font-bold text-white shadow-lg shadow-blue-500/10 transition hover:from-blue-500 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </>
              ) : (
                <>
                  Login
                  <ArrowRightIcon />
                </>
              )}
            </button>
          </form>

          {/* DIVIDER */}

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />

            <span className="text-xs font-medium text-slate-600">
              OR
            </span>

            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* SIGNUP */}

          <p className="text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() =>
                router.push("/signup")
              }
              className="font-semibold text-cyan-400 transition hover:text-cyan-300"
            >
              Create account
            </button>
          </p>
        </div>

        {/* FOOTER */}

        <p className="mt-6 text-center text-xs text-slate-600">
          © {new Date().getFullYear()} EarnNova. All rights
          reserved.
        </p>
      </div>
    </main>
  );
}