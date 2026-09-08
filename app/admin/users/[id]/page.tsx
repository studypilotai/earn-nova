"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  is_blocked: boolean;
  block_reason: string | null;
  created_at: string | null;
};

export default function AdminUserDetailsPage() {
  const params = useParams();

  const userId = params?.id as string;

  const [user, setUser] =
    useState<UserProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [blockReason, setBlockReason] =
    useState("");

  useEffect(() => {
    if (userId) {
      loadUser();
    }
  }, [userId]);

  async function verifyAdmin() {
    const {
      data: { user: admin },
    } = await supabase.auth.getUser();

    if (!admin) {
      window.location.href = "/admin/login";
      return false;
    }

    const { data: adminProfile } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", admin.id)
        .single();

    if (adminProfile?.role !== "admin") {
      window.location.href = "/dashboard";
      return false;
    }

    return true;
  }

  async function loadUser() {
    try {
      setRefreshing(true);
      setError("");
      setSuccess("");

      const isAdmin = await verifyAdmin();

      if (!isAdmin) return;

      const { data, error: userError } =
        await supabase
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
          "USER ERROR:",
          userError
        );

        setError(userError.message);
        return;
      }

      if (!data) {
        setError("User not found.");
        return;
      }

      setUser(data as UserProfile);
      setBlockReason(
        data.block_reason || ""
      );
    } catch (error) {
      console.error(
        "LOAD USER ERROR:",
        error
      );

      setError(
        "Unable to load user details."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function updateBlockStatus(
    blocked: boolean
  ) {
    if (!user) return;

    if (
      blocked &&
      !blockReason.trim()
    ) {
      setError(
        "Please enter a reason before blocking this user."
      );
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const isAdmin = await verifyAdmin();

      if (!isAdmin) return;

      const { error: updateError } =
        await supabase
          .from("profiles")
          .update({
            is_blocked: blocked,
            block_reason: blocked
              ? blockReason.trim()
              : null,
          })
          .eq("id", user.id)
          .eq("role", "customer");

      if (updateError) {
        console.error(
          "BLOCK UPDATE ERROR:",
          updateError
        );

        setError(
          updateError.message
        );

        return;
      }

      setUser({
        ...user,
        is_blocked: blocked,
        block_reason: blocked
          ? blockReason.trim()
          : null,
      });

      setSuccess(
        blocked
          ? "User has been blocked successfully."
          : "User has been unblocked successfully."
      );
    } catch (error) {
      console.error(
        "BLOCK ERROR:",
        error
      );

      setError(
        "Unable to update user status."
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-sm font-medium text-slate-500">
            Loading user...
          </div>
        </div>
      </main>
    );
  }

  if (error && !user) {
    return (
      <main className="min-h-screen bg-slate-100 p-5 sm:p-8">
        <div className="mx-auto max-w-xl">
          <a
            href="/admin/users"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Back to Users
          </a>

          <div className="mt-6 rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertCircle size={27} />
            </div>

            <h1 className="mt-4 text-xl font-bold text-slate-900">
              Unable to Load User
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>

            <button
              onClick={loadUser}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <RefreshCw size={17} />
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const wallet = Number(
    user.wallet || 0
  );

  const pending = Number(
    user.pending_balance || 0
  );

  const earned = Number(
    user.total_earned || 0
  );

  const today = Number(
    user.today_earnings || 0
  );

  const referrals = Number(
    user.total_referrals || 0
  );

  const createdDate = user.created_at
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

  return (
    <main className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <a
              href="/admin/users"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={19} />
            </a>

            <div>
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                User Details
              </h1>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Manage user account
              </p>
            </div>
          </div>

          <button
            onClick={loadUser}
            disabled={refreshing}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
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

          {/* MESSAGES */}
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
              <CheckCircle size={18} />
              {success}
            </div>
          )}

          {/* USER HEADER CARD */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <User size={30} />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      {user.full_name ||
                        "Unnamed User"}
                    </h2>

                    {user.is_blocked ? (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold text-red-700">
                        BLOCKED
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-[10px] font-bold text-green-700">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <Mail size={15} />

                    <span className="truncate">
                      {user.email ||
                        "No email"}
                    </span>
                  </div>

                  <p className="mt-1 break-all text-[10px] text-slate-400">
                    User ID: {user.id}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3 text-left sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Member Since
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {createdDate}
                </p>
              </div>
            </div>
          </section>

          {/* STATS */}
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

          {/* ACCOUNT INFORMATION */}
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-900">
                Account Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Current user account details
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
                  user.is_blocked
                    ? "Blocked"
                    : "Active"
                }
              />
            </div>
          </section>

          {/* BLOCK MANAGEMENT */}
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-900">
                Account Control
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Control access to earning features.
              </p>
            </div>

            <div className="p-5">

              {user.is_blocked ? (
                <div>
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                    <div className="flex items-start gap-3">
                      <Ban
                        size={21}
                        className="mt-0.5 shrink-0 text-red-500"
                      />

                      <div>
                        <p className="font-bold text-red-800">
                          This account is blocked
                        </p>

                        <p className="mt-1 text-sm text-red-700">
                          The user cannot access
                          earning features.
                        </p>

                        {user.block_reason && (
                          <div className="mt-3 rounded-xl bg-white/70 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-red-500">
                              Block Reason
                            </p>

                            <p className="mt-1 text-sm text-red-800">
                              {user.block_reason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      updateBlockStatus(false)
                    }
                    disabled={actionLoading}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-60"
                  >
                    <ShieldCheck
                      size={18}
                    />

                    {actionLoading
                      ? "Updating..."
                      : "Unblock User"}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                    <div className="flex items-center gap-3">
                      <ShieldCheck
                        size={22}
                        className="text-green-600"
                      />

                      <div>
                        <p className="font-bold text-green-800">
                          Account is active
                        </p>

                        <p className="mt-1 text-sm text-green-700">
                          This user can access
                          earning features.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="text-sm font-semibold text-slate-700">
                      Block Reason
                    </label>

                    <textarea
                      value={blockReason}
                      onChange={(e) =>
                        setBlockReason(
                          e.target.value
                        )
                      }
                      placeholder="Enter reason for blocking this user..."
                      rows={3}
                      className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
                    />

                    <button
                      onClick={() =>
                        updateBlockStatus(true)
                      }
                      disabled={
                        actionLoading
                      }
                      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
                    >
                      <ShieldOff
                        size={18}
                      />

                      {actionLoading
                        ? "Blocking..."
                        : "Block User"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* BACK */}
          <div className="py-7">
            <a
              href="/admin/users"
              className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-500"
            >
              <ArrowLeft size={17} />
              Back to All Users
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

// =====================================================
// STAT CARD
// =====================================================

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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// DETAIL BOX
// =====================================================

function DetailBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}