"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Copy,
  Check,
  Users,
  UserCheck,
  Clock3,
  DollarSign,
  Share2,
  Loader2,
  Gift,
  RefreshCw,
} from "lucide-react";

const supabase = createClient();

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type ReferralUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  wallet: number;
  membership: string | null;
  activated: boolean;
};

export default function ReferralPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [referralCode, setReferralCode] = useState("");

  const [referrals, setReferrals] = useState<ReferralUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [copied, setCopied] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadReferralData();
  }, []);

  async function loadReferralData() {
    setErrorMessage("");

    try {
      if (!refreshing) {
        setLoading(true);
      }

      /*
       * =====================================================
       * AUTH
       * =====================================================
       */

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("AUTH ERROR:", authError);
        setErrorMessage("Unable to verify your account.");
        return;
      }

      if (!user) {
        window.location.replace("/login");
        return;
      }

      /*
       * =====================================================
       * CURRENT PROFILE
       * =====================================================
       */

      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          `
            id,
            full_name,
            email
          `
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);
        setErrorMessage(
          "Unable to load your referral information."
        );
        return;
      }

      if (!profileData) {
        setErrorMessage(
          "Your profile could not be found. Please contact EarnNova Team."
        );
        return;
      }

      setProfile({
        id: profileData.id,
        full_name: profileData.full_name ?? null,
        email: profileData.email ?? null,
      });

      /*
       * =====================================================
       * PERSONAL REFERRAL CODE
       *
       * Personal code is taken from referral_codes.created_by
       * instead of depending on profiles.referral_code.
       * =====================================================
       */

      const {
        data: codeData,
        error: codeError,
      } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("created_by", user.id)
        .eq("is_active", true)
        .order("created_at", {
          ascending: false,
        })
        .limit(1);

      if (codeError) {
        console.error("REFERRAL CODE ERROR:", codeError);
        setReferralCode("");
      } else {
        setReferralCode(codeData?.[0]?.code ?? "");
      }

      /*
       * =====================================================
       * LOAD REFERRALS
       *
       * Only users whose referred_by_uid matches the
       * currently logged-in user's ID are referrals.
       * =====================================================
       */

      const {
        data: referralData,
        error: referralError,
      } = await supabase
        .from("profiles")
        .select(
          `
            id,
            full_name,
            email,
            wallet,
            membership
          `
        )
        .eq("referred_by_uid", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (referralError) {
        console.error("REFERRAL ERROR:", referralError);

        setReferrals([]);
      } else {
        const rawReferrals = (referralData || []).map(
          (item) => ({
            id: item.id,
            full_name: item.full_name ?? null,
            email: item.email ?? null,
            wallet: Number(item.wallet ?? 0),
            membership: item.membership ?? null,
            activated: false,
          })
        );

        /*
         * ===================================================
         * APPROVED ACTIVATIONS
         *
         * Membership alone is NOT trusted as activation
         * proof. We check the activations table.
         * ===================================================
         */

        const referralIds = rawReferrals.map(
          (item) => item.id
        );

        let activatedIds = new Set<string>();

        if (referralIds.length > 0) {
          const {
            data: activationData,
            error: activationError,
          } = await supabase
            .from("activations")
            .select("user_id")
            .in("user_id", referralIds)
            .eq("status", "approved");

          if (activationError) {
            console.error(
              "ACTIVATION CHECK ERROR:",
              activationError
            );
          } else {
            activatedIds = new Set(
              (activationData || []).map(
                (item) => item.user_id
              )
            );
          }
        }

        const cleanReferrals: ReferralUser[] =
          rawReferrals.map((item) => ({
            ...item,
            activated: activatedIds.has(item.id),
          }));

        setReferrals(cleanReferrals);
      }
    } catch (error) {
      console.error("REFERRAL PAGE ERROR:", error);

      setErrorMessage(
        "Something went wrong while loading referrals."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function refreshReferralData() {
    setRefreshing(true);
    await loadReferralData();
  }

  /*
   * =====================================================
   * REFERRAL LINK
   * =====================================================
   */

  const referralLink = useMemo(() => {
    if (
      typeof window === "undefined" ||
      !referralCode
    ) {
      return "";
    }

    return `${window.location.origin}/signup?ref=${encodeURIComponent(
      referralCode
    )}`;
  }, [referralCode]);

  /*
   * =====================================================
   * COPY
   * =====================================================
   */

  async function copyText(
    text: string,
    type: string
  ) {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);

      setCopied(type);

      window.setTimeout(() => {
        setCopied("");
      }, 2000);
    } catch (error) {
      console.error("COPY ERROR:", error);
    }
  }

  /*
   * =====================================================
   * SHARE
   * =====================================================
   */

  async function shareReferral() {
    if (!referralLink) return;

    if (
      typeof navigator !== "undefined" &&
      navigator.share
    ) {
      try {
        await navigator.share({
          title: "Join EarnNova",
          text: "Join EarnNova using my referral link.",
          url: referralLink,
        });
      } catch {
        // User cancelled sharing.
      }
    } else {
      await copyText(referralLink, "share");
    }
  }

  /*
   * =====================================================
   * STATISTICS
   * =====================================================
   */

  const activatedCount = referrals.filter(
    (user) => user.activated
  ).length;

  const pendingCount =
    referrals.length - activatedCount;

  /*
   * IMPORTANT:
   *
   * Referral reward is NOT calculated in the browser.
   * Actual wallet credit must be handled securely by
   * Supabase RPC / server-side logic after activation.
   *
   * We therefore do NOT show a fake calculated earning.
   * =====================================================
   */

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b10] px-3 py-4 text-white sm:px-5 sm:py-7">
        <div className="mx-auto w-full max-w-[570px]">
          <div className="mb-5 flex items-center gap-3">
            <a
              href="/dashboard"
              aria-label="Back to Dashboard"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/40 hover:text-white"
            >
              <ArrowLeft size={20} />
            </a>

            <LogoMark />

            <div>
              <h1 className="text-[20px] font-black tracking-tight">
                Earn<span className="text-blue-500">Nova</span>
              </h1>

              <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-slate-600">
                Earn • Grow • Repeat
              </p>
            </div>
          </div>

          <div className="rounded-[20px] border border-slate-800 bg-[#11151b] p-10 text-center">
            <Loader2
              size={28}
              className="mx-auto animate-spin text-blue-500"
            />

            <p className="mt-3 text-sm font-semibold text-slate-400">
              Loading referral information...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =====================================================
   * ERROR
   * =====================================================
   */

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#070b10] px-3 py-4 text-white sm:px-5 sm:py-7">
        <div className="mx-auto w-full max-w-[570px]">
          <header className="mb-5 flex items-center gap-3">
            <a
              href="/dashboard"
              aria-label="Back to Dashboard"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/40 hover:text-white"
            >
              <ArrowLeft size={20} />
            </a>

            <LogoMark />

            <div>
              <h1 className="text-[20px] font-black tracking-tight">
                Earn<span className="text-blue-500">Nova</span>
              </h1>

              <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-slate-600">
                Earn • Grow • Repeat
              </p>
            </div>
          </header>

          <div className="rounded-[20px] border border-red-500/20 bg-[#11151b] p-7 text-center">
            <p className="text-sm font-semibold text-red-400">
              {errorMessage}
            </p>

            <button
              onClick={loadReferralData}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-500"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =====================================================
   * MAIN PAGE
   * =====================================================
   */

  return (
    <main className="min-h-screen bg-[#070b10] px-3 py-4 text-white sm:px-5 sm:py-7">
      <div className="mx-auto w-full max-w-[570px]">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="mb-5 flex items-center gap-3">
          <a
            href="/dashboard"
            aria-label="Back to Dashboard"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/40 hover:text-white"
          >
            <ArrowLeft size={20} />
          </a>

          <LogoMark />

          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-black tracking-tight">
              Earn<span className="text-blue-500">Nova</span>
            </h1>

            <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-slate-600">
              Earn • Grow • Repeat
            </p>
          </div>

          <button
            onClick={refreshReferralData}
            disabled={refreshing}
            aria-label="Refresh referrals"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/40 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
          </button>
        </header>

        {/* =================================================
            INTRO
        ================================================= */}

        <section className="mb-4 rounded-[20px] border border-blue-500/10 bg-blue-500/[0.04] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Gift size={24} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400">
                Referral Program
              </p>

              <h2 className="mt-1 text-xl font-black">
                Invite & Earn
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Invite friends to EarnNova using your
                personal referral link. Referral rewards
                are processed after the referred account
                becomes activated.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            REFERRAL CODE
        ================================================= */}

        <section className="mb-3 rounded-[20px] border border-slate-800 bg-[#11151b] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
              Your Referral Code
            </p>

            <span className="rounded-full bg-green-500/10 px-2 py-1 text-[8px] font-bold text-green-400">
              Personal Code
            </span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3">
              <p className="truncate text-sm font-black tracking-widest text-white">
                {referralCode || "Not Available"}
              </p>
            </div>

            <button
              onClick={() =>
                copyText(
                  referralCode,
                  "code"
                )
              }
              disabled={!referralCode}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Copy referral code"
            >
              {copied === "code" ? (
                <Check size={17} />
              ) : (
                <Copy size={17} />
              )}
            </button>
          </div>

          {copied === "code" && (
            <p className="mt-2 text-[10px] font-semibold text-green-400">
              Referral code copied!
            </p>
          )}
        </section>

        {/* =================================================
            REFERRAL LINK
        ================================================= */}

        <section className="mb-4 rounded-[20px] border border-slate-800 bg-[#11151b] p-4">
          <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
            Your Referral Link
          </p>

          <div className="mt-2 flex items-center gap-2">
            <div className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3">
              <p className="truncate text-xs text-slate-400">
                {referralLink ||
                  "Referral link unavailable"}
              </p>
            </div>

            <button
              onClick={() =>
                copyText(
                  referralLink,
                  "link"
                )
              }
              disabled={!referralLink}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Copy referral link"
            >
              {copied === "link" ? (
                <Check size={17} />
              ) : (
                <Copy size={17} />
              )}
            </button>
          </div>

          {copied === "link" && (
            <p className="mt-2 text-[10px] font-semibold text-green-400">
              Referral link copied!
            </p>
          )}

          <button
            onClick={shareReferral}
            disabled={!referralLink}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 py-3 text-xs font-bold text-blue-400 transition hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Share2 size={15} />
            Share Referral Link
          </button>

          {copied === "share" && (
            <p className="mt-2 text-center text-[10px] font-semibold text-green-400">
              Referral link copied!
            </p>
          )}
        </section>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="mb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">
              Referral Statistics
            </h2>

            <span className="text-[9px] text-slate-600">
              Total: {referrals.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">

            {/* JOINED */}

            <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <Users size={17} />
                </div>

                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                  Joined
                </p>
              </div>

              <p className="mt-3 text-2xl font-black">
                {referrals.length}
              </p>

              <p className="mt-1 text-[9px] text-slate-600">
                Total referrals
              </p>
            </div>

            {/* ACTIVATED */}

            <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
                  <UserCheck size={17} />
                </div>

                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                  Activated
                </p>
              </div>

              <p className="mt-3 text-2xl font-black text-green-400">
                {activatedCount}
              </p>

              <p className="mt-1 text-[9px] text-slate-600">
                Approved accounts
              </p>
            </div>

            {/* PENDING */}

            <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <Clock3 size={17} />
                </div>

                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                  Pending
                </p>
              </div>

              <p className="mt-3 text-2xl font-black text-amber-400">
                {pendingCount}
              </p>

              <p className="mt-1 text-[9px] text-slate-600">
                Waiting for activation
              </p>
            </div>

            {/* EARNINGS */}

            <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                  <DollarSign size={17} />
                </div>

                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                  Rewards
                </p>
              </div>

              <p className="mt-3 text-lg font-black text-purple-400">
                Server Processed
              </p>

              <p className="mt-1 text-[9px] text-slate-600">
                Rewards are credited securely
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            REFERRAL LIST
        ================================================= */}

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">
              Your Referrals
            </h2>

            <span className="text-[9px] text-slate-600">
              {referrals.length}{" "}
              {referrals.length === 1
                ? "user"
                : "users"}
            </span>
          </div>

          {referrals.length === 0 ? (
            <div className="rounded-[20px] border border-slate-800 bg-[#11151b] p-7 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500">
                <Users size={22} />
              </div>

              <h3 className="mt-4 text-sm font-bold">
                No Referrals Yet
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-600">
                Share your referral link and invite
                friends to join EarnNova.
              </p>

              {referralCode && (
                <button
                  onClick={shareReferral}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500"
                >
                  <Share2 size={14} />
                  Invite Friends
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#11151b] p-3.5"
                >
                  {/* AVATAR */}

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-sm font-black text-blue-400">
                    {referral.full_name
                      ?.charAt(0)
                      .toUpperCase() || "U"}
                  </div>

                  {/* USER */}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">
                      {referral.full_name ||
                        "User"}
                    </p>

                    <p className="mt-0.5 truncate text-[9px] text-slate-600">
                      {referral.email ||
                        "Email unavailable"}
                    </p>
                  </div>

                  {/* STATUS */}

                  <div className="shrink-0 text-right">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-[8px] font-bold ${
                        referral.activated
                          ? "bg-green-500/10 text-green-400"
                          : "bg-amber-500/10 text-amber-400"
                      }`}
                    >
                      {referral.activated
                        ? "Activated"
                        : "Pending"}
                    </span>

                    <p
                      className={`mt-1 text-[9px] font-semibold ${
                        referral.activated
                          ? "text-green-400"
                          : "text-slate-600"
                      }`}
                    >
                      {referral.activated
                        ? "Reward eligible"
                        : "No reward yet"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =================================================
            REWARD RULE
        ================================================= */}

        <section className="mt-5 rounded-2xl border border-amber-500/10 bg-amber-500/[0.04] p-4">
          <div className="flex items-start gap-3">
            <Gift
              size={17}
              className="mt-0.5 shrink-0 text-amber-400"
            />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400">
                Referral Reward Rule
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Signup alone does not generate a
                referral reward. A referral becomes
                eligible only after the referred account
                receives an approved activation. Actual
                wallet credit is processed securely by
                EarnNova server-side logic.
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="py-7 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-700">
            EarnNova
          </p>

          <p className="mt-2 text-[10px] text-slate-700">
            Earn • Grow • Repeat
          </p>
        </footer>
      </div>
    </main>
  );
}

/*
 * =========================================================
 * EARNNOVA MASTER LOGO
 * Same visual logo used by the customer dashboard.
 * =========================================================
 */

function LogoMark() {
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
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