"use client";

import { useEffect, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowRight,
  BriefcaseBusiness,
  CircleDollarSign,
  Headphones,
  LogOut,
  Menu,
  PlayCircle,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
  X,
  Crown,
  Sparkles,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  wallet: number | null;
  pending_balance: number | null;
  total_earned: number | null;
  today_earnings: number | null;
  total_referrals: number | null;
  membership: string | null;
  is_blocked: boolean;
  block_reason: string | null;
};

type Activation = {
  id: string;
  user_id: string;
  amount: number | null;
  currency: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const [activationRequest, setActivationRequest] =
    useState<Activation | null>(null);

  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("AUTH ERROR:", userError);

        setErrorMessage(
          "Unable to verify your login session."
        );

        return;
      }

      if (!user) {
        window.location.replace("/login");
        return;
      }

      /*
       * LOAD PROFILE
       */

      const {
        data,
        error,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          email,
          wallet,
          pending_balance,
          total_earned,
          today_earnings,
          total_referrals,
          membership,
          is_blocked,
          block_reason
        `)
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("PROFILE ERROR:", error);

        setErrorMessage(
          error.message ||
            "Unable to load your profile."
        );

        return;
      }

      if (!data) {
        setErrorMessage(
          "Your account exists, but your profile has not been created yet."
        );

        return;
      }

      setProfile({
        id: data.id,

        full_name:
          data.full_name ??
          user.user_metadata?.full_name ??
          null,

        email:
          data.email ??
          user.email ??
          null,

        wallet: Number(data.wallet ?? 0),

        pending_balance: Number(
          data.pending_balance ?? 0
        ),

        total_earned: Number(
          data.total_earned ?? 0
        ),

        today_earnings: Number(
          data.today_earnings ?? 0
        ),

        total_referrals: Number(
          data.total_referrals ?? 0
        ),

        membership:
          data.membership ?? "Free",

        is_blocked:
          Boolean(data.is_blocked),

        block_reason:
          data.block_reason ?? null,
      });

      /*
       * LOAD LATEST PENDING ACTIVATION
       *
       * IMPORTANT:
       * The activation system now uses:
       * public.activations
       */

      const {
        data: activationData,
        error: activationError,
      } = await supabase
        .from("activations")
        .select(`
          id,
          user_id,
          amount,
          currency,
          payment_method,
          payment_reference,
          status,
          created_at,
          updated_at
        `)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (activationError) {
        console.error(
          "ACTIVATION ERROR:",
          activationError
        );

        /*
         * Do not break dashboard if activation
         * read has an RLS problem.
         */
        setActivationRequest(null);
      } else {
        setActivationRequest(
          activationData
            ? {
                ...activationData,
                amount: Number(
                  activationData.amount ?? 0
                ),
              }
            : null
        );
      }
    } catch (error) {
      console.error(
        "DASHBOARD ERROR:",
        error
      );

      setErrorMessage(
        "Something went wrong while loading your dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * LOGOUT
   */

  async function logout() {
    try {
      await supabase.auth.signOut();

      localStorage.removeItem(
        "earnNovaLoggedIn"
      );

      localStorage.removeItem(
        "earnNovaUserEmail"
      );

      localStorage.removeItem(
        "earnNovaUserName"
      );

      localStorage.removeItem(
        "earnNovaSelectedPlan"
      );

      localStorage.removeItem(
        "earnNovaActivation"
      );

      window.location.replace("/login");
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );

      window.location.replace("/login");
    }
  }

  /*
   * LOADING
   */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b10] px-5 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-800 border-t-blue-500" />

          <p className="text-sm font-semibold text-slate-400">
            Loading EarnNova...
          </p>
        </div>
      </main>
    );
  }

  /*
   * ERROR
   */

  if (errorMessage || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b10] px-5 text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#11151b] p-6 shadow-2xl">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <ShieldCheck size={26} />
          </div>

          <h1 className="mt-5 text-center text-xl font-black">
            Unable to Load Dashboard
          </h1>

          <p className="mt-3 text-center text-sm leading-6 text-slate-400">
            {errorMessage ||
              "Your profile could not be loaded."}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">

            <button
              onClick={loadProfile}
              className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              Try Again
            </button>

            <button
              onClick={logout}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
            >
              Logout
            </button>

          </div>
        </div>
      </main>
    );
  }

  /*
   * BLOCKED ACCOUNT
   */

  if (profile.is_blocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b10] px-5 text-white">

        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-[#11151b] p-7 text-center shadow-2xl">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
            <ShieldCheck size={30} />
          </div>

          <h1 className="mt-5 text-2xl font-black">
            Account Blocked
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Your EarnNova account has been temporarily
            blocked. You cannot access earning features
            while your account is blocked.
          </p>

          {profile.block_reason && (
            <div className="mt-5 rounded-2xl border border-red-500/10 bg-red-500/[0.04] p-4 text-left">

              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-400">
                Reason
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                {profile.block_reason}
              </p>

            </div>
          )}

          <div className="mt-6 flex gap-3">

            <a
              href="/dashboard/support"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              <Headphones size={17} />
              Contact Support
            </a>

            <button
              onClick={logout}
              className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-300 transition hover:bg-slate-800"
            >
              <LogOut size={18} />
            </button>

          </div>
        </div>
      </main>
    );
  }

  /*
   * PROFILE VALUES
   */

  const balance = Number(
    profile.wallet ?? 0
  );

  const pendingBalance = Number(
    profile.pending_balance ?? 0
  );

  const totalEarned = Number(
    profile.total_earned ?? 0
  );

  const today = Number(
    profile.today_earnings ?? 0
  );

  const referrals = Number(
    profile.total_referrals ?? 0
  );

  const membership =
    profile.membership?.trim() || "Free";

  const displayName =
    profile.full_name?.trim() ||
    "Member";

  /*
   * MEMBERSHIP STATUS
   */

  const normalizedMembership =
    membership.toLowerCase().trim();

  const hasActivePlan =
    normalizedMembership !== "" &&
    normalizedMembership !== "free" &&
    normalizedMembership !== "none" &&
    normalizedMembership !== "inactive" &&
    normalizedMembership !== "pending";

  /*
   * ACTIVATION STATUS
   */

  const requestStatus =
    activationRequest?.status
      ?.toLowerCase()
      .trim() || "";

  const hasPendingActivation =
    requestStatus === "pending";

  /*
   * PROTECTED LINKS
   */

  const earningHref = (
    href: string
  ) => {
    if (hasActivePlan) {
      return href;
    }

    if (hasPendingActivation) {
      return "#activation-pending";
    }

    return "/plans";
  };

  const depositHref =
    hasActivePlan
      ? "/dashboard/deposit"
      : hasPendingActivation
      ? "#activation-pending"
      : "/plans";

  const withdrawHref =
    hasActivePlan
      ? "/dashboard/withdraw"
      : hasPendingActivation
      ? "#activation-pending"
      : "/plans";

  const referralHref =
    hasActivePlan
      ? "/dashboard/referral"
      : hasPendingActivation
      ? "#activation-pending"
      : "/plans";

  /*
   * PROTECTED CLICK
   */

  const handleProtectedClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href === "#activation-pending") {
      event.preventDefault();
      setShowPending(true);
    }
  };

  return (
    <main className="min-h-screen bg-[#070b10] px-3 py-4 text-white sm:px-5 sm:py-7">

      <div className="mx-auto w-full max-w-[570px]">

        {/* HEADER */}

        <header className="mb-5 flex items-center justify-between">

          <div className="flex items-center gap-3">

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

            <div>

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

          <button
            onClick={logout}
            aria-label="Logout"
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-red-500/30 hover:text-red-400"
          >
            <LogOut size={20} />
          </button>

        </header>

        {/* WELCOME */}

        <section className="mb-4 rounded-2xl border border-blue-500/10 bg-gradient-to-r from-blue-500/[0.06] to-transparent px-4 py-3">

          <div className="flex items-center gap-2">

            <Sparkles
              size={13}
              className="text-blue-400"
            />

            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400">
              Welcome back
            </p>

          </div>

          <p className="mt-1 truncate text-sm font-bold text-white">
            {displayName}
          </p>

        </section>

        {/* PENDING ACTIVATION */}

        {hasPendingActivation &&
          activationRequest && (
            <section className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4">

              <div className="flex items-center justify-between gap-3">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                    <ShieldCheck size={20} />
                  </div>

                  <div>

                    <p className="text-sm font-black text-white">
                      Activation Pending
                    </p>

                    <p className="mt-1 text-[10px] text-slate-500">
                      Your activation payment is
                      waiting for admin approval.
                    </p>

                  </div>

                </div>

                <button
                  onClick={() =>
                    setShowPending(true)
                  }
                  className="shrink-0 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[10px] font-black text-amber-400 transition hover:bg-amber-500/15"
                >
                  Receipt
                </button>

              </div>

            </section>
          )}

        {/* NO ACTIVE PLAN */}

        {!hasActivePlan &&
          !hasPendingActivation && (
            <section className="mb-4 rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Crown size={20} />
                </div>

                <div className="flex-1">

                  <p className="text-sm font-black text-white">
                    Account Not Activated
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-slate-500">
                    Choose a membership plan and
                    submit your activation payment.
                  </p>

                </div>

                <a
                  href="/plans"
                  className="shrink-0 rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-black text-white transition hover:bg-blue-500"
                >
                  Activate
                </a>

              </div>

            </section>
          )}

        {/* ACTIVE PLAN */}

        {hasActivePlan && (
          <section className="mb-4 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.04] px-4 py-3">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Crown size={17} />
              </div>

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400">
                  Active Membership
                </p>

                <p className="mt-1 text-sm font-black text-white">
                  {membership}
                </p>

              </div>

            </div>

          </section>
        )}

        {/* BALANCE */}

        <section className="rounded-[22px] border border-slate-800 bg-[#11151b] p-5 shadow-2xl sm:p-6">

          <div className="flex items-start justify-between gap-4">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                Current Balance
              </p>

              <div className="mt-1 flex items-center">

                <span className="mr-1 text-xl text-slate-500">
                  $
                </span>

                <span className="text-[40px] font-extrabold tracking-tight">
                  {balance.toFixed(2)}
                </span>

              </div>

              <p className="mt-1 text-[10px] text-slate-600">
                Available for withdrawal
              </p>

            </div>

            <div className="flex shrink-0 items-center gap-2">

              <a
                href={depositHref}
                onClick={(event) =>
                  handleProtectedClick(
                    event,
                    depositHref
                  )
                }
                className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-bold text-blue-400 transition hover:bg-blue-500/15 hover:text-blue-300"
              >
                <CircleDollarSign size={17} />
                Deposit
              </a>

              <a
                href={withdrawHref}
                onClick={(event) =>
                  handleProtectedClick(
                    event,
                    withdrawHref
                  )
                }
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-500"
              >
                <Wallet size={17} />
                Withdraw
              </a>

            </div>

          </div>

          <div className="my-5 h-px bg-slate-800" />

          <div className="grid grid-cols-3">

            <div>

              <p className="text-[9px] uppercase tracking-[0.13em] text-slate-500">
                Total Earned
              </p>

              <p className="mt-2 text-lg font-bold">
                ${totalEarned.toFixed(2)}
              </p>

            </div>

            <div className="border-l border-slate-800 pl-4">

              <p className="text-[9px] uppercase tracking-[0.13em] text-slate-500">
                Pending
              </p>

              <p className="mt-2 text-lg font-bold text-amber-400">
                ${pendingBalance.toFixed(2)}
              </p>

            </div>

            <div className="flex justify-end">

              <div
                className={`flex h-fit items-center gap-2 rounded-full px-3 py-1.5 ${
                  hasActivePlan
                    ? "bg-emerald-500/10"
                    : hasPendingActivation
                    ? "bg-amber-500/10"
                    : "bg-slate-500/10"
                }`}
              >

                <span
                  className={`h-2 w-2 rounded-full ${
                    hasActivePlan
                      ? "bg-emerald-400"
                      : hasPendingActivation
                      ? "bg-amber-400"
                      : "bg-slate-500"
                  }`}
                />

                <span
                  className={`text-[9px] font-bold uppercase ${
                    hasActivePlan
                      ? "text-emerald-400"
                      : hasPendingActivation
                      ? "text-amber-400"
                      : "text-slate-400"
                  }`}
                >
                  {hasPendingActivation
                    ? "Pending"
                    : hasActivePlan
                    ? "Active"
                    : "Inactive"}
                </span>

              </div>

            </div>

          </div>
        </section>

        {/* QUICK ACCESS */}

        <section className="mt-6">

          <div className="mb-4">

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
              EarnNova
            </p>

            <h2 className="mt-1 text-lg font-bold">
              Quick Access
            </h2>

          </div>

          <div className="grid grid-cols-2 gap-3">

            {/* TASKS */}

            <DashboardAction
              href={earningHref(
                "/dashboard/tasks"
              )}
              onClick={handleProtectedClick}
              icon={
                <BriefcaseBusiness size={22} />
              }
              title="Tasks"
              description={
                hasActivePlan
                  ? "Complete tasks & earn"
                  : hasPendingActivation
                  ? "Activation pending"
                  : "Activate a plan to earn"
              }
            />

            {/* VIDEOS */}

            <DashboardAction
              href={earningHref(
                "/dashboard/videos"
              )}
              onClick={handleProtectedClick}
              icon={
                <PlayCircle size={22} />
              }
              title="Watch Videos"
              description={
                hasActivePlan
                  ? "Watch & earn rewards"
                  : hasPendingActivation
                  ? "Activation pending"
                  : "Activate a plan to earn"
              }
            />

            {/* SPIN */}

            <DashboardAction
              href={earningHref(
                "/dashboard/spin"
              )}
              onClick={handleProtectedClick}
              icon={
                <span className="text-[21px]">
                  🎡
                </span>
              }
              title="Spin & Win"
              description={
                hasActivePlan
                  ? "Daily free spin & rewards"
                  : hasPendingActivation
                  ? "Activation pending"
                  : "Activate a plan to spin"
              }
            />

            {/* DEPOSIT */}

            <DashboardAction
              href={depositHref}
              onClick={handleProtectedClick}
              icon={
                <CircleDollarSign size={22} />
              }
              title="Deposit"
              description={
                hasActivePlan
                  ? "Add funds to your wallet"
                  : hasPendingActivation
                  ? "Activation pending"
                  : "Activate a plan first"
              }
            />

            {/* WITHDRAW */}

            <DashboardAction
              href={withdrawHref}
              onClick={handleProtectedClick}
              icon={
                <Wallet size={22} />
              }
              title="Withdraw"
              description={
                hasActivePlan
                  ? "Withdraw your earnings"
                  : hasPendingActivation
                  ? "Activation pending"
                  : "Activate a plan first"
              }
            />

            {/* REFERRAL */}

            <DashboardAction
              href={referralHref}
              onClick={handleProtectedClick}
              icon={
                <Users size={22} />
              }
              title="Referral"
              description={
                hasActivePlan
                  ? `${referrals} referral${
                      referrals === 1
                        ? ""
                        : "s"
                    }`
                  : hasPendingActivation
                  ? "Activation pending"
                  : "Activate a plan first"
              }
            />

            {/* ACCOUNT */}

            <DashboardAction
              href="/dashboard/account"
              icon={
                <UserRound size={22} />
              }
              title="Withdraw Account"
              description="Bank & payment details"
            />

            {/* PLAN */}

            <DashboardAction
              href="/plans"
              icon={
                <Crown size={22} />
              }
              title="Upgrade Plan"
              description={
                hasActivePlan
                  ? `Current: ${membership}`
                  : "Choose a membership"
              }
            />

            {/* SETTINGS */}

            <DashboardAction
              href="/dashboard/settings"
              icon={
                <Settings size={22} />
              }
              title="Settings"
              description="Manage preferences"
            />

          </div>
        </section>

        {/* TODAY */}

        <section className="mt-5 rounded-[20px] border border-slate-800 bg-[#11151b] p-5">

          <div className="flex items-center justify-between">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                Today's Earnings
              </p>

              <p className="mt-2 text-2xl font-extrabold">
                ${today.toFixed(2)}
              </p>

              <p className="mt-1 text-[10px] text-slate-600">
                {hasActivePlan
                  ? "Keep earning with available tasks"
                  : hasPendingActivation
                  ? "Activation is pending approval"
                  : "Activate a plan to start earning"}
              </p>

            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <CircleDollarSign size={23} />
            </div>

          </div>

        </section>

        {/* SUPPORT */}

        <section className="mt-5">

          <a
            href="/dashboard/support"
            className="block rounded-2xl border border-slate-800 bg-[#11151b] p-4 transition hover:border-blue-500/30 hover:bg-blue-500/[0.03]"
          >

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Headphones size={20} />
                </div>

                <div>

                  <p className="text-sm font-bold">
                    Support
                  </p>

                  <p className="mt-1 text-[10px] text-slate-500">
                    Need help? Create a support ticket
                  </p>

                </div>

              </div>

              <ArrowRight
                size={17}
                className="text-slate-700"
              />

            </div>

          </a>

        </section>

        {/* FOOTER */}

        <footer className="py-7 text-center">

          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-700">
            EarnNova
          </p>

          <p className="mt-2 text-[10px] text-slate-700">
            Earn • Grow • Repeat
          </p>

        </footer>

      </div>

      {/* MOBILE MENU BUTTON */}

      <button
        onClick={() =>
          setMenuOpen(!menuOpen)
        }
        aria-label="Open menu"
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 shadow-xl shadow-blue-600/20 md:hidden"
      >
        {menuOpen ? (
          <X size={20} />
        ) : (
          <Menu size={20} />
        )}
      </button>

      {/* MOBILE MENU */}

      {menuOpen && (
        <div className="fixed bottom-20 right-5 z-40 max-h-[70vh] w-60 overflow-y-auto rounded-2xl border border-slate-800 bg-[#11151b] p-2 shadow-2xl">

          <MobileItem
            href="/dashboard"
            icon={
              <CircleDollarSign size={17} />
            }
            label="Dashboard"
          />

          <MobileItem
            href={earningHref(
              "/dashboard/tasks"
            )}
            onClick={handleProtectedClick}
            label="Tasks"
            icon={
              <BriefcaseBusiness size={17} />
            }
          />

          <MobileItem
            href={earningHref(
              "/dashboard/videos"
            )}
            onClick={handleProtectedClick}
            label="Watch Videos"
            icon={
              <PlayCircle size={17} />
            }
          />

          <MobileItem
            href={earningHref(
              "/dashboard/spin"
            )}
            onClick={handleProtectedClick}
            label="Spin & Win"
            icon={
              <span>🎡</span>
            }
          />

          <MobileItem
            href={depositHref}
            onClick={handleProtectedClick}
            label="Deposit"
            icon={
              <CircleDollarSign size={17} />
            }
          />

          <MobileItem
            href={withdrawHref}
            onClick={handleProtectedClick}
            label="Withdraw"
            icon={
              <Wallet size={17} />
            }
          />

          <MobileItem
            href={referralHref}
            onClick={handleProtectedClick}
            label="Referral"
            icon={
              <Users size={17} />
            }
          />

          <MobileItem
            href="/dashboard/account"
            icon={
              <UserRound size={17} />
            }
            label="Withdraw Account"
          />

          <MobileItem
            href="/plans"
            icon={
              <Crown size={17} />
            }
            label="Upgrade Plan"
          />

          <MobileItem
            href="/dashboard/settings"
            icon={
              <Settings size={17} />
            }
            label="Settings"
          />

          <MobileItem
            href="/dashboard/support"
            icon={
              <Headphones size={17} />
            }
            label="Support"
          />

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-400 transition hover:bg-red-500/10"
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>
      )}

      {/* PENDING RECEIPT MODAL */}

      {showPending &&
        activationRequest && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
            onClick={() =>
              setShowPending(false)
            }
          >

            <div
              className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-[#11151b] shadow-2xl"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* HEADER */}

              <div className="border-b border-slate-800 p-5">

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                      <ShieldCheck size={21} />
                    </div>

                    <div>

                      <h2 className="text-lg font-black">
                        Activation Pending
                      </h2>

                      <p className="text-[10px] text-slate-500">
                        Payment submitted successfully
                      </p>

                    </div>

                  </div>

                  <button
                    onClick={() =>
                      setShowPending(false)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 text-slate-500 transition hover:bg-slate-800 hover:text-white"
                  >
                    <X size={18} />
                  </button>

                </div>

              </div>

              {/* RECEIPT */}

              <div className="p-5">

                <div className="rounded-2xl border border-slate-800 bg-[#0b0f14] p-4">

                  <div className="mb-4 flex items-center justify-between">

                    <div>

                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
                        Payment Receipt
                      </p>

                      <p className="mt-1 text-sm font-black text-white">
                        Account Activation
                      </p>

                    </div>

                    <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-[9px] font-black uppercase text-amber-400">
                      Pending
                    </span>

                  </div>

                  <div className="space-y-3">

                    <ReceiptRow
                      label="Amount"
                      value={`$${Number(
                        activationRequest.amount ?? 0
                      ).toFixed(2)}`}
                    />

                    <ReceiptRow
                      label="Currency"
                      value={
                        activationRequest.currency ||
                        "USD"
                      }
                    />

                    <ReceiptRow
                      label="Payment Method"
                      value={
                        activationRequest.payment_method ||
                        "-"
                      }
                    />

                    <ReceiptRow
                      label="Transaction ID"
                      value={
                        activationRequest.payment_reference ||
                        "-"
                      }
                    />

                    {activationRequest.created_at && (
                      <ReceiptRow
                        label="Submitted"
                        value={new Date(
                          activationRequest.created_at
                        ).toLocaleString()}
                      />
                    )}

                  </div>

                </div>

                {/* WAITING MESSAGE */}

                <div className="mt-4 rounded-2xl border border-amber-500/10 bg-amber-500/[0.04] p-4">

                  <div className="flex items-center gap-2">

                    <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />

                    <p className="text-xs font-bold text-amber-400">
                      Waiting for approval
                    </p>

                  </div>

                  <p className="mt-2 text-[10px] leading-5 text-slate-500">
                    Your payment has been submitted
                    and is currently being reviewed by
                    the EarnNova admin team. Earning
                    features will unlock after approval.
                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowPending(false)
                  }
                  className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-500"
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}

    </main>
  );
}

/*
 * DASHBOARD ACTION
 */

function DashboardAction({
  href,
  onClick,
  icon,
  title,
  description,
}: {
  href: string;

  onClick?: (
    event: MouseEvent<HTMLAnchorElement>,
    href: string
  ) => void;

  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(
          event,
          href
        );
      }}
      className="group rounded-2xl border border-slate-800 bg-[#11151b] p-4 transition hover:border-blue-500/30 hover:bg-blue-500/[0.03]"
    >

      <div className="flex items-start justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
          {icon}
        </div>

        <ArrowRight
          size={15}
          className="text-slate-700 transition group-hover:text-blue-400"
        />

      </div>

      <h3 className="mt-4 text-sm font-bold">
        {title}
      </h3>

      <p className="mt-1 text-[10px] leading-4 text-slate-500">
        {description}
      </p>

    </a>
  );
}

/*
 * MOBILE MENU ITEM
 */

function MobileItem({
  href,
  onClick,
  icon,
  label,
}: {
  href: string;

  onClick?: (
    event: MouseEvent<HTMLAnchorElement>,
    href: string
  ) => void;

  icon: ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      onClick={(event) => {
        onClick?.(
          event,
          href
        );
      }}
      className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
    >
      {icon}
      {label}
    </a>
  );
}

/*
 * RECEIPT ROW
 */

function ReceiptRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-800/70 pb-3 last:border-0 last:pb-0">

      <span className="text-[10px] text-slate-600">
        {label}
      </span>

      <span className="max-w-[60%] break-words text-right text-[11px] font-bold text-slate-300">
        {value}
      </span>

    </div>
  );
}