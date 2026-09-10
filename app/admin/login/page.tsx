"use client";

import {
  FormEvent,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function AdminLoginPage() {
  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleLogin(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const cleanEmail =
        email.trim().toLowerCase();

      if (
        !cleanEmail ||
        !password
      ) {
        setError(
          "Please enter email and password."
        );
        setLoading(false);
        return;
      }

      /* ==================================================
         SIGN IN
      ================================================== */

      const {
        data,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email: cleanEmail,
            password,
          }
        );

      if (loginError) {
        console.error(
          "ADMIN LOGIN ERROR:",
          loginError
        );

        setError(
          loginError.message
        );

        setLoading(false);
        return;
      }

      if (!data.user) {
        setError(
          "Login failed. User account was not returned."
        );

        setLoading(false);
        return;
      }

      /* ==================================================
         VERIFY PROFILE
      ================================================== */

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "id, role, email, full_name"
        )
        .eq(
          "id",
          data.user.id
        )
        .maybeSingle();

      if (profileError) {
        console.error(
          "ADMIN PROFILE ERROR:",
          profileError
        );

        await supabase.auth.signOut();

        setError(
          `Could not verify admin account: ${profileError.message}`
        );

        setLoading(false);
        return;
      }

      if (!profile) {
        await supabase.auth.signOut();

        setError(
          "Admin profile was not found."
        );

        setLoading(false);
        return;
      }

      /* ==================================================
         ADMIN ROLE CHECK
      ================================================== */

      if (
        profile.role !==
        "admin"
      ) {
        await supabase.auth.signOut();

        setError(
          "This account does not have admin access."
        );

        setLoading(false);
        return;
      }

      /* ==================================================
         LOCAL STORAGE
         UI ONLY — NOT AUTHORITY
      ================================================== */

      try {
        localStorage.setItem(
          "earnNovaLoggedIn",
          "true"
        );

        localStorage.setItem(
          "earnNovaUserId",
          data.user.id
        );

        localStorage.setItem(
          "earnNovaUserEmail",
          cleanEmail
        );

        if (
          profile.full_name
        ) {
          localStorage.setItem(
            "earnNovaUserName",
            profile.full_name
          );
        }
      } catch {
        // Ignore localStorage errors.
      }

      /* ==================================================
         ADMIN REDIRECT
      ================================================== */

      window.location.assign(
        "/admin"
      );
    } catch (err) {
      console.error(
        "ADMIN LOGIN UNEXPECTED ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );

      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b10] px-4 py-10 text-white">
      <div className="w-full max-w-md">

        {/* =================================================
            BRAND
        ================================================= */}

        <div className="mb-8 text-center">

          <div className="mb-5 flex items-center justify-center gap-3">

            {/* EarnNova logo */}

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

            <div className="text-left">

              <h1 className="text-[20px] font-black tracking-tight">
                Earn
                <span className="text-blue-500">
                  Nova
                </span>
              </h1>

              <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-slate-600">
                Earn • Grow • Repeat
              </p>

            </div>

          </div>

          <h2 className="text-3xl font-black tracking-tight">
            Admin Panel
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Secure EarnNova Team login
          </p>

        </div>

        {/* =================================================
            CARD
        ================================================= */}

        <div className="rounded-3xl border border-slate-800 bg-[#11151b] p-6 shadow-2xl">

          {/* ERROR */}

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold leading-6 text-red-300">
              {error}
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={
              handleLogin
            }
            className="space-y-5"
          >

            {/* EMAIL */}

            <div>

              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Admin Email
              </label>

              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="admin@example.com"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                disabled={loading}
                required
                className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              />

            </div>

            {/* PASSWORD */}

            <div>

              <label
                htmlFor="admin-password"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Password
              </label>

              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Enter admin password"
                autoComplete="current-password"
                disabled={loading}
                required
                className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              />

            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Signing in..."
                : "Admin Login"}
            </button>

          </form>

          {/* CUSTOMER LOGIN */}

          <div className="mt-6 border-t border-slate-800 pt-5 text-center">

            <a
              href="/login"
              className="text-sm font-semibold text-slate-500 transition hover:text-blue-400"
            >
              ← Customer Login
            </a>

          </div>

        </div>

        {/* FOOTER */}

        <p className="mt-6 text-center text-[11px] text-slate-700">
          EarnNova Team Administration
        </p>

      </div>
    </main>
  );
}