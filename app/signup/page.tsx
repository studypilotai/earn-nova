"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Gift,
  ShieldCheck,
  UserPlus,
  Mail,
  LockKeyhole,
  Link2,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/* =========================================================
   LOGO
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
        valid
          ? "text-emerald-600"
          : "text-slate-400"
      }`}
    >
      <span
        className={`flex h-4 w-4 items-center justify-center rounded-full ${
          valid
            ? "bg-emerald-100"
            : "bg-slate-100"
        }`}
      >
        <Check size={11} strokeWidth={3} />
      </span>

      {text}
    </div>
  );
}

/* =========================================================
   SIGNUP PAGE
========================================================= */

export default function SignupPage() {
  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [referralChecking, setReferralChecking] =
    useState(false);

  const [referralValid, setReferralValid] =
    useState<boolean | null>(null);

  const [referralFromLink, setReferralFromLink] =
    useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
    agree: false,
    website: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* =========================================================
     GET REFERRAL FROM URL
  ========================================================= */

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    const ref = params.get("ref");

    if (!ref) return;

    const cleaned = ref
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "")
      .slice(0, 32);

    if (!cleaned) return;

    setForm((prev) => ({
      ...prev,
      referralCode: cleaned,
    }));

    setReferralFromLink(true);
  }, []);

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
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
  }

  /* =========================================================
     VALIDATE REFERRAL
  ========================================================= */

  async function validateReferral(
    showError = true
  ) {
    const code = form.referralCode
      .trim()
      .toUpperCase();

    /* Optional referral */
    if (!code) {
      setReferralValid(null);

      if (showError) {
        setError("");
      }

      return true;
    }

    if (
      !/^[A-Z0-9_-]{3,32}$/.test(code)
    ) {
      setReferralValid(false);

      if (showError) {
        setError(
          "Invalid referral code format."
        );
      }

      return false;
    }

    setReferralChecking(true);

    try {
      /*
       * IMPORTANT:
       * Referral code is checked against profiles,
       * because profiles.referral_code is the actual
       * personal referral code.
       */

      const { data, error } =
        await supabase
          .from("profiles")
          .select("id, referral_code")
          .eq(
            "referral_code",
            code
          )
          .maybeSingle();

      if (error) {
        console.error(
          "REFERRAL CHECK ERROR:",
          error
        );

        setReferralValid(false);

        if (showError) {
          setError(
            "Unable to verify referral code. Please try again."
          );
        }

        return false;
      }

      if (!data) {
        setReferralValid(false);

        if (showError) {
          setError(
            "Referral code not found."
          );
        }

        return false;
      }

      setReferralValid(true);

      if (showError) {
        setError("");
      }

      return true;
    } catch (error) {
      console.error(
        "REFERRAL CHECK ERROR:",
        error
      );

      setReferralValid(false);

      if (showError) {
        setError(
          "Unable to verify referral code."
        );
      }

      return false;
    } finally {
      setReferralChecking(false);
    }
  }

  /* =========================================================
     SUBMIT
  ========================================================= */

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setError("");
    setSuccess("");

    /* Honeypot */

    if (form.website.trim()) {
      setError(
        "Unable to create account."
      );

      return;
    }

    const name = form.name.trim();

    const email = form.email
      .trim()
      .toLowerCase();

    const password = form.password;

    const confirmPassword =
      form.confirmPassword;

    const referralCode =
      form.referralCode
        .trim()
        .toUpperCase();

    /* =====================================================
       NAME
    ===================================================== */

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

    /* =====================================================
       EMAIL
    ===================================================== */

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

    /* =====================================================
       PASSWORD
    ===================================================== */

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
      setError(
        "Password is too long."
      );

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

    /* =====================================================
       OPTIONAL REFERRAL
    ===================================================== */

    if (referralCode) {
      const referralOkay =
        await validateReferral(true);

      if (!referralOkay) {
        return;
      }
    }

    /* =====================================================
       TERMS
    ===================================================== */

    if (!form.agree) {
      setError(
        "Please agree to the Terms and Conditions."
      );

      return;
    }

    setLoading(true);

    try {
      /* ===================================================
         CREATE SUPABASE ACCOUNT
      =================================================== */

      const {
        data,
        error: signupError,
      } = await supabase.auth.signUp({
        email,
        password,

        options: {
          data: {
            full_name: name,

            /*
             * Keep referral code in auth metadata.
             * Database RPC will securely attach it.
             */
            referred_by:
              referralCode || null,
          },
        },
      });

      if (signupError) {
        console.error(
          "SUPABASE SIGNUP ERROR:",
          signupError
        );

        const message =
          signupError.message.toLowerCase();

        if (
          message.includes(
            "already registered"
          ) ||
          message.includes(
            "already exists"
          ) ||
          message.includes(
            "user already registered"
          )
        ) {
          setError(
            "An account with this email already exists. Please login instead."
          );
        } else if (
          message.includes("password")
        ) {
          setError(
            "Password does not meet the security requirements."
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

      /* ===================================================
         SESSION CHECK
      =================================================== */

      if (!data.session) {
        setError(
          "Account created, but no login session was created. Please disable email confirmation in Supabase Authentication settings."
        );

        return;
      }

      /* ===================================================
         ATTACH REFERRAL SECURELY
      =================================================== */

      if (referralCode) {
        const {
          data: attached,
          error: attachError,
        } = await supabase.rpc(
          "attach_referral",
          {
            p_user_id:
              data.user.id,

            p_referral_code:
              referralCode,
          }
        );

        if (attachError) {
          console.error(
            "ATTACH REFERRAL ERROR:",
            attachError
          );

          /*
           * Account is already created.
           * We don't delete it here.
           * Referral can safely be investigated/fixed
           * without allowing the customer to modify it.
           */

          setError(
            "Account was created, but the referral could not be attached. Please contact support before continuing."
          );

          return;
        }

        if (attached !== true) {
          setError(
            "Account was created, but the referral code could not be attached."
          );

          return;
        }
      }

      /* ===================================================
         LOCAL INFO
      =================================================== */

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

      if (referralCode) {
        localStorage.setItem(
          "earnNovaReferralCode",
          referralCode
        );
      } else {
        localStorage.removeItem(
          "earnNovaReferralCode"
        );
      }

      localStorage.setItem(
        "earnNovaUserId",
        data.user.id
      );

      /* ===================================================
         SUCCESS
      =================================================== */

      setSuccess(
        "Account created successfully. Opening your dashboard..."
      );

      window.location.replace(
        "/dashboard"
      );
    } catch (error) {
      console.error(
        "SIGNUP ERROR:",
        error
      );

      setError(
        "Something went wrong while creating your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     PASSWORD STATUS
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

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <section className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl lg:grid-cols-[0.9fr_1.1fr]">

        {/* ===================================================
            LEFT SIDE
        =================================================== */}

        <div className="relative hidden overflow-hidden bg-[#080d16] px-10 py-16 lg:flex lg:flex-col lg:justify-center xl:px-16">

          <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-3xl" />

          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-600/15 blur-3xl" />

          <div className="relative z-10 max-w-lg">

            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.7)]" />
              Secure registration
            </div>

            <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-white xl:text-5xl">
              Create your
              <span className="mt-2 block text-blue-400">
                EarnNova account.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-7 text-slate-400">
              Join EarnNova and manage your
              account, activities, referrals and
              earnings from one secure dashboard.
            </p>

            <div className="mt-10 space-y-4">

              {[
                {
                  icon: ShieldCheck,
                  text: "Secure authentication",
                },
                {
                  icon: Gift,
                  text: "Referral tracking",
                },
                {
                  icon: UserPlus,
                  text: "Personal dashboard",
                },
                {
                  icon: LockKeyhole,
                  text: "Protected account data",
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
            RIGHT SIDE
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

            {/* FORM CARD */}

            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,0.08)]">

              <div className="border-b border-slate-100 px-6 pb-6 pt-7 sm:px-8">

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
                      Create Account
                    </p>

                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                      Welcome to EarnNova
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      Create your account in a few
                      simple steps.
                    </p>
                  </div>

                  <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 sm:flex">
                    <UserPlus size={20} />
                  </div>
                </div>
              </div>

              <div className="px-6 pb-7 pt-6 sm:px-8">

                {/* ERROR */}

                {error && (
                  <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
                    {error}
                  </div>
                )}

                {/* SUCCESS */}

                {success && (
                  <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-emerald-700">
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
                      className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
                    >
                      <UserPlus size={15} />
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
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                    />
                  </div>

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
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      maxLength={120}
                      placeholder="you@example.com"
                      disabled={loading}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                    />
                  </div>

                  {/* PASSWORD */}

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"
                    >
                      <LockKeyhole size={15} />
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
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (v) => !v
                          )
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {form.password && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <PasswordRule
                          valid={
                            passwordHasLength
                          }
                          text="8+ characters"
                        />

                        <PasswordRule
                          valid={
                            passwordHasUpper
                          }
                          text="Uppercase"
                        />

                        <PasswordRule
                          valid={
                            passwordHasLower
                          }
                          text="Lowercase"
                        />

                        <PasswordRule
                          valid={
                            passwordHasNumber
                          }
                          text="Number"
                        />
                      </div>
                    )}
                  </div>

                  {/* CONFIRM */}

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
                        value={
                          form.confirmPassword
                        }
                        onChange={handleChange}
                        autoComplete="new-password"
                        maxLength={72}
                        placeholder="Confirm your password"
                        disabled={loading}
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:opacity-60"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirm(
                            (v) => !v
                          )
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        {showConfirm ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* =================================================
                      OPTIONAL REFERRAL
                  ================================================= */}

                  <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-slate-50 p-4">

                    <div className="mb-3 flex items-start gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                        <Link2 size={17} />
                      </div>

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center justify-between gap-2">

                          <label
                            htmlFor="referralCode"
                            className="text-sm font-bold text-slate-800"
                          >
                            Referral Code
                          </label>

                          <span className="rounded-full bg-slate-200 px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                            Optional
                          </span>

                        </div>

                        <p className="mt-1 text-[11px] leading-5 text-slate-500">
                          Have a referral code?
                          Enter it here. You can also
                          leave this empty.
                        </p>

                      </div>
                    </div>

                    <div className="relative">

                      <input
                        id="referralCode"
                        name="referralCode"
                        type="text"
                        value={
                          form.referralCode
                        }
                        onChange={handleChange}
                        onBlur={() =>
                          validateReferral(
                            true
                          )
                        }
                        maxLength={32}
                        autoCapitalize="characters"
                        autoCorrect="off"
                        spellCheck={false}
                        disabled={loading}
                        placeholder="Enter referral code"
                        className={`h-12 w-full rounded-xl border bg-white px-4 pr-24 text-sm font-bold uppercase tracking-wide text-slate-900 outline-none transition placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 disabled:opacity-60 ${
                          referralValid === true
                            ? "border-emerald-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                            : referralValid === false
                            ? "border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                            : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                        }`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          validateReferral(
                            true
                          )
                        }
                        disabled={
                          referralChecking ||
                          loading ||
                          !form.referralCode
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-slate-900 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {referralChecking
                          ? "Checking..."
                          : "Check"}
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">

                      <div className="flex items-center gap-1.5 text-[10px]">

                        {referralValid === true && (
                          <>
                            <Check
                              size={13}
                              className="text-emerald-600"
                            />

                            <span className="font-semibold text-emerald-600">
                              Valid referral code
                            </span>
                          </>
                        )}

                        {referralValid === false && (
                          <span className="font-semibold text-red-600">
                            Code not found
                          </span>
                        )}

                        {referralValid === null &&
                          !referralFromLink && (
                            <span className="text-slate-400">
                              This field is optional
                            </span>
                          )}

                        {referralFromLink &&
                          referralValid === null && (
                            <span className="text-blue-600">
                              Referral link detected
                            </span>
                          )}

                      </div>

                      <span className="text-[10px] font-medium text-slate-400">
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
                      className="mt-1 h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />

                    <span className="text-xs leading-5 text-slate-500">
                      I agree to the{" "}
                      <a
                        href="/terms"
                        className="font-bold text-blue-600 hover:text-blue-700"
                      >
                        Terms and Conditions
                      </a>{" "}
                      and{" "}
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

                        <ArrowRight
                          size={18}
                          className="transition-transform group-hover:translate-x-1"
                        />
                      </>
                    )}

                  </button>

                  {/* MOBILE LOGIN */}

                  <p className="text-center text-sm text-slate-500 sm:hidden">
                    Already have an account?{" "}
                    <a
                      href="/login"
                      className="font-bold text-blue-600"
                    >
                      Login
                    </a>
                  </p>

                </form>
              </div>
            </div>

            {/* SECURITY */}

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