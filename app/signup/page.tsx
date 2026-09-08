"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* =========================================================
   EARNNOVA LOGO — EXACT SAME AS DASHBOARD
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

function EyeIcon({ hidden = false }: { hidden?: boolean }) {
  if (hidden) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3l18 18" />
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.7 4.2 9.8 6-.4.7-1.3 1.9-2.7 3" />
        <path d="M6.2 6.2C4.5 7.4 3.4 9 2.2 10c1.1 1.8 4.8 6 9.8 6 1.1 0 2.2-.2 3.1-.6" />
      </svg>
    );
  }

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2.2 12s3.5-7 9.8-7 9.8 7 9.8 7-3.5 7-9.8 7-9.8-7-9.8-7Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  );
}

/* =========================================================
   CHECK ICON
   ========================================================= */

function CheckIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
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
      <path d="M12 3 20 6v5c0 5.2-3.4 8.8-8 10-4.6-1.2-8-4.8-8-10V6l8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

/* =========================================================
   PASSWORD RULE
   ========================================================= */

function PasswordRule({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 text-[11px] font-medium ${
        valid ? "text-emerald-600" : "text-slate-400"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full ${
          valid ? "bg-emerald-100" : "bg-slate-100"
        }`}
      >
        <CheckIcon />
      </span>

      {text}
    </div>
  );
}

/* =========================================================
   SIGNUP PAGE
   ========================================================= */

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);

  const [referralChecking, setReferralChecking] =
    useState(false);

  const [referralValid, setReferralValid] =
    useState<boolean | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "EARNNOVA",
    agree: false,
    website: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================================
     REFERRAL FROM URL
     ========================================================= */

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const ref = params.get("ref");

    if (!ref) return;

    const cleanedRef = ref
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "")
      .slice(0, 32);

    if (!cleanedRef) return;

    setForm((prev) => ({
      ...prev,
      referralCode: cleanedRef,
    }));
  }, []);

  /* =========================================================
     INPUT CHANGE
     ========================================================= */

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    if (name === "referralCode") {
      const cleaned = value
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, "")
        .slice(0, 32);

      setForm((prev) => ({
        ...prev,
        referralCode: cleaned,
      }));

      setReferralValid(null);
      setError("");
      setSuccess("");

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setError("");
    setSuccess("");
  };

  /* =========================================================
     VALIDATE REFERRAL
     ========================================================= */

  const validateReferral = async () => {
    const code = form.referralCode
      .trim()
      .toUpperCase();

    if (!code) {
      setReferralValid(false);
      setError("Referral code is required.");
      return false;
    }

    if (code.length < 3) {
      setReferralValid(false);
      setError("Referral code is too short.");
      return false;
    }

    setReferralChecking(true);
    setReferralValid(null);

    try {
      const {
        data,
        error: referralError,
      } = await supabase
        .from("referral_codes")
        .select(
          "id, code, name, reward, max_reward, total_referrals, is_active, created_by"
        )
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (referralError) {
        console.error(
          "Referral validation error:",
          referralError
        );

        setReferralValid(false);
        setError(
          "Unable to verify referral code. Please try again."
        );

        return false;
      }

      if (!data) {
        setReferralValid(false);
        setError(
          "Invalid or inactive referral code."
        );

        return false;
      }

      setReferralValid(true);
      setError("");

      return true;
    } catch (err) {
      console.error(
        "Referral validation error:",
        err
      );

      setReferralValid(false);
      setError(
        "Unable to verify referral code."
      );

      return false;
    } finally {
      setReferralChecking(false);
    }
  };

  /* =========================================================
     SIGNUP
     ========================================================= */

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    /* HONEYPOT */

    if (form.website.trim()) {
      setError("Unable to create account.");
      return;
    }

    const name = form.name.trim();

    const email = form.email
      .trim()
      .toLowerCase();

    const password = form.password;

    const confirmPassword =
      form.confirmPassword;

    const referralCode = form.referralCode
      .trim()
      .toUpperCase();

    /* NAME */

    if (!name) {
      setError(
        "Please enter your full name."
      );
      return;
    }

    if (name.length < 2) {
      setError(
        "Name must contain at least 2 characters."
      );
      return;
    }

    if (name.length > 80) {
      setError("Name is too long.");
      return;
    }

    /* EMAIL */

    if (!email) {
      setError(
        "Please enter your email address."
      );
      return;
    }

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

    if (!emailRegex.test(email)) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    /* PASSWORD */

    if (!password) {
      setError(
        "Please create a password."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (password.length > 72) {
      setError("Password is too long.");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError(
        "Password must contain at least one uppercase letter."
      );
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError(
        "Password must contain at least one lowercase letter."
      );
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError(
        "Password must contain at least one number."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    /* REFERRAL */

    if (!referralCode) {
      setError(
        "Referral code is required."
      );
      return;
    }

    if (
      !/^[A-Z0-9_-]{3,32}$/.test(
        referralCode
      )
    ) {
      setError(
        "Invalid referral code format."
      );
      return;
    }

    /* TERMS */

    if (!form.agree) {
      setError(
        "Please agree to the Terms and Conditions."
      );
      return;
    }

    setLoading(true);

    try {
      /* FINAL REFERRAL CHECK */

      const {
        data: referral,
        error: referralError,
      } = await supabase
        .from("referral_codes")
        .select(
          "id, code, name, reward, max_reward, is_active, created_by"
        )
        .eq("code", referralCode)
        .eq("is_active", true)
        .maybeSingle();

      if (referralError) {
        console.error(
          "Final referral error:",
          referralError
        );

        setError(
          "Could not verify referral code. Please try again."
        );

        return;
      }

      if (!referral) {
        setReferralValid(false);

        setError(
          "Invalid or inactive referral code."
        );

        return;
      }

      setReferralValid(true);

      /* CREATE ACCOUNT */

      const {
        data,
        error: signupError,
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            referred_by: referralCode,
            referral_code: referralCode,
          },
        },
      });

      if (signupError) {
        console.error(
          "Supabase signup error:",
          signupError
        );

        const message =
          signupError.message.toLowerCase();

        if (
          message.includes("already registered") ||
          message.includes("already exists") ||
          message.includes("user already registered")
        ) {
          setError(
            "An account with this email already exists. Please login instead."
          );
        } else if (
          message.includes("password")
        ) {
          setError(
            "Password does not meet the account security requirements."
          );
        } else if (
          message.includes("rate limit")
        ) {
          setError(
            "Too many signup attempts. Please wait a few minutes and try again."
          );
        } else {
          setError(
            signupError.message
          );
        }

        return;
      }

      if (!data.user) {
        setError(
          "Account could not be created. Please try again."
        );

        return;
      }

      /*
       * IMPORTANT:
       *
       * If Supabase email confirmation is ON,
       * data.session can be null.
       *
       * EarnNova flow requires direct dashboard
       * after signup, so email confirmation should
       * be OFF in Supabase Auth settings.
       */

      if (!data.session) {
        setError(
          "Account was created, but no login session was created. Please disable email confirmation in Supabase Authentication settings and try again."
        );

        return;
      }

      /* SAVE LOCAL USER INFO */

      localStorage.setItem(
        "earnNovaLoggedIn",
        "true"
      );

      localStorage.setItem(
        "earnNovaUserEmail",
        email
      );

      localStorage.setItem(
        "earnNovaUserName",
        name
      );

      localStorage.setItem(
        "earnNovaReferralCode",
        referralCode
      );

      localStorage.setItem(
        "earnNovaUserId",
        data.user.id
      );

      /* SUCCESS */

      setSuccess(
        "Account created successfully. Opening your dashboard..."
      );

      /*
       * DIRECT DASHBOARD
       *
       * No activate redirect.
       * No plans redirect.
       * No redirect query.
       */

      window.location.replace(
        "/dashboard"
      );
    } catch (err) {
      console.error(
        "Signup error:",
        err
      );

      setError(
        "Something went wrong while creating your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     PASSWORD RULES
     ========================================================= */

  const passwordHasLength =
    form.password.length >= 8;

  const passwordHasUpper =
    /[A-Z]/.test(form.password);

  const passwordHasLower =
    /[a-z]/.test(form.password);

  const passwordHasNumber =
    /[0-9]/.test(form.password);

  /* =========================================================
     UI
     ========================================================= */

  return (
    <main className="min-h-screen bg-slate-50">

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
                Earn
                <span className="text-blue-600">
                  Nova
                </span>
              </div>

              <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                Earn • Grow • Repeat
              </div>

            </div>

          </a>

          <div className="text-sm text-slate-500">

            Already have an account?

            <a
              href="/login"
              className="ml-1.5 font-bold text-blue-600 hover:text-blue-700"
            >
              Login
            </a>

          </div>

        </div>

      </header>

      {/* MAIN */}

      <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl lg:grid-cols-2">

        {/* LEFT */}

        <div className="relative hidden overflow-hidden bg-slate-950 px-10 py-16 lg:flex lg:flex-col lg:justify-center xl:px-16">

          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

          <div className="absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

          <div className="relative z-10 max-w-lg">

            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300">

              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              Secure account registration

            </div>

            <h1 className="text-4xl font-black leading-tight text-white xl:text-5xl">

              Start your

              <span className="block text-blue-400">
                EarnNova journey.
              </span>

            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
              Create your account and access tasks,
              rewards, referrals and your personal
              EarnNova wallet.
            </p>

            <div className="mt-10 space-y-5">

              {[
                "Secure account authentication",
                "Referral rewards tracking",
                "Personal earnings dashboard",
                "Protected wallet system",
              ].map((item) => (

                <div
                  key={item}
                  className="flex items-center gap-3 text-sm font-medium text-slate-300"
                >

                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                    <CheckIcon />
                  </span>

                  {item}

                </div>

              ))}

            </div>

            <div className="mt-12 flex items-center gap-3 border-t border-white/10 pt-6 text-xs text-slate-500">

              <ShieldIcon />

              <span>
                Your account information is protected.
              </span>

            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12 xl:px-20">

          <div className="w-full max-w-xl">

            {/* MOBILE BRAND */}

            <div className="mb-8 flex items-center gap-3 lg:hidden">

              <LogoMark />

              <div>

                <div className="text-[20px] font-black text-slate-950">
                  Earn
                  <span className="text-blue-600">
                    Nova
                  </span>
                </div>

                <div className="text-[9px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Earn • Grow • Repeat
                </div>

              </div>

            </div>

            {/* FORM CARD */}

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">

              <div className="mb-7">

                <p className="mb-2 text-sm font-bold uppercase tracking-widest text-blue-600">
                  Create Account
                </p>

                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Join EarnNova
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your details below to get started.
                </p>

              </div>

              {/* ERROR */}

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700">
                  {error}
                </div>
              )}

              {/* SUCCESS */}

              {success && (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700">
                  {success}
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* NAME */}

                <div>

                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Full Name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                    maxLength={80}
                    placeholder="Enter your full name"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

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
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    autoComplete="email"
                    maxLength={120}
                    placeholder="you@example.com"
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                </div>

                {/* PASSWORD */}

                <div>

                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Password
                  </label>

                  <div className="relative">

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={form.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      maxLength={72}
                      placeholder="Create a strong password"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      <EyeIcon
                        hidden={showPassword}
                      />
                    </button>

                  </div>

                  {form.password && (
                    <div className="mt-3 grid grid-cols-2 gap-2">

                      <PasswordRule
                        valid={passwordHasLength}
                        text="8+ characters"
                      />

                      <PasswordRule
                        valid={passwordHasUpper}
                        text="Uppercase"
                      />

                      <PasswordRule
                        valid={passwordHasLower}
                        text="Lowercase"
                      />

                      <PasswordRule
                        valid={passwordHasNumber}
                        text="Number"
                      />

                    </div>
                  )}

                </div>

                {/* CONFIRM PASSWORD */}

                <div>

                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-bold text-slate-700"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">

                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showConfirm
                          ? "text"
                          : "password"
                      }
                      value={form.confirmPassword}
                      onChange={handleChange}
                      autoComplete="new-password"
                      maxLength={72}
                      placeholder="Confirm your password"
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirm(
                          (prev) => !prev
                        )
                      }
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                      aria-label={
                        showConfirm
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      <EyeIcon
                        hidden={showConfirm}
                      />
                    </button>

                  </div>

                </div>

                {/* REFERRAL */}

                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">

                  <div className="mb-3 flex items-center justify-between">

                    <div>

                      <label
                        htmlFor="referralCode"
                        className="block text-sm font-bold text-slate-800"
                      >
                        Referral Code
                      </label>

                      <p className="mt-1 text-xs text-slate-500">
                        Enter your referral code.
                      </p>

                    </div>

                    {referralValid === true && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                        Valid
                      </span>
                    )}

                    {referralValid === false && (
                      <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-700">
                        Invalid
                      </span>
                    )}

                  </div>

                  <div className="relative">

                    <input
                      id="referralCode"
                      name="referralCode"
                      type="text"
                      value={form.referralCode}
                      onChange={handleChange}
                      onBlur={validateReferral}
                      maxLength={32}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                      disabled={loading}
                      placeholder="EARNNOVA"
                      className={`h-12 w-full rounded-xl border bg-white px-4 pr-28 text-sm font-bold uppercase tracking-wide text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
                        referralValid === true
                          ? "border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/10"
                          : referralValid === false
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/10"
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/10"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={validateReferral}
                      disabled={
                        referralChecking ||
                        loading
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {referralChecking
                        ? "Checking..."
                        : "Check"}
                    </button>

                  </div>

                  <div className="mt-2 flex items-center justify-between">

                    <p className="text-[11px] text-slate-500">
                      Default code:
                      <span className="ml-1 font-bold text-blue-600">
                        EARNNOVA
                      </span>
                    </p>

                    <span className="text-[11px] font-medium text-slate-400">
                      {form.referralCode.length}/32
                    </span>

                  </div>

                </div>

                {/* HONEYPOT */}

                <div
                  className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
                  aria-hidden="true"
                >

                  <label htmlFor="website">
                    Website
                  </label>

                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={handleChange}
                  />

                </div>

                {/* TERMS */}

                <label className="flex cursor-pointer items-start gap-3">

                  <input
                    type="checkbox"
                    name="agree"
                    checked={form.agree}
                    onChange={handleChange}
                    disabled={loading}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
                  />

                  <span className="text-xs leading-5 text-slate-500">

                    I agree to the{" "}

                    <a
                      href="/terms"
                      className="font-bold text-blue-600 hover:text-blue-700"
                    >
                      Terms and Conditions
                    </a>

                    {" "}and{" "}

                    <a
                      href="/privacy"
                      className="font-bold text-blue-600 hover:text-blue-700"
                    >
                      Privacy Policy
                    </a>

                    .

                  </span>

                </label>

                {/* SUBMIT */}

                <button
                  type="submit"
                  disabled={
                    loading ||
                    referralChecking
                  }
                  className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-blue-600/30 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account

                      <span className="transition-transform group-hover:translate-x-1">
                        <ArrowIcon />
                      </span>
                    </>
                  )}

                </button>

                {/* LOGIN */}

                <p className="text-center text-sm text-slate-500">

                  Already registered?{" "}

                  <a
                    href="/login"
                    className="font-bold text-blue-600 hover:text-blue-700"
                  >
                    Login to EarnNova
                  </a>

                </p>

              </form>

            </div>

            {/* SECURITY */}

            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldIcon />
              Secure authentication powered by EarnNova
            </div>

          </div>

        </div>

      </section>

    </main>
  );
}