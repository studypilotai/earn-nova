"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
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
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Profile = {
  id: string;
  full_name: string;
  email: string;
  referral_code: string;
};

type ReferralUser = {
  id: string;
  full_name: string;
  email: string;
  wallet: number;
  membership: string;
};

export default function ReferralPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [referrals, setReferrals] = useState<ReferralUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadReferralData();
  }, []);

  async function loadReferralData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        window.location.replace("/login");
        return;
      }

      // Load current user's profile
      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select(
            "id, full_name, email, referral_code"
          )
          .eq("id", user.id)
          .single();

      if (profileError || !profileData) {
        setErrorMessage(
          "Unable to load your referral information."
        );
        return;
      }

      setProfile(profileData);

      // Find users referred by current user
      const { data: referralData, error: referralError } =
        await supabase
          .from("profiles")
          .select(
            "id, full_name, email, wallet, membership"
          )
          .eq("referred_by_uid", user.id)
          .order("created_at", {
            ascending: false,
          });

      if (referralError) {
        console.error(
          "REFERRAL ERROR:",
          referralError
        );

        // If referred_by_uid is not available yet,
        // keep the main referral information working.
        setReferrals([]);
        return;
      }

      setReferrals(
        (referralData || []).map((item) => ({
          ...item,
          wallet: Number(item.wallet ?? 0),
        }))
      );
    } catch (error) {
      console.error(
        "REFERRAL PAGE ERROR:",
        error
      );

      setErrorMessage(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function getReferralLink() {
    if (!profile?.referral_code) return "";

    if (typeof window === "undefined") {
      return "";
    }

    return `${window.location.origin}/signup?ref=${profile.referral_code}`;
  }

  async function copyText(
    text: string,
    type: string
  ) {
    try {
      await navigator.clipboard.writeText(text);

      setCopied(type);

      setTimeout(() => {
        setCopied("");
      }, 2000);
    } catch (error) {
      console.error("COPY ERROR:", error);
    }
  }

  async function shareReferral() {
    const link = getReferralLink();

    if (!link) return;

    if (
      typeof navigator !== "undefined" &&
      navigator.share
    ) {
      try {
        await navigator.share({
          title: "Join EarnNova",
          text: "Join EarnNova and start earning!",
          url: link,
        });
      } catch {
        // User cancelled sharing
      }
    } else {
      await copyText(link, "share");
    }
  }

  /*
   * IMPORTANT:
   * A referral is considered activated when the
   * referred user's membership is no longer "Free".
   *
   * Later, when the activation system is finalized,
   * this should be replaced with a dedicated
   * activation status field.
   */
  const activatedCount = referrals.filter(
    (user) =>
      user.membership &&
      user.membership.toLowerCase() !== "free"
  ).length;

  const pendingCount =
    referrals.length - activatedCount;

  /*
   * Referral reward is NOT given merely on signup.
   *
   * This display calculates earned reward only
   * for activated referrals.
   *
   * The actual wallet credit must be handled
   * server-side when activation is approved.
   */
  const REFERRAL_REWARD = 1;
  const referralEarnings =
    activatedCount * REFERRAL_REWARD;

  return (
    <main className="min-h-screen bg-[#070b10] px-3 py-4 text-white sm:px-5 sm:py-7">
      <div className="mx-auto w-full max-w-[570px]">

        {/* HEADER */}
        <header className="mb-5 flex items-center gap-3">
          <a
            href="/dashboard"
            aria-label="Back to Dashboard"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/40 hover:text-white"
          >
            <ArrowLeft size={20} />
          </a>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg">
            <span className="text-lg font-black italic text-slate-950">
              E<span className="text-blue-600">N</span>
            </span>
          </div>

          <div>
            <h1 className="text-lg font-extrabold">
              Earn<span className="text-blue-500">Nova</span>
            </h1>

            <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600">
              Referral Program
            </p>
          </div>
        </header>

        {/* LOADING */}
        {loading && (
          <div className="rounded-[20px] border border-slate-800 bg-[#11151b] p-8 text-center">
            <Loader2
              size={28}
              className="mx-auto animate-spin text-blue-500"
            />

            <p className="mt-3 text-sm font-semibold text-slate-400">
              Loading referral information...
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && errorMessage && (
          <div className="rounded-[20px] border border-red-500/20 bg-[#11151b] p-6 text-center">
            <p className="text-sm font-semibold text-red-400">
              {errorMessage}
            </p>

            <button
              onClick={loadReferralData}
              className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white hover:bg-blue-500"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !errorMessage && profile && (
          <>
            {/* INTRO */}
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
                    Invite friends to EarnNova and
                    earn a referral reward after their
                    account is activated.
                  </p>
                </div>
              </div>
            </section>

            {/* REFERRAL CODE */}
            <section className="mb-3 rounded-[20px] border border-slate-800 bg-[#11151b] p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
                Your Referral Code
              </p>

              <div className="mt-2 flex items-center gap-2">
                <div className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3">
                  <p className="truncate text-sm font-black tracking-widest text-white">
                    {profile.referral_code}
                  </p>
                </div>

                <button
                  onClick={() =>
                    copyText(
                      profile.referral_code,
                      "code"
                    )
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500"
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

            {/* REFERRAL LINK */}
            <section className="mb-4 rounded-[20px] border border-slate-800 bg-[#11151b] p-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
                Your Referral Link
              </p>

              <div className="mt-2 flex items-center gap-2">
                <div className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3">
                  <p className="truncate text-xs text-slate-400">
                    {getReferralLink()}
                  </p>
                </div>

                <button
                  onClick={() =>
                    copyText(
                      getReferralLink(),
                      "link"
                    )
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition hover:bg-blue-500"
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
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 py-3 text-xs font-bold text-blue-400 transition hover:bg-blue-500/10"
              >
                <Share2 size={15} />
                Share Referral Link
              </button>
            </section>

            {/* STATISTICS */}
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
                    Activated accounts
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
                      Earnings
                    </p>
                  </div>

                  <p className="mt-3 text-2xl font-black text-purple-400">
                    ${referralEarnings.toFixed(2)}
                  </p>

                  <p className="mt-1 text-[9px] text-slate-600">
                    From activated referrals
                  </p>
                </div>
              </div>
            </section>

            {/* REFERRAL LIST */}
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold">
                  Your Referrals
                </h2>

                <span className="text-[9px] text-slate-600">
                  {referrals.length} users
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
                    Share your referral link and
                    invite your friends to EarnNova.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referrals.map((referral) => {
                    const isActivated =
                      referral.membership &&
                      referral.membership.toLowerCase() !==
                        "free";

                    return (
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
                            {referral.email}
                          </p>
                        </div>

                        {/* STATUS + REWARD */}
                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-[8px] font-bold ${
                              isActivated
                                ? "bg-green-500/10 text-green-400"
                                : "bg-amber-500/10 text-amber-400"
                            }`}
                          >
                            {isActivated
                              ? "Activated"
                              : "Pending"}
                          </span>

                          <p
                            className={`mt-1 text-xs font-black ${
                              isActivated
                                ? "text-green-400"
                                : "text-slate-600"
                            }`}
                          >
                            {isActivated
                              ? `+$${REFERRAL_REWARD.toFixed(
                                  2
                                )}`
                              : "$0.00"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* REWARD RULE */}
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
                    Referral rewards are not given when
                    someone only signs up. The referred
                    user must activate their EarnNova
                    account first. Until activation, the
                    referral remains pending and earns
                    $0.00.
                  </p>
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="py-7 text-center">
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-700">
                EarnNova
              </p>

              <p className="mt-2 text-[10px] text-slate-700">
                Earn • Grow • Repeat
              </p>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}