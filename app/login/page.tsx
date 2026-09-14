"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  UserPlus,
  Mail,
  LockKeyhole,
  LogIn,
  CheckCircle2,
} from "lucide-react";

/* =========================================================
   EARNNOVA LOGO
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
   PAGE
========================================================= */

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* =========================================================
     LOGIN
  ========================================================= */

  async function handleLogin(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      /* =====================================================
         BASIC VALIDATION
      ===================================================== */

      if (!cleanEmail || !password) {
        setError(
          "Please enter your email and password."
        );

        setLoading(false);
        return;
      }

      /* =====================================================
         SUPABASE LOGIN
      ===================================================== */

      const {
        data,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (loginError) {
        console.error(
          "LOGIN ERROR:",
          loginError
        );

        const message =
          loginError.message.toLowerCase();

        if (
          message.includes(
            "invalid login credentials"
          )
        ) {
          setError(
            "Invalid email or password."
          );
        } else if (
          message.includes(
            "email not confirmed"
          )
        ) {
          setError(
            "Please make sure email confirmation is disabled in Supabase Authentication settings."
          );
        } else {
          setError(loginError.message);
        }

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
         LOAD PROFILE
      ===================================================== */

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select(
            "id, full_name, email, role, membership, is_blocked, block_reason"
          )
          .eq("id", data.user.id)
          .maybeSingle();

      if (profileError) {
        console.error(
          "PROFILE ERROR:",
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
         SAVE LOCAL SESSION INFO
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
      } else {
        localStorage.removeItem(
          "earnNovaUserName"
        );
      }

      localStorage.setItem(
        "earnNovaRemember",
        remember ? "true" : "false"
      );

      /* =====================================================
         IMPORTANT LOGIN FLOW

         EVERY CUSTOMER → DASHBOARD

         Login does NOT:
         - open /activate
         - open /plans
         - check selected plan
         - redirect based on membership

         Dashboard will control action access.
      ===================================================== */

      window.location.replace("/dashboard");
      return;
    } catch (err) {
      console.error(
        "LOGIN ERROR:",
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
    <main className="min-h-screen bg-[#f5f7fb] text-slate-900">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">

          <a
            href="/"
            className="flex items-center gap-3"
          >
            <LogoMark />

            <div>
              <div className="text-[20px] font-black tracking-tight text-slate-950">
                Earn
                <span className="text-blue-600">
                  Nova
                </span>
              </div>

              <div className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400">
                Earn • Grow • Repeat
              </div>
            </div>
          </a>

          <div className="hidden text-sm text-slate-500 sm:block">
            Don't have an account?

            <a
              href="/signup"
              className="ml-1.5 font-bold text-blue-600 hover:text-blue-700"
            >
              Create Account
            </a>
          </div>

        </div>
      </header>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <section className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl lg:grid-cols-[0.9fr_1.1fr]">

        {/* ===================================================
            LEFT PROFESSIONAL SIDE
        =================================================== */}

        <div className="relative hidden overflow-hidden bg-[#070b10] px-10 py-16 lg:flex lg:flex-col lg:justify-center xl:px-16">

          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-3xl" />

          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />

          <div className="absolute right-[-120px] top-1/3 h-[300px] w-[300px] rounded-full bg-cyan-400/5 blur-3xl" />

          <div className="relative z-10 max-w-lg">

            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-slate-300">

              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />

              Secure account access

            </div>

            <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white xl:text-5xl">

              Welcome back to

              <span className="mt-2 block text-blue-400">
                EarnNova.
              </span>

            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
              Sign in to continue managing
              your account, activities,
              referrals and earnings from
              your secure EarnNova dashboard.
            </p>

            <div className="mt-10 space-y-4">

              {[
                {
                  icon: ShieldCheck,
                  text: "Secure authentication",
                },
                {
                  icon: CheckCircle2,
                  text: "Protected account access",
                },
                {
                  icon: LogIn,
                  text: "Personal dashboard",
                },
                {
                  icon: UserPlus,
                  text: "Manage your referrals",
                },
              ].map(
                ({
                  icon: Icon,
                  text,
                }) => (
                  <div
                    key={text}
                    className="flex items-center gap-3 text-sm font-medium text-slate-300"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                      <Icon size={16} />
                    </span>

                    {text}
                  </div>
                )
              )}

            </div>

            <div className="mt-12 border-t border-white/10 pt-6">

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck size={17} />

                Your account information is protected.
              </div>

            </div>

          </div>
        </div>

        {/* ===================================================
            RIGHT LOGIN SIDE
        =================================================== */}

        <div className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-20">

          <div className="w-full max-w-[560px]">

            {/* MOBILE LOGO */}

            <div className="mb-7 flex items-center gap-3 lg:hidden">

              <LogoMark />

              <div>
                <div className="text-[20px] font-black text-slate-950">
                  Earn
                  <span className="text-blue-600">
                    Nova
                  </span>
                </div>

                <div className="text-[9px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Earn • Grow • Repeat
                </div>
              </div>

            </div>

            {/* LOGIN CARD */}

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]">

              <div className="border-b border-slate-100 px-6 pb-6 pt-7 sm:px-8">

                <div className="flex items-start justify-between gap-4">

                  <div>

                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                      Secure Login
                    </p>

                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                      Welcome Back
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Login to continue to your
                      EarnNova account.
                    </p>

                  </div>

                  <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:flex">
                    <LogIn size={20} />
                  </div>

                </div>

              </div>

              <div className="px-6 pb-7 pt-6 sm:px-8">

                {error && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
                    {error}
                  </div>
                )}

                <form
                  onSubmit={handleLogin}
                  className="space-y-5"
                >

                  {/* EMAIL */}

                  <div>

                    <label
                      htmlFor="email"
                      className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
                    >
                      <Mail size={15} />
                      Email Address
                    </label>

                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      maxLength={120}
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                  </div>

                  {/* PASSWORD */}

                  <div>

                    <div className="mb-2 flex items-center justify-between">

                      <label
                        htmlFor="password"
                        className="flex items-center gap-2 text-sm font-bold text-slate-700"
                      >
                        <LockKeyhole size={15} />
                        Password
                      </label>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            "/forgot-password"
                          )
                        }
                        disabled={loading}
                        className="text-xs font-bold text-blue-600 transition hover:text-blue-700 disabled:opacity-50"
                      >
                        Forgot Password?
                      </button>

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
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError("");
                        }}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        maxLength={72}
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (value) => !value
                          )
                        }
                        disabled={loading}
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>

                    </div>

                  </div>

                  {/* REMEMBER */}

                  <label className="flex cursor-pointer items-center gap-3">

                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) =>
                        setRemember(
                          e.target.checked
                        )
                      }
                      disabled={loading}
                      className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />

                    <span className="text-sm font-medium text-slate-500">
                      Remember me
                    </span>

                  </label>

                  {/* LOGIN BUTTON */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {loading ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                        Signing in...
                      </>
                    ) : (
                      <>
                        Login

                        <ArrowRight
                          size={18}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </>
                    )}

                  </button>

                </form>

                {/* MOBILE SIGNUP */}

                <div className="mt-6 border-t border-slate-100 pt-6">

                  <p className="text-center text-sm text-slate-500">

                    Don't have an account?{" "}

                    <button
                      type="button"
                      onClick={() =>
                        router.push("/signup")
                      }
                      disabled={loading}
                      className="font-bold text-blue-600 transition hover:text-blue-700 disabled:opacity-50"
                    >
                      Create Account
                    </button>

                  </p>

                </div>

              </div>

            </div>

            {/* SECURITY FOOTER */}

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400">

              <ShieldCheck size={15} />

              Secure authentication powered by EarnNova

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}