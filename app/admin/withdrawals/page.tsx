"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  User,
  Building2,
  Copy,
} from "lucide-react";

const supabase = createClient();

const WITHDRAWAL_FEE_PERCENT = 10;
const PROCESSING_TIME = "5–7 business days";

const ADMIN_APPROVED_NOTE = "Approved by EarnNova Team";
const ADMIN_REJECTED_NOTE = "Rejected by EarnNova Team";

type Withdrawal = {
  id: string;
  user_id: string;
  withdrawal_account_id: string | null;
  amount: number;
  fee: number;
  net_amount: number;
  status: "pending" | "approved" | "rejected" | string;
  admin_note: string | null;
  created_at: string;
  updated_at?: string;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  wallet: number | null;
};

type WithdrawalAccount = {
  id: string;
  user_id: string;
  method: string | null;
  account_name: string | null;
  account_number: string | null;
  wallet_address: string | null;
  bank_name: string | null;
};

type FilterType =
  | "all"
  | "pending"
  | "approved"
  | "rejected";

type RpcResult = {
  success?: boolean;
  message?: string;
  status?: string;
  amount?: number;
  fee?: number;
  net_amount?: number;
  restored_amount?: number;
};

function getRpcResult(data: unknown): RpcResult | null {
  if (!data) return null;

  if (Array.isArray(data)) {
    return (data[0] as RpcResult) || null;
  }

  if (typeof data === "object") {
    return data as RpcResult;
  }

  return null;
}

export default function WithdrawalsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [withdrawals, setWithdrawals] = useState<
    Withdrawal[]
  >([]);

  const [profiles, setProfiles] = useState<
    Record<string, Profile>
  >({});

  const [accounts, setAccounts] = useState<
    Record<string, WithdrawalAccount>
  >({});

  const [processing, setProcessing] = useState<
    string | null
  >(null);

  const [filter, setFilter] =
    useState<FilterType>("all");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/admin/login");
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (
        profileError ||
        !profile ||
        profile.role !== "admin"
      ) {
        await supabase.auth.signOut();

        try {
          localStorage.clear();
        } catch {}

        router.replace("/admin/login");
        return;
      }

      await loadWithdrawals();
    } catch (error) {
      console.error("Admin verification error:", error);
      alert("Unable to verify admin access.");
    } finally {
      setLoading(false);
    }
  }

  async function loadWithdrawals() {
    try {
      setRefreshing(true);

      const {
        data: withdrawalData,
        error: withdrawalError,
      } = await supabase
        .from("withdrawals")
        .select(
          [
            "id",
            "user_id",
            "withdrawal_account_id",
            "amount",
            "fee",
            "net_amount",
            "status",
            "admin_note",
            "created_at",
            "updated_at",
          ].join(",")
        )
        .order("created_at", {
          ascending: false,
        });

      if (withdrawalError) {
        console.error(
          "Withdrawals error:",
          withdrawalError
        );

        alert(withdrawalError.message);
        return;
      }

      const withdrawalRows =
        (withdrawalData || []) as Withdrawal[];

      setWithdrawals(withdrawalRows);

      if (withdrawalRows.length === 0) {
        setProfiles({});
        setAccounts({});
        return;
      }

      /*
       * Load related records separately.
       *
       * This intentionally avoids relying on Supabase
       * relationship/schema-cache joins.
       */

      const userIds = Array.from(
        new Set(
          withdrawalRows
            .map((item) => item.user_id)
            .filter(Boolean)
        )
      );

      const accountIds = Array.from(
        new Set(
          withdrawalRows
            .map(
              (item) =>
                item.withdrawal_account_id
            )
            .filter(
              (id): id is string => Boolean(id)
            )
        )
      );

      const profilePromise = supabase
        .from("profiles")
        .select(
          "id,full_name,email,phone,wallet"
        )
        .in("id", userIds);

      const accountPromise =
        accountIds.length > 0
          ? supabase
              .from("withdrawal_accounts")
              .select(
                [
                  "id",
                  "user_id",
                  "method",
                  "account_name",
                  "account_number",
                  "wallet_address",
                  "bank_name",
                ].join(",")
              )
              .in("id", accountIds)
          : Promise.resolve({
              data: [],
              error: null,
            });

      const [
        { data: profileData, error: profileError },
        { data: accountData, error: accountError },
      ] = await Promise.all([
        profilePromise,
        accountPromise,
      ]);

      if (profileError) {
        console.error(
          "Profiles loading error:",
          profileError
        );
      }

      if (accountError) {
        console.error(
          "Withdrawal accounts loading error:",
          accountError
        );
      }

      const profileMap: Record<
        string,
        Profile
      > = {};

      (profileData || []).forEach(
        (profile: Profile) => {
          profileMap[profile.id] =
            profile as Profile;
        }
      );

      const accountMap: Record<
        string,
        WithdrawalAccount
      > = {};

      (accountData || []).forEach(
        (account: WithdrawalAccount) => {
          accountMap[account.id] =
            account as WithdrawalAccount;
        }
      );

      setProfiles(profileMap);
      setAccounts(accountMap);
    } catch (error) {
      console.error(
        "Load withdrawals error:",
        error
      );

      alert("Failed to load withdrawals.");
    } finally {
      setRefreshing(false);
    }
  }

  async function approveWithdrawal(
    withdrawal: Withdrawal
  ) {
    if (processing) return;

    if (withdrawal.status !== "pending") {
      alert(
        "This withdrawal has already been processed."
      );
      return;
    }

    const customer =
      profiles[withdrawal.user_id];

    const amount = Number(
      withdrawal.amount
    );

    const fee = Number(withdrawal.fee);

    const netAmount = Number(
      withdrawal.net_amount
    );

    const confirmed = window.confirm(
      `Approve this withdrawal?\n\n` +
        `Customer: ${
          customer?.full_name ||
          customer?.email ||
          "Customer"
        }\n` +
        `Amount: $${amount.toFixed(2)}\n` +
        `Fee: $${fee.toFixed(2)}\n` +
        `Customer receives: $${netAmount.toFixed(
          2
        )}\n\n` +
        `The customer's wallet will NOT be deducted again.`
    );

    if (!confirmed) return;

    setProcessing(withdrawal.id);

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "admin_approve_withdrawal",
        {
          p_withdrawal_id: withdrawal.id,
          p_admin_note: ADMIN_APPROVED_NOTE,
        }
      );

      if (error) {
        console.error(
          "Approve withdrawal error:",
          error
        );

        alert(error.message);
        return;
      }

      const result = getRpcResult(data);

      if (!result?.success) {
        alert(
          result?.message ||
            "Withdrawal approval failed."
        );
        return;
      }

      setWithdrawals((current) =>
        current.map((item) =>
          item.id === withdrawal.id
            ? {
                ...item,
                status: "approved",
                admin_note:
                  ADMIN_APPROVED_NOTE,
                updated_at:
                  new Date().toISOString(),
              }
            : item
        )
      );

      alert(
        `Withdrawal approved successfully.\n\n` +
          `Customer receives: $${netAmount.toFixed(
            2
          )}`
      );
    } catch (error) {
      console.error(
        "Approve withdrawal exception:",
        error
      );

      alert(
        "Something went wrong while approving the withdrawal."
      );
    } finally {
      setProcessing(null);
    }
  }

  async function rejectWithdrawal(
    withdrawal: Withdrawal
  ) {
    if (processing) return;

    if (withdrawal.status !== "pending") {
      alert(
        "This withdrawal has already been processed."
      );
      return;
    }

    const customer =
      profiles[withdrawal.user_id];

    const reason = window.prompt(
      "Enter rejection reason (optional):",
      ""
    );

    if (reason === null) return;

    const cleanReason = reason.trim();

    const confirmed = window.confirm(
      `Reject this withdrawal?\n\n` +
        `Customer: ${
          customer?.full_name ||
          customer?.email ||
          "Customer"
        }\n` +
        `Amount: $${Number(
          withdrawal.amount
        ).toFixed(2)}\n\n` +
        `The full requested amount will be restored to the customer's wallet.`
    );

    if (!confirmed) return;

    setProcessing(withdrawal.id);

    try {
      const note =
        cleanReason ||
        ADMIN_REJECTED_NOTE;

      const {
        data,
        error,
      } = await supabase.rpc(
        "admin_reject_withdrawal",
        {
          p_withdrawal_id: withdrawal.id,
          p_admin_note: note,
        }
      );

      if (error) {
        console.error(
          "Reject withdrawal error:",
          error
        );

        alert(error.message);
        return;
      }

      const result = getRpcResult(data);

      if (!result?.success) {
        alert(
          result?.message ||
            "Withdrawal rejection failed."
        );
        return;
      }

      setWithdrawals((current) =>
        current.map((item) =>
          item.id === withdrawal.id
            ? {
                ...item,
                status: "rejected",
                admin_note: note,
                updated_at:
                  new Date().toISOString(),
              }
            : item
        )
      );

      const restoredAmount =
        Number(
          result.restored_amount ??
            withdrawal.amount
        );

      alert(
        `Withdrawal rejected successfully.\n\n` +
          `$${restoredAmount.toFixed(
            2
          )} has been restored to the customer's wallet.`
      );
    } catch (error) {
      console.error(
        "Reject withdrawal exception:",
        error
      );

      alert(
        "Something went wrong while rejecting the withdrawal."
      );
    } finally {
      setProcessing(null);
    }
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

  const counts = useMemo(
    () => ({
      all: withdrawals.length,

      pending: withdrawals.filter(
        (item) =>
          item.status === "pending"
      ).length,

      approved: withdrawals.filter(
        (item) =>
          item.status === "approved"
      ).length,

      rejected: withdrawals.filter(
        (item) =>
          item.status === "rejected"
      ).length,
    }),
    [withdrawals]
  );

  const pendingAmount = useMemo(
    () =>
      withdrawals
        .filter(
          (item) =>
            item.status === "pending"
        )
        .reduce(
          (total, item) =>
            total + Number(item.amount || 0),
          0
        ),
    [withdrawals]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050b16] text-white">
        <div className="flex items-center gap-3 text-slate-300">
          <RefreshCw
            className="h-5 w-5 animate-spin text-cyan-400"
          />
          Loading Withdrawals...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050b16] text-white">
      {/* HEADER */}

      <header className="border-b border-white/10 bg-[#07101f]/95">
        <div className="flex min-h-20 flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                router.push("/admin")
              }
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Withdrawals
              </h1>

              <p className="text-sm text-slate-400">
                Manage customer withdrawal requests
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadWithdrawals}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* SUMMARY */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Total Requests"
            value={counts.all}
            icon={<Wallet size={18} />}
          />

          <SummaryCard
            label="Pending"
            value={counts.pending}
            icon={<Clock size={18} />}
          />

          <SummaryCard
            label="Approved"
            value={counts.approved}
            icon={
              <CheckCircle size={18} />
            }
          />

          <SummaryCard
            label="Pending Amount"
            value={`$${pendingAmount.toFixed(
              2
            )}`}
            icon={<Wallet size={18} />}
          />
        </div>

        {/* FEE CARD */}

        <div className="mb-6 rounded-2xl border border-cyan-400/10 bg-[#0a1527] p-5 shadow-xl shadow-black/10">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-400">
                Withdrawal Fee
              </p>

              <p className="mt-1 text-3xl font-bold text-white">
                {WITHDRAWAL_FEE_PERCENT}%
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Applied to every withdrawal request.
              </p>
            </div>

            <div className="rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-5 py-4 md:text-right">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Example
              </p>

              <p className="mt-1 font-semibold text-white">
                $10 → $9.00 received
              </p>
            </div>
          </div>
        </div>

        {/* SECURITY INFO */}

        <div className="mb-6 rounded-2xl border border-blue-400/10 bg-blue-500/5 p-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Wallet size={18} />
            </div>

            <div>
              <h3 className="font-bold text-white">
                Withdrawal Protection
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                Customer funds are handled by the
                secure database withdrawal system.
                Approving a pending request does not
                deduct the wallet again. Rejecting a
                pending request restores the full
                requested amount.
              </p>

              <p className="mt-2 text-xs font-medium text-slate-500">
                Standard processing time:{" "}
                {PROCESSING_TIME}
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

        {/* WITHDRAWALS */}

        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a1527] shadow-xl shadow-black/10">
          <div className="border-b border-white/10 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Wallet size={20} />
              </div>

              <div>
                <h2 className="font-bold text-white">
                  Withdrawal Requests
                </h2>

                <p className="text-sm text-slate-400">
                  Review and manage customer withdrawals.
                </p>
              </div>
            </div>
          </div>

          {filteredWithdrawals.length ===
          0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                <Wallet className="text-slate-500" />
              </div>

              <h3 className="mt-4 font-semibold text-white">
                No{" "}
                {filter === "all"
                  ? ""
                  : filter}{" "}
                withdrawals
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Customer withdrawal requests will
                appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1350px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.025] text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-4">
                      User
                    </th>

                    <th className="px-5 py-4">
                      Withdrawal Account
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
                    (withdrawal) => {
                      const profile =
                        profiles[
                          withdrawal.user_id
                        ];

                      const account =
                        withdrawal.withdrawal_account_id
                          ? accounts[
                              withdrawal
                                .withdrawal_account_id
                            ]
                          : null;

                      const isProcessing =
                        processing ===
                        withdrawal.id;

                      return (
                        <tr
                          key={withdrawal.id}
                          className="border-b border-white/5 align-top last:border-0"
                        >
                          {/* USER */}

                          <td className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                                <User
                                  size={17}
                                  className="text-slate-400"
                                />
                              </div>

                              <div className="min-w-0">
                                <div className="font-semibold text-white">
                                  {profile?.full_name ||
                                    "Customer"}
                                </div>

                                {profile?.email && (
                                  <div className="max-w-[190px] truncate text-xs text-slate-400">
                                    {profile.email}
                                  </div>
                                )}

                                {profile?.phone && (
                                  <div className="text-xs text-slate-500">
                                    {profile.phone}
                                  </div>
                                )}

                                <div className="mt-1 max-w-[190px] truncate font-mono text-[10px] text-slate-600">
                                  {withdrawal.user_id}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* ACCOUNT */}

                          <td className="px-5 py-4">
                            {account ? (
                              <div className="min-w-[230px]">
                                <div className="flex items-center gap-2">
                                  <div className="rounded-lg bg-white/5 p-2">
                                    {account.method
                                      ?.toLowerCase()
                                      .includes(
                                        "bank"
                                      ) ? (
                                      <Building2
                                        size={15}
                                        className="text-slate-400"
                                      />
                                    ) : (
                                      <Wallet
                                        size={15}
                                        className="text-slate-400"
                                      />
                                    )}
                                  </div>

                                  <div>
                                    <p className="font-semibold text-white">
                                      {account.method ||
                                        "Withdrawal"}
                                    </p>

                                    {account.account_name && (
                                      <p className="text-xs text-slate-400">
                                        {
                                          account.account_name
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {account.bank_name && (
                                  <p className="mt-2 text-xs text-slate-500">
                                    Bank:{" "}
                                    <span className="font-medium text-slate-300">
                                      {
                                        account.bank_name
                                      }
                                    </span>
                                  </p>
                                )}

                                {account.account_number && (
                                  <CopyValue
                                    value={
                                      account.account_number
                                    }
                                  />
                                )}

                                {account.wallet_address && (
                                  <CopyValue
                                    value={
                                      account.wallet_address
                                    }
                                  />
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">
                                Account details unavailable
                              </span>
                            )}
                          </td>

                          {/* AMOUNT */}

                          <td className="px-5 py-4">
                            <div className="font-bold text-white">
                              $
                              {Number(
                                withdrawal.amount
                              ).toFixed(2)}
                            </div>
                          </td>

                          {/* FEE */}

                          <td className="px-5 py-4">
                            <div className="font-semibold text-red-400">
                              $
                              {Number(
                                withdrawal.fee
                              ).toFixed(2)}
                            </div>

                            <div className="text-xs text-slate-500">
                              {WITHDRAWAL_FEE_PERCENT}%
                            </div>
                          </td>

                          {/* NET */}

                          <td className="px-5 py-4">
                            <div className="font-bold text-emerald-400">
                              $
                              {Number(
                                withdrawal.net_amount
                              ).toFixed(2)}
                            </div>

                            <div className="text-xs text-slate-500">
                              Customer receives
                            </div>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">
                            <StatusBadge
                              status={
                                withdrawal.status
                              }
                            />

                            {withdrawal.admin_note && (
                              <p className="mt-2 max-w-[180px] text-xs leading-5 text-slate-500">
                                {withdrawal.admin_note}
                              </p>
                            )}
                          </td>

                          {/* DATE */}

                          <td className="px-5 py-4 text-sm text-slate-400">
                            {formatDate(
                              withdrawal.created_at
                            )}
                          </td>

                          {/* ACTIONS */}

                          <td className="px-5 py-4">
                            {withdrawal.status ===
                              "pending" && (
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={
                                    isProcessing ||
                                    processing !==
                                      null
                                  }
                                  onClick={() =>
                                    approveWithdrawal(
                                      withdrawal
                                    )
                                  }
                                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing ? (
                                    <RefreshCw
                                      size={15}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <CheckCircle
                                      size={15}
                                    />
                                  )}

                                  Approve
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    isProcessing ||
                                    processing !==
                                      null
                                  }
                                  onClick={() =>
                                    rejectWithdrawal(
                                      withdrawal
                                    )
                                  }
                                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing ? (
                                    <RefreshCw
                                      size={15}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <XCircle
                                      size={15}
                                    />
                                  )}

                                  Reject
                                </button>
                              </div>
                            )}

                            {withdrawal.status ===
                              "approved" && (
                              <div className="flex justify-end">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                                  <CheckCircle
                                    size={14}
                                  />
                                  Completed
                                </span>
                              </div>
                            )}

                            {withdrawal.status ===
                              "rejected" && (
                              <div className="flex justify-end">
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-400">
                                  <XCircle
                                    size={14}
                                  />
                                  Rejected
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    }
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

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a1527] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {label}
        </p>

        <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   FILTER BUTTON
========================================================= */

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
      type="button"
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
        active
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
      }`}
    >
      {label}

      <span
        className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
          active
            ? "bg-white/20 text-white"
            : "bg-white/10 text-slate-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/10 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-400">
        <CheckCircle size={13} />
        Approved
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-400/10 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-400">
        <XCircle size={13} />
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/10 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-400">
      <Clock size={13} />
      Pending
    </span>
  );
}

/* =========================================================
   COPY VALUE
========================================================= */

function CopyValue({
  value,
}: {
  value: string;
}) {
  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value);
      alert("Copied.");
    } catch (error) {
      console.error(
        "Clipboard error:",
        error
      );
      alert("Unable to copy.");
    }
  }

  const displayValue =
    value.length > 30
      ? `${value.slice(0, 15)}...${value.slice(
          -10
        )}`
      : value;

  return (
    <div className="mt-2 flex max-w-[230px] items-center gap-2">
      <span
        title={value}
        className="truncate font-mono text-[11px] text-slate-500"
      >
        {displayValue}
      </span>

      <button
        type="button"
        onClick={copyValue}
        className="shrink-0 rounded-md border border-white/10 bg-white/5 p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
        title="Copy"
      >
        <Copy size={12} />
      </button>
    </div>
  );
}

/* =========================================================
   DATE FORMAT
========================================================= */

function formatDate(
  value: string
) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
}