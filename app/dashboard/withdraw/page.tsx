"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Wallet,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const WITHDRAWAL_FEE_PERCENT = 10;

type Profile = {
  wallet: number;
  pending_balance: number;
  membership: string;
};

type WithdrawalAccount = {
  id: string;
  method: string;
  account_name: string | null;
  account_number: string | null;
  wallet_address: string | null;
};

export default function WithdrawPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [account, setAccount] =
    useState<WithdrawalAccount | null>(null);

  const [amount, setAmount] = useState("");

  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadWithdrawalData();
  }, []);

  async function loadWithdrawalData() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    // Load profile
    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select(
        "wallet, pending_balance, membership"
      )
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(profileError);
      alert(profileError.message);
      setLoading(false);
      return;
    }

    setProfile(profileData);

    // Load latest withdrawal account
    const {
      data: accountData,
      error: accountError,
    } = await supabase
      .from("withdrawal_accounts")
      .select(
        "id, method, account_name, account_number, wallet_address"
      )
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (accountError) {
      console.error(accountError);
    }

    setAccount(accountData || null);

    setLoading(false);
  }

  const numericAmount =
    Number(amount) || 0;

  // Display calculation only.
  // Final fee/net amount is calculated securely by SQL.
  const displayFee =
    numericAmount *
    (WITHDRAWAL_FEE_PERCENT / 100);

  const displayNetAmount =
    numericAmount - displayFee;

  async function submitWithdrawal() {
    if (submitting) return;

    setSuccess(false);

    if (!account) {
      alert(
        "Please add your withdrawal account first."
      );

      router.push("/dashboard/account");
      return;
    }

    if (!profile) {
      alert("Unable to load your wallet.");
      return;
    }

    if (!amount.trim()) {
      alert("Please enter withdrawal amount.");
      return;
    }

    if (!Number.isFinite(numericAmount)) {
      alert("Please enter a valid amount.");
      return;
    }

    if (numericAmount <= 0) {
      alert(
        "Withdrawal amount must be greater than $0."
      );
      return;
    }

    if (numericAmount < 1) {
      alert(
        "Minimum withdrawal amount is $1."
      );
      return;
    }

    if (
      numericAmount >
      Number(profile.wallet)
    ) {
      alert(
        `Insufficient wallet balance.\n\nAvailable: $${Number(
          profile.wallet
        ).toFixed(2)}`
      );
      return;
    }

    const confirmed = confirm(
      `Confirm withdrawal?\n\n` +
        `Amount: $${numericAmount.toFixed(2)}\n` +
        `Fee: $${displayFee.toFixed(2)} (${WITHDRAWAL_FEE_PERCENT}%)\n` +
        `You receive: $${Math.max(
          displayNetAmount,
          0
        ).toFixed(2)}`
    );

    if (!confirmed) return;

    setSubmitting(true);

    /*
     * REAL DATABASE RPC
     *
     * The database handles:
     * - logged-in user
     * - balance validation
     * - withdrawal account ownership
     * - pending withdrawal check
     * - fee
     * - net amount
     * - withdrawal creation
     */
    const { data, error } =
      await supabase.rpc(
        "create_withdrawal_request",
        {
          p_amount: numericAmount,
          p_withdrawal_account_id:
            account.id,
        }
      );

    if (error) {
      console.error(
        "Withdrawal RPC error:",
        error
      );

      alert(
        error.message ||
          "Unable to submit withdrawal request."
      );

      setSubmitting(false);
      return;
    }

    console.log(
      "Withdrawal created:",
      data
    );

    setAmount("");
    setSuccess(true);

    // Refresh balance/account state
    await loadWithdrawalData();

    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw
            size={18}
            className="animate-spin"
          />
          Loading withdrawal...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">

        {/* HEADER */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() =>
              router.push("/dashboard")
            }
            className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 transition hover:bg-slate-800"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold">
              Withdraw
            </h1>

            <p className="text-sm text-slate-400">
              Withdraw your available earnings.
            </p>
          </div>
        </div>

        {/* SUCCESS */}
        {success && (
          <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 text-green-400" />

              <div>
                <h2 className="font-semibold text-green-300">
                  Withdrawal request submitted
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Your request has been sent to the
                  admin for review.
                </p>

                <button
                  onClick={() =>
                    router.push("/dashboard")
                  }
                  className="mt-4 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WALLET */}
        <div className="mb-5 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">
                Available Balance
              </p>

              <p className="mt-1 text-3xl font-bold">
                $
                {Number(
                  profile?.wallet || 0
                ).toFixed(2)}
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
              <Wallet size={22} />
            </div>
          </div>
        </div>

        {/* ACCOUNT CHECK */}
        {!account ? (
          <div className="mb-5 rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 shrink-0 text-yellow-400" />

              <div className="flex-1">
                <h2 className="font-semibold text-yellow-300">
                  Withdrawal account required
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Before requesting a withdrawal,
                  you need to add your receiving account
                  or wallet address.
                </p>

                <button
                  onClick={() =>
                    router.push(
                      "/dashboard/account"
                    )
                  }
                  className="mt-4 rounded-xl bg-yellow-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-yellow-400"
                >
                  Add Withdrawal Account
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-5 rounded-3xl border border-green-500/20 bg-green-500/10 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 shrink-0 text-green-400" />

              <div className="flex-1">
                <h2 className="font-semibold text-green-300">
                  Withdrawal account ready
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Method:{" "}
                  <span className="font-semibold text-slate-300">
                    {account.method}
                  </span>
                </p>

                {account.method === "USDT" &&
                  account.wallet_address && (
                    <p className="mt-2 break-all rounded-xl bg-slate-950/50 p-3 font-mono text-xs text-slate-400">
                      {account.wallet_address}
                    </p>
                  )}

                {account.method !== "USDT" && (
                  <>
                    {account.account_name && (
                      <p className="mt-2 text-sm text-slate-400">
                        Name:{" "}
                        <span className="text-slate-300">
                          {account.account_name}
                        </span>
                      </p>
                    )}

                    {account.account_number && (
                      <p className="mt-1 text-sm text-slate-400">
                        Account:{" "}
                        <span className="text-slate-300">
                          {account.account_number}
                        </span>
                      </p>
                    )}
                  </>
                )}

                <button
                  onClick={() =>
                    router.push(
                      "/dashboard/account"
                    )
                  }
                  className="mt-4 text-sm font-semibold text-blue-400 hover:text-blue-300"
                >
                  Edit Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WITHDRAW FORM */}
        {account && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-bold">
              Withdrawal Amount
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Enter the amount you want to withdraw.
            </p>

            {/* AMOUNT */}
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Amount (USD)
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  $
                </span>

                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value)
                  }
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-9 pr-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Minimum withdrawal: $1
              </p>
            </div>

            {/* CALCULATION */}
            <div className="mt-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-5">

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  Withdrawal amount
                </span>

                <span className="font-semibold">
                  $
                  {numericAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  Fee ({WITHDRAWAL_FEE_PERCENT}%)
                </span>

                <span className="font-semibold text-red-400">
                  -$
                  {displayFee.toFixed(2)}
                </span>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-300">
                    You receive
                  </span>

                  <span className="text-lg font-bold text-green-400">
                    $
                    {Math.max(
                      displayNetAmount,
                      0
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* SUBMIT */}
            <button
              onClick={submitWithdrawal}
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <RefreshCw
                    size={18}
                    className="animate-spin"
                  />
                  Submitting...
                </>
              ) : (
                <>
                  <Wallet size={18} />
                  Submit Withdrawal
                </>
              )}
            </button>
          </div>
        )}

        {/* INFO */}
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h3 className="font-semibold text-slate-300">
            Withdrawal Information
          </h3>

          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>
              • Minimum withdrawal is $1.
            </li>

            <li>
              • Withdrawal fee is{" "}
              {WITHDRAWAL_FEE_PERCENT}%.
            </li>

            <li>
              • Requests are reviewed by the admin.
            </li>

            <li>
              • Make sure your withdrawal account is
              correct.
            </li>
          </ul>
        </div>

      </div>
    </main>
  );
}