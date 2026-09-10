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

const WITHDRAWAL_FEE_PERCENT = 5;

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

export default function WithdrawalsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [profiles, setProfiles] = useState<
    Record<string, Profile>
  >({});
  const [accounts, setAccounts] = useState<
    Record<string, WithdrawalAccount>
  >({});
  const [processing, setProcessing] =
    useState<string | null>(null);
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

      const { data: profile, error: profileError } =
        await supabase
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
        router.replace("/admin/login");
        return;
      }

      await loadWithdrawals();
    } catch (error) {
      console.error("Admin check error:", error);
      alert("Unable to verify admin access.");
    } finally {
      setLoading(false);
    }
  }

  async function loadWithdrawals() {
    try {
      const {
        data: withdrawalData,
        error: withdrawalError,
      } = await supabase
        .from("withdrawals")
        .select(
          "id,user_id,withdrawal_account_id,amount,fee,net_amount,status,admin_note,created_at,updated_at"
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
       * -----------------------------------------------------
       * LOAD PROFILES SEPARATELY
       * -----------------------------------------------------
       * This avoids relying on Supabase relationships between
       * withdrawals and profiles.
       */

      const userIds = Array.from(
        new Set(
          withdrawalRows.map(
            (withdrawal) => withdrawal.user_id
          )
        )
      );

      const accountIds = Array.from(
        new Set(
          withdrawalRows
            .map(
              (withdrawal) =>
                withdrawal.withdrawal_account_id
            )
            .filter(
              (id): id is string => Boolean(id)
            )
        )
      );

      const [
        { data: profileData, error: profileError },
        { data: accountData, error: accountError },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "id,full_name,email,phone,wallet"
          )
          .in("id", userIds),

        accountIds.length > 0
          ? supabase
              .from("withdrawal_accounts")
              .select(
                "id,user_id,method,account_name,account_number,wallet_address,bank_name"
              )
              .in("id", accountIds)
          : Promise.resolve({
              data: [],
              error: null,
            }),
      ]);

      if (profileError) {
        console.error(
          "Profiles error:",
          profileError
        );
      }

      if (accountError) {
        console.error(
          "Withdrawal accounts error:",
          accountError
        );
      }

      const profileMap: Record<
        string,
        Profile
      > = {};

      (profileData || []).forEach((profile) => {
        profileMap[profile.id] =
          profile as Profile;
      });

      const accountMap: Record<
        string,
        WithdrawalAccount
      > = {};

      (accountData || []).forEach((account) => {
        accountMap[account.id] =
          account as WithdrawalAccount;
      });

      setProfiles(profileMap);
      setAccounts(accountMap);
    } catch (error) {
      console.error(
        "Load withdrawals error:",
        error
      );
      alert("Failed to load withdrawals.");
    }
  }

  async function approveWithdrawal(
    withdrawal: Withdrawal
  ) {
    const customer =
      profiles[withdrawal.user_id];

    const confirmed = confirm(
      `Approve this withdrawal?\n\n` +
        `Customer: ${
          customer?.full_name ||
          customer?.email ||
          "Customer"
        }\n` +
        `Amount: $${Number(
          withdrawal.amount
        ).toFixed(2)}\n` +
        `Fee: $${Number(
          withdrawal.fee
        ).toFixed(2)}\n` +
        `Customer receives: $${Number(
          withdrawal.net_amount
        ).toFixed(2)}`
    );

    if (!confirmed) return;

    setProcessing(withdrawal.id);

    try {
      const { data, error } =
        await supabase.rpc(
          "admin_approve_withdrawal",
          {
            p_withdrawal_id: withdrawal.id,
            p_admin_note:
              "Approved by EarnNova Team",
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

      if (!data?.success) {
        alert(
          data?.message ||
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
                  "Approved by EarnNova Team",
                updated_at:
                  new Date().toISOString(),
              }
            : item
        )
      );

      alert(
        `Withdrawal approved successfully.\n\n` +
          `Customer receives: $${Number(
            withdrawal.net_amount
          ).toFixed(2)}`
      );
    } catch (error) {
      console.error(
        "Approve withdrawal error:",
        error
      );
      alert(
        "Something went wrong while approving."
      );
    } finally {
      setProcessing(null);
    }
  }

  async function rejectWithdrawal(
    withdrawal: Withdrawal
  ) {
    const customer =
      profiles[withdrawal.user_id];

    const reason = prompt(
      "Enter rejection reason (optional):",
      ""
    );

    if (reason === null) return;

    const confirmed = confirm(
      `Reject this withdrawal?\n\n` +
        `Customer: ${
          customer?.full_name ||
          customer?.email ||
          "Customer"
        }\n` +
        `Amount: $${Number(
          withdrawal.amount
        ).toFixed(2)}\n\n` +
        `The full $${Number(
          withdrawal.amount
        ).toFixed(2)} will be restored to the customer's wallet.`
    );

    if (!confirmed) return;

    setProcessing(withdrawal.id);

    try {
      const note =
        reason.trim() ||
        "Rejected by EarnNova Team";

      const { data, error } =
        await supabase.rpc(
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

      if (!data?.success) {
        alert(
          data?.message ||
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

      alert(
        `Withdrawal rejected.\n\n$${Number(
          withdrawal.amount
        ).toFixed(2)} has been restored to the customer's wallet.`
      );
    } catch (error) {
      console.error(
        "Reject withdrawal error:",
        error
      );
      alert(
        "Something went wrong while rejecting."
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
      {/* =====================================================
          HEADER
      ====================================================== */}

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
        {/* =====================================================
            FEE CARD
        ====================================================== */}

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
                $10 → $9.50 received
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            SECURITY INFO
        ====================================================== */}

        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Wallet size={18} />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">
                Withdrawal Protection
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Customer funds are securely handled by the
                database withdrawal system. Approving a request
                does not deduct the wallet again. Rejecting a
                pending request restores the full requested
                amount.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            FILTERS
        ====================================================== */}

        <div className="mb-6 flex flex-wrap gap-2">
          <FilterButton
            label="All"
            count={counts.all}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />

          <FilterButton
            label="Pending"
            count={counts.pending}
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
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

        {/* =====================================================
            WITHDRAWALS CARD
        ====================================================== */}

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
                Real customer withdrawal requests will
                appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1350px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
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
                          className="border-b border-slate-100 align-top last:border-0"
                        >
                          {/* USER */}

                          <td className="px-5 py-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                                <User
                                  size={17}
                                  className="text-slate-500"
                                />
                              </div>

                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900">
                                  {profile?.full_name ||
                                    "Customer"}
                                </div>

                                {profile?.email && (
                                  <div className="max-w-[190px] truncate text-xs text-slate-500">
                                    {profile.email}
                                  </div>
                                )}

                                {profile?.phone && (
                                  <div className="text-xs text-slate-400">
                                    {profile.phone}
                                  </div>
                                )}

                                <div className="mt-1 max-w-[190px] truncate font-mono text-[10px] text-slate-400">
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
                                  <div className="rounded-lg bg-slate-100 p-2">
                                    {account.method
                                      ?.toLowerCase()
                                      .includes(
                                        "bank"
                                      ) ? (
                                      <Building2
                                        size={15}
                                        className="text-slate-600"
                                      />
                                    ) : (
                                      <Wallet
                                        size={15}
                                        className="text-slate-600"
                                      />
                                    )}
                                  </div>

                                  <div>
                                    <p className="font-semibold text-slate-900">
                                      {account.method ||
                                        "Withdrawal"}
                                    </p>

                                    {account.account_name && (
                                      <p className="text-xs text-slate-500">
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
                                    <span className="font-medium text-slate-700">
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
                              <span className="text-xs text-slate-400">
                                Account details unavailable
                              </span>
                            )}
                          </td>

                          {/* AMOUNT */}

                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900">
                              $
                              {Number(
                                withdrawal.amount
                              ).toFixed(2)}
                            </div>
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

                          {/* NET */}

                          <td className="px-5 py-4">
                            <div className="font-bold text-green-600">
                              $
                              {Number(
                                withdrawal.net_amount
                              ).toFixed(2)}
                            </div>

                            <div className="text-xs text-slate-400">
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
                              <p className="mt-2 max-w-[180px] text-xs leading-5 text-slate-400">
                                {withdrawal.admin_note}
                              </p>
                            )}
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
                                    isProcessing
                                  }
                                  onClick={() =>
                                    approveWithdrawal(
                                      withdrawal
                                    )
                                  }
                                  className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    rejectWithdrawal(
                                      withdrawal
                                    )
                                  }
                                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
    } catch {
      alert("Unable to copy.");
    }
  }

  const displayValue =
    value.length > 30
      ? `${value.slice(0, 15)}...${value.slice(-10)}`
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
        className="shrink-0 rounded-md border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        title="Copy"
      >
        <Copy size={12} />
      </button>
    </div>
  );
}