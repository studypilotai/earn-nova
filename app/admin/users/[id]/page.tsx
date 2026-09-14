"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  ArrowLeft,
  RefreshCw,
  User,
  Mail,
  Wallet,
  TrendingUp,
  Users,
  Clock,
  ShieldCheck,
  ShieldOff,
  Ban,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

/* =========================================================
   SUPABASE
========================================================= */

const supabase = createClient();

/* =========================================================
   TYPES
========================================================= */

type UserProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  wallet: number | null;
  pending_balance: number | null;
  total_earned: number | null;
  today_earnings: number | null;
  total_referrals: number | null;
  membership: string | null;
  is_blocked: boolean | null;
  block_reason: string | null;
  created_at: string | null;
};

/* =========================================================
   PAGE
========================================================= */

export default function AdminUserDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const userId =
    typeof params?.id === "string"
      ? params.id
      : "";

  const [user, setUser] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [blockReason, setBlockReason] =
    useState("");

  /* =======================================================
     VERIFY ADMIN
  ======================================================= */

  const verifyAdmin =
    useCallback(async () => {
      const {
        data: { user: admin },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !admin) {
        router.replace("/admin/login");
        return false;
      }

      const {
        data: adminProfile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", admin.id)
        .maybeSingle();

      if (
        profileError ||
        adminProfile?.role !== "admin"
      ) {
        await supabase.auth.signOut();

        if (typeof window !== "undefined") {
          localStorage.removeItem("earnNovaLoggedIn");
          localStorage.removeItem("earnNovaUserEmail");
          localStorage.removeItem("earnNovaUserName");
          localStorage.removeItem("earnNovaUserId");
        }

        router.replace("/admin/login");
        return false;
      }

      return true;
    }, [router]);

  /* =======================================================
     LOAD USER
  ======================================================= */

  const loadUser =
    useCallback(async () => {
      if (!userId) {
        setError("Invalid user ID.");
        setLoading(false);
        return;
      }

      try {
        setRefreshing(true);
        setError("");
        setSuccess("");

        const isAdmin =
          await verifyAdmin();

        if (!isAdmin) {
          return;
        }

        const {
          data,
          error: userError,
        } = await supabase
          .from("profiles")
          .select(
            `
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
              block_reason,
              created_at
            `
          )
          .eq("id", userId)
          .eq("role", "customer")
          .maybeSingle();

        if (userError) {
          console.error(
            "USER LOAD ERROR:",
            userError
          );

          throw new Error(
            userError.message
          );
        }

        if (!data) {
          throw new Error(
            "Customer user not found."
          );
        }

        const profile =
          data as UserProfile;

        setUser(profile);

        setBlockReason(
          profile.block_reason ?? ""
        );
      } catch (err) {
        console.error(
          "LOAD USER ERROR:",
          err
        );

        setUser(null);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load user details."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    }, [userId, verifyAdmin]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadUser();
  }, [loadUser]);

  /* =======================================================
     UPDATE BLOCK STATUS
  ======================================================= */

  async function updateBlockStatus(
    blocked: boolean
  ) {
    if (!user || actionLoading) {
      return;
    }

    const cleanReason =
      blockReason.trim();

    if (
      blocked &&
      !cleanReason
    ) {
      setError(
        "Please enter a reason before blocking this user."
      );

      return;
    }

    const confirmed =
      window.confirm(
        blocked
          ? `Block "${user.full_name || user.email || "this user"}"?\n\nThis customer will no longer be allowed to use EarnNova earning features.`
          : `Unblock "${user.full_name || user.email || "this user"}"?\n\nThis will restore the customer's earning access.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const isAdmin =
        await verifyAdmin();

      if (!isAdmin) {
        return;
      }

      /*
        IMPORTANT:
        Never update profiles directly from the browser.
        This action is handled by the secure admin RPC.
      */

      const {
        data,
        error: rpcError,
      } = await supabase.rpc(
        "admin_set_user_blocked",
        {
          p_user_id: user.id,
          p_blocked: blocked,
          p_block_reason:
            blocked
              ? cleanReason
              : null,
        }
      );

      if (rpcError) {
        console.error(
          "BLOCK RPC ERROR:",
          rpcError
        );

        throw new Error(
          rpcError.message
        );
      }

      if (
        !data ||
        data.success !== true
      ) {
        throw new Error(
          "The account status could not be updated."
        );
      }

      const newReason =
        blocked
          ? cleanReason
          : null;

      setUser(
        (current) =>
          current
            ? {
                ...current,
                is_blocked:
                  blocked,
                block_reason:
                  newReason,
              }
            : current
      );

      setBlockReason(
        newReason ?? ""
      );

      setSuccess(
        blocked
          ? "User blocked successfully."
          : "User unblocked successfully."
      );
    } catch (err) {
      console.error(
        "UPDATE BLOCK STATUS ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update user status."
      );
    } finally {
      setActionLoading(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b10] text-slate-100">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-blue-500"
            />

            <p className="mt-3 text-sm font-semibold text-slate-500">
              Loading user...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR / USER NOT FOUND
  ======================================================= */

  if (error && !user) {
    return (
      <main className="min-h-screen bg-[#070b10] p-5 text-slate-100 sm:p-8">
        <div className="mx-auto max-w-xl">

          <button
            onClick={() =>
              router.push("/admin/users")
            }
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back to Users
          </button>

          <div className="mt-6 rounded-2xl border border-red-500/20 bg-[#11151b] p-8 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
              <AlertCircle size={27} />
            </div>

            <h1 className="mt-4 text-xl font-black text-white">
              Unable to Load User
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <button
              onClick={() => {
                setLoading(true);
                void loadUser();
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
            >
              <RefreshCw size={17} />
              Try Again
            </button>

          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  /* =======================================================
     VALUES
  ======================================================= */

  const wallet =
    Number(user.wallet) || 0;

  const pending =
    Number(user.pending_balance) || 0;

  const earned =
    Number(user.total_earned) || 0;

  const today =
    Number(user.today_earnings) || 0;

  const referrals =
    Number(user.total_referrals) || 0;

  const blocked =
    user.is_blocked === true;

  const createdDate =
    user.created_at
      ? new Date(
          user.created_at
        ).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "long",
            day: "numeric",
          }
        )
      : "Unknown";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#070b10] text-slate-100">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-slate-800 bg-[#0b0f14]">

        <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-8">

          <div className="flex min-w-0 items-center gap-3">

            <button
              onClick={() =>
                router.push("/admin/users")
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/30 hover:text-white"
              aria-label="Back to users"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

                <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
                  User Details
                </h1>

                <span className="hidden rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-blue-400 sm:inline-flex">
                  EarnNova Team
                </span>

              </div>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Manage customer account
              </p>

            </div>

          </div>

          <button
            onClick={() => {
              setError("");
              setSuccess("");
              void loadUser();
            }}
            disabled={refreshing}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-800 bg-[#11151b] px-4 text-sm font-bold text-slate-300 transition hover:bg-[#151b23] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            <span className="hidden sm:inline">
              Refresh
            </span>
          </button>

        </div>
      </header>

      <div className="p-5 sm:p-8">

        <div className="mx-auto max-w-6xl">

          {/* =================================================
              MESSAGES
          ================================================= */}

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm font-semibold text-red-300">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <span>
                {error}
              </span>
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-300">
              <CheckCircle size={18} />

              <span>
                {success}
              </span>
            </div>
          )}

          {/* =================================================
              USER HEADER
          ================================================= */}

          <section
            className={`rounded-2xl border bg-[#11151b] p-6 ${
              blocked
                ? "border-red-500/20"
                : "border-slate-800"
            }`}
          >

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex min-w-0 items-center gap-4">

                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border ${
                    blocked
                      ? "border-red-500/20 bg-red-500/10 text-red-400"
                      : "border-blue-500/20 bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {blocked ? (
                    <Ban size={30} />
                  ) : (
                    <User size={30} />
                  )}
                </div>

                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-2">

                    <h2 className="text-xl font-black text-white">
                      {user.full_name ||
                        "Unnamed User"}
                    </h2>

                    <span
                      className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase ${
                        blocked
                          ? "border-red-500/20 bg-red-500/10 text-red-400"
                          : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {blocked
                        ? "Blocked"
                        : "Active"}
                    </span>

                  </div>

                  <div className="mt-2 flex min-w-0 items-center gap-2 text-sm text-slate-500">

                    <Mail
                      size={15}
                      className="shrink-0"
                    />

                    <span className="truncate">
                      {user.email ||
                        "No email"}
                    </span>

                  </div>

                  <p className="mt-1 break-all text-[10px] text-slate-700">
                    User ID: {user.id}
                  </p>

                </div>

              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3 sm:text-right">

                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Member Since
                </p>

                <p className="mt-1 text-sm font-bold text-slate-300">
                  {createdDate}
                </p>

              </div>

            </div>

          </section>

          {/* =================================================
              STATS
          ================================================= */}

          <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <StatCard
              title="Wallet"
              value={`$${wallet.toFixed(2)}`}
              icon={<Wallet size={21} />}
            />

            <StatCard
              title="Total Earned"
              value={`$${earned.toFixed(2)}`}
              icon={
                <TrendingUp size={21} />
              }
            />

            <StatCard
              title="Pending"
              value={`$${pending.toFixed(2)}`}
              icon={<Clock size={21} />}
            />

            <StatCard
              title="Referrals"
              value={referrals.toString()}
              icon={<Users size={21} />}
            />

          </section>

          {/* =================================================
              ACCOUNT INFORMATION
          ================================================= */}

          <section className="mt-5 rounded-2xl border border-slate-800 bg-[#11151b]">

            <div className="border-b border-slate-800 p-5">

              <h2 className="text-lg font-black text-white">
                Account Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current customer account details
              </p>

            </div>

            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">

              <DetailBox
                label="Full Name"
                value={
                  user.full_name ||
                  "Not provided"
                }
              />

              <DetailBox
                label="Email"
                value={
                  user.email ||
                  "Not provided"
                }
              />

              <DetailBox
                label="Membership"
                value={
                  user.membership ||
                  "Free"
                }
              />

              <DetailBox
                label="Today's Earnings"
                value={`$${today.toFixed(2)}`}
              />

              <DetailBox
                label="Total Referrals"
                value={referrals.toString()}
              />

              <DetailBox
                label="Account Status"
                value={
                  blocked
                    ? "Blocked"
                    : "Active"
                }
              />

            </div>

          </section>

          {/* =================================================
              ACCOUNT CONTROL
          ================================================= */}

          <section className="mt-5 rounded-2xl border border-slate-800 bg-[#11151b]">

            <div className="border-b border-slate-800 p-5">

              <h2 className="text-lg font-black text-white">
                Account Control
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Control access to EarnNova earning features.
              </p>

            </div>

            <div className="p-5">

              {blocked ? (

                <div>

                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5">

                    <div className="flex items-start gap-3">

                      <Ban
                        size={21}
                        className="mt-0.5 shrink-0 text-red-400"
                      />

                      <div>

                        <p className="font-black text-red-300">
                          This account is blocked
                        </p>

                        <p className="mt-1 text-sm text-red-400/80">
                          The customer cannot use EarnNova earning features.
                        </p>

                        {user.block_reason && (
                          <div className="mt-3 rounded-xl border border-red-500/10 bg-[#11151b]/70 p-3">

                            <p className="text-[10px] font-black uppercase tracking-wide text-red-400">
                              Block Reason
                            </p>

                            <p className="mt-1 text-sm leading-6 text-red-300">
                              {user.block_reason}
                            </p>

                          </div>
                        )}

                      </div>

                    </div>

                  </div>

                  <button
                    onClick={() =>
                      void updateBlockStatus(false)
                    }
                    disabled={actionLoading}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-5 py-3 text-sm font-black text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <RefreshCw
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <ShieldCheck
                        size={18}
                      />
                    )}

                    {actionLoading
                      ? "Updating..."
                      : "Unblock User"}
                  </button>

                </div>

              ) : (

                <div>

                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">

                    <div className="flex items-center gap-3">

                      <ShieldCheck
                        size={22}
                        className="text-emerald-400"
                      />

                      <div>

                        <p className="font-black text-emerald-300">
                          Account is active
                        </p>

                        <p className="mt-1 text-sm text-emerald-400/80">
                          This customer can access earning features according to their active plan.
                        </p>

                      </div>

                    </div>

                  </div>

                  <div className="mt-5">

                    <label className="text-sm font-bold text-slate-300">
                      Block Reason
                    </label>

                    <textarea
                      value={blockReason}
                      onChange={(e) =>
                        setBlockReason(
                          e.target.value
                        )
                      }
                      disabled={
                        actionLoading
                      }
                      placeholder="Enter reason for blocking this user..."
                      rows={3}
                      className="mt-2 w-full resize-none rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-red-500/50 disabled:opacity-50"
                    />

                    <button
                      onClick={() =>
                        void updateBlockStatus(true)
                      }
                      disabled={
                        actionLoading
                      }
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoading ? (
                        <RefreshCw
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <ShieldOff
                          size={18}
                        />
                      )}

                      {actionLoading
                        ? "Blocking..."
                        : "Block User"}
                    </button>

                  </div>

                </div>

              )}

            </div>

          </section>

          {/* =================================================
              BACK
          ================================================= */}

          <div className="py-7">

            <button
              onClick={() =>
                router.push(
                  "/admin/users"
                )
              }
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-400 transition hover:text-blue-300"
            >
              <ArrowLeft size={17} />
              Back to All Users
            </button>

          </div>

        </div>
      </div>
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-5">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {title}
          </p>

          <p className="mt-2 text-2xl font-black text-white">
            {value}
          </p>

        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
          {icon}
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   DETAIL BOX
========================================================= */

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4">

      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-bold text-slate-300">
        {value}
      </p>

    </div>
  );
}