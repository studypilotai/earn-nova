"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WITHDRAWAL_FEE_PERCENT = 10;

type Withdrawal = {
  id: string;
  user_id: string;
  withdrawal_account_id: string | null;
  amount: number;
  fee: number;
  net_amount: number;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at?: string;
};

type FilterType =
  | "all"
  | "pending"
  | "approved"
  | "rejected";

export default function WithdrawalsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [processing, setProcessing] =
    useState<string | null>(null);
  const [filter, setFilter] =
    useState<FilterType>("all");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/admin/login");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      error ||
      !profile ||
      profile.role !== "admin"
    ) {
      await supabase.auth.signOut();
      router.replace("/admin/login");
      return;
    }

    await loadWithdrawals();

    setLoading(false);
  }

  async function loadWithdrawals() {
    const { data, error } = await supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "Withdrawals error:",
        error
      );
      alert(error.message);
      return;
    }

    setWithdrawals(data || []);
  }

  async function updateStatus(
    withdrawal: Withdrawal,
    status: "approved" | "rejected"
  ) {
    const action =
      status === "approved"
        ? "approve"
        : "reject";

    const confirmed = confirm(
      `Are you sure you want to ${action} this withdrawal?`
    );

    if (!confirmed) return;

    setProcessing(withdrawal.id);

    const { error } = await supabase
      .from("withdrawals")
      .update({
        status,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", withdrawal.id);

    if (error) {
      alert(error.message);
      setProcessing(null);
      return;
    }

    setWithdrawals((current) =>
      current.map((item) =>
        item.id === withdrawal.id
          ? {
              ...item,
              status,
            }
          : item
      )
    );

    setProcessing(null);
  }

  const filteredWithdrawals = useMemo(() => {
    if (filter === "all") {
      return withdrawals;
    }

    return withdrawals.filter(
      (withdrawal) =>
        withdrawal.status === filter
    );
  }, [withdrawals, filter]);

  const counts = {
    all: withdrawals.length,

    pending: withdrawals.filter(
      (item) => item.status === "pending"
    ).length,

    approved: withdrawals.filter(
      (item) => item.status === "approved"
    ).length,

    rejected: withdrawals.filter(
      (item) => item.status === "rejected"
    ).length,
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 text-slate-600">
          <RefreshCw
            className="h-5 w-5 animate-spin"
          />
          Loading Withdrawals...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex min-h-20 flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                router.push("/admin")
              }
              className="rounded-xl border border-slate-200 p-2.5 transition hover:bg-slate-50"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Withdrawals
              </h1>

              <p className="text-sm text-slate-500">
                Manage customer withdrawal requests
              </p>
            </div>
          </div>

          {/* REFRESH ONLY */}
          <button
            onClick={loadWithdrawals}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </header>

      <div className="p-5 md:p-8">
        {/* FEE CARD */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Withdrawal Fee
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {WITHDRAWAL_FEE_PERCENT}%
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Applied to every withdrawal request.
              </p>
            </div>

            <div className="rounded-xl bg-blue-50 px-5 py-3 sm:text-right">
              <p className="text-xs text-slate-500">
                Example
              </p>

              <p className="font-semibold text-slate-900">
                $10 → $9 received
              </p>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="mb-6 flex flex-wrap gap-2">
          <FilterButton
            label="All"
            count={counts.all}
            active={filter === "all"}
            onClick={() =>
              setFilter("all")
            }
          />

          <FilterButton
            label="Pending"
            count={counts.pending}
            active={filter === "pending"}
            onClick={() =>
              setFilter("pending")
            }
          />

          <FilterButton
            label="Approved"
            count={counts.approved}
            active={filter === "approved"}
            onClick={() =>
              setFilter("approved")
            }
          />

          <FilterButton
            label="Rejected"
            count={counts.rejected}
            active={filter === "rejected"}
            onClick={() =>
              setFilter("rejected")
            }
          />
        </div>

        {/* WITHDRAWALS CARD */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Wallet size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Withdrawal Requests
                </h2>

                <p className="text-sm text-slate-500">
                  Review and manage customer withdrawals.
                </p>
              </div>
            </div>
          </div>

          {filteredWithdrawals.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Wallet className="text-slate-500" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No{" "}
                {filter === "all"
                  ? ""
                  : filter}{" "}
                withdrawals
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Real customer withdrawal requests
                will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">
                      User
                    </th>

                    <th className="px-5 py-4">
                      Amount
                    </th>

                    <th className="px-5 py-4">
                      Fee
                    </th>

                    <th className="px-5 py-4">
                      Net Amount
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Date
                    </th>

                    <th className="px-5 py-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredWithdrawals.map(
                    (withdrawal) => (
                      <tr
                        key={withdrawal.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        {/* USER */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                              <Wallet
                                size={17}
                                className="text-slate-500"
                              />
                            </div>

                            <div>
                              <div className="font-semibold text-slate-900">
                                Customer
                              </div>

                              <div className="max-w-[180px] truncate font-mono text-[11px] text-slate-400">
                                {
                                  withdrawal.user_id
                                }
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* AMOUNT */}
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          $
                          {Number(
                            withdrawal.amount
                          ).toFixed(2)}
                        </td>

                        {/* FEE */}
                        <td className="px-5 py-4">
                          <div className="font-semibold text-red-600">
                            $
                            {Number(
                              withdrawal.fee
                            ).toFixed(2)}
                          </div>

                          <div className="text-xs text-slate-400">
                            {WITHDRAWAL_FEE_PERCENT}%
                          </div>
                        </td>

                        {/* NET AMOUNT */}
                        <td className="px-5 py-4 font-semibold text-green-600">
                          $
                          {Number(
                            withdrawal.net_amount
                          ).toFixed(2)}
                        </td>

                        {/* STATUS */}
                        <td className="px-5 py-4">
                          <StatusBadge
                            status={
                              withdrawal.status
                            }
                          />
                        </td>

                        {/* DATE */}
                        <td className="px-5 py-4 text-sm text-slate-500">
                          {new Date(
                            withdrawal.created_at
                          ).toLocaleString()}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-5 py-4">
                          {withdrawal.status ===
                            "pending" && (
                            <div className="flex justify-end gap-2">
                              <button
                                disabled={
                                  processing ===
                                  withdrawal.id
                                }
                                onClick={() =>
                                  updateStatus(
                                    withdrawal,
                                    "approved"
                                  )
                                }
                                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <CheckCircle
                                  size={15}
                                />
                                Approve
                              </button>

                              <button
                                disabled={
                                  processing ===
                                  withdrawal.id
                                }
                                onClick={() =>
                                  updateStatus(
                                    withdrawal,
                                    "rejected"
                                  )
                                }
                                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <XCircle
                                  size={15}
                                />
                                Reject
                              </button>
                            </div>
                          )}

                          {withdrawal.status ===
                            "approved" && (
                            <div className="flex justify-end">
                              <span className="text-xs font-semibold text-green-600">
                                Completed
                              </span>
                            </div>
                          )}

                          {withdrawal.status ===
                            "rejected" && (
                            <div className="flex justify-end">
                              <span className="text-xs font-semibold text-red-600">
                                Rejected
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function FilterButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}

      <span
        className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
          active
            ? "bg-white/20 text-white"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        <CheckCircle size={13} />
        Approved
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        <XCircle size={13} />
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
      <Clock size={13} />
      Pending
    </span>
  );
}