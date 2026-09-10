"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Wallet,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const WITHDRAWAL_FEE_PERCENT = 5;
const MIN_WITHDRAWAL = 1;

type Profile = {
  wallet: number | null;
  pending_balance: number | null;
};

type WithdrawalAccount = {
  id: string;
  method: string;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
  wallet_address: string | null;
};

export default function WithdrawPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [account, setAccount] =
    useState<WithdrawalAccount | null>(null);

  const [amount, setAmount] = useState("");

  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadWithdrawalData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    /* =========================================================
       LOAD PROFILE
       ========================================================= */

    const {
      data: profileData,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("wallet, pending_balance")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Profile load error:", profileError);

      setErrorMessage(
        profileError.message ||
          "Unable to load your wallet balance."
      );

      setLoading(false);
      return;
    }

    setProfile(profileData);

    /* =========================================================
       LOAD LATEST WITHDRAWAL ACCOUNT
       ========================================================= */

    const {
      data: accountData,
      error: accountError,
    } = await supabase
      .from("withdrawal_accounts")
      .select(
        `
          id,
          method,
          account_name,
          account_number,
          bank_name,
          wallet_address
        `
      )
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (accountError) {
      console.error(
        "Withdrawal account load error:",
        accountError
      );
    }

    setAccount(accountData || null);

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadWithdrawalData();
  }, [loadWithdrawalData]);

  /* =========================================================
     AMOUNT CALCULATION
     DISPLAY ONLY
     FINAL CALCULATION IS DONE BY DATABASE RPC
     ========================================================= */

  const numericAmount = Number(amount) || 0;

  const displayFee =
    numericAmount *
    (WITHDRAWAL_FEE_PERCENT / 100);

  const displayNetAmount =
    Math.max(numericAmount - displayFee, 0);

  /* =========================================================
     SUBMIT WITHDRAWAL
     ========================================================= */

  async function submitWithdrawal() {
    if (submitting) return;

    setSuccess(false);
    setErrorMessage("");

    if (!account) {
      setErrorMessage(
        "Please add your withdrawal account first."
      );

      router.push("/dashboard/account");
      return;
    }

    if (!profile) {
      setErrorMessage(
        "Unable to load your wallet balance."
      );
      return;
    }

    if (!amount.trim()) {
      setErrorMessage(
        "Please enter a withdrawal amount."
      );
      return;
    }

    if (!Number.isFinite(numericAmount)) {
      setErrorMessage(
        "Please enter a valid withdrawal amount."
      );
      return;
    }

    if (numericAmount <= 0) {
      setErrorMessage(
        "Withdrawal amount must be greater than $0."
      );
      return;
    }

    if (numericAmount < MIN_WITHDRAWAL) {
      setErrorMessage(
        `Minimum withdrawal amount is $${MIN_WITHDRAWAL}.`
      );
      return;
    }

    const availableBalance =
      Number(profile.wallet) || 0;

    if (numericAmount > availableBalance) {
      setErrorMessage(
        `Insufficient wallet balance. Available balance: $${availableBalance.toFixed(
          2
        )}`
      );
      return;
    }

    /* =========================================================
       CONFIRMATION
       ========================================================= */

    const confirmed = window.confirm(
      `Confirm withdrawal?\n\n` +
        `Amount: $${numericAmount.toFixed(2)}\n` +
        `Fee: $${displayFee.toFixed(
          2
        )} (${WITHDRAWAL_FEE_PERCENT}%)\n` +
        `You receive: $${displayNetAmount.toFixed(2)}`
    );

    if (!confirmed) return;

    setSubmitting(true);

    /* =========================================================
       SECURE DATABASE RPC

       Database should handle:
       - authenticated user
       - wallet balance
       - account ownership
       - pending withdrawal check
       - 5% fee
       - net amount
       - withdrawal creation
       - balance deduction/locking
       ========================================================= */

    const {
      data,
      error,
    } = await supabase.rpc(
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

      setErrorMessage(
        error.message ||
          "Unable to submit withdrawal request."
      );

      setSubmitting(false);
      return;
    }

    console.log(
      "Withdrawal request created:",
      data
    );

    setAmount("");
    setSuccess(true);

    await loadWithdrawalData();

    setSubmitting(false);
  }

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b10] text-white">
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

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <main className="min-h-screen bg-[#070b10] px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">

        {/* =====================================================
            HEADER
            ===================================================== */}

        <div className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="rounded-xl border border-slate-800 bg-[#11151b] p-2.5 transition hover:border-slate-700 hover:bg-slate-800"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Withdraw
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Withdraw your available earnings.
            </p>
          </div>
        </div>

        {/* =====================================================
            ERROR
            ===================================================== */}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-red-400"
              />

              <div className="flex-1">
                <h2 className="font-semibold text-red-300">
                  Withdrawal error
                </h2>

                <p className="mt-1 text-sm leading-6 text-red-200/70">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            SUCCESS
            ===================================================== */}

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={21}
                className="mt-0.5 shrink-0 text-emerald-400"
              />

              <div>
                <h2 className="font-semibold text-emerald-300">
                  Withdrawal request submitted
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Your withdrawal request has been
                  submitted for review by the EarnNova
                  Team.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/dashboard")
                  }
                  className="mt-4 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            WALLET
            ===================================================== */}

        <div className="mb-5 rounded-3xl border border-slate-800 bg-[#11151b] p-6 shadow-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">
                Available Balance
              </p>

              <p className="mt-1 text-3xl font-black tracking-tight">
                $
                {Number(
                  profile?.wallet || 0
                ).toFixed(2)}
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
              <Wallet size={22} />
            </div>
          </div>

          {Number(profile?.pending_balance || 0) >
            0 && (
            <div className="mt-4 rounded-xl border border-amber-500/10 bg-amber-500/5 px-4 py-3">
              <p className="text-xs text-amber-300">
                Pending balance: $
                {Number(
                  profile?.pending_balance || 0
                ).toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* =====================================================
            ACCOUNT CHECK
            ===================================================== */}

        {!account ? (
          <div className="mb-5 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={21}
                className="mt-0.5 shrink-0 text-amber-400"
              />

              <div className="flex-1">
                <h2 className="font-semibold text-amber-300">
                  Withdrawal account required
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Before requesting a withdrawal,
                  add your receiving account or wallet
                  address.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/dashboard/account"
                    )
                  }
                  className="mt-4 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-400"
                >
                  Add Withdrawal Account
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6">
            <div className="flex items-start gap-3">
              <CheckCircle2
                size={21}
                className="mt-0.5 shrink-0 text-emerald-400"
              />

              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-emerald-300">
                  Withdrawal account ready
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Method:{" "}
                  <span className="font-semibold text-slate-300">
                    {account.method}
                  </span>
                </p>

                {/* USDT */}

                {account.method === "USDT" &&
                  account.wallet_address && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs text-slate-500">
                        Wallet Address
                      </p>

                      <p className="break-all rounded-xl border border-slate-800 bg-[#090d12] p-3 font-mono text-xs leading-5 text-slate-400">
                        {account.wallet_address}
                      </p>
                    </div>
                  )}

                {/* BANK / UPaisa */}

                {account.method !== "USDT" && (
                  <div className="mt-3 space-y-2">
                    {account.account_name && (
                      <p className="text-sm text-slate-400">
                        Name:{" "}
                        <span className="text-slate-300">
                          {account.account_name}
                        </span>
                      </p>
                    )}

                    {account.bank_name && (
                      <p className="text-sm text-slate-400">
                        Bank:{" "}
                        <span className="text-slate-300">
                          {account.bank_name}
                        </span>
                      </p>
                    )}

                    {account.account_number && (
                      <p className="text-sm text-slate-400">
                        Account:{" "}
                        <span className="text-slate-300">
                          {account.account_number}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      "/dashboard/account"
                    )
                  }
                  className="mt-4 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
                >
                  Edit Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            WITHDRAW FORM
            ===================================================== */}

        {account && (
          <div className="rounded-3xl border border-slate-800 bg-[#11151b] p-6 shadow-xl">
            <h2 className="text-lg font-bold">
              Withdrawal Amount
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Enter the amount you want to withdraw.
            </p>

            {/* AMOUNT */}

            <div className="mt-6">
              <label
                htmlFor="withdrawal-amount"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Amount (USD)
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  $
                </span>

                <input
                  id="withdrawal-amount"
                  type="number"
                  min={MIN_WITHDRAWAL}
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrorMessage("");
                    setSuccess(false);
                  }}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-slate-700 bg-[#090d12] py-3 pl-9 pr-4 text-white outline-none placeholder:text-slate-600 transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Minimum withdrawal: $
                {MIN_WITHDRAWAL.toFixed(2)}
              </p>
            </div>

            {/* CALCULATION */}

            <div className="mt-6 space-y-3 rounded-2xl border border-slate-800 bg-[#090d12] p-5">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">
                  Withdrawal amount
                </span>

                <span className="font-semibold text-white">
                  ${numericAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between gap-4 text-sm">
                <span className="text-slate-400">
                  Fee ({WITHDRAWAL_FEE_PERCENT}%)
                </span>

                <span className="font-semibold text-red-400">
                  -${displayFee.toFixed(2)}
                </span>
              </div>

              <div className="border-t border-slate-800 pt-3">
                <div className="flex justify-between gap-4">
                  <span className="font-semibold text-slate-300">
                    You receive
                  </span>

                  <span className="text-lg font-black text-emerald-400">
                    ${displayNetAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* FEE NOTICE */}

            <div className="mt-4 rounded-xl border border-blue-500/10 bg-blue-500/5 px-4 py-3">
              <p className="text-xs leading-5 text-slate-500">
                A {WITHDRAWAL_FEE_PERCENT}% withdrawal
                processing fee is deducted from the
                requested amount. Final fee and net
                amount are calculated securely by the
                database.
              </p>
            </div>

            {/* SUBMIT */}

            <button
              type="button"
              onClick={submitWithdrawal}
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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

        {/* =====================================================
            INFORMATION
            ===================================================== */}

        <div className="mt-5 rounded-2xl border border-slate-800 bg-[#11151b] p-5">
          <h3 className="font-semibold text-slate-300">
            Withdrawal Information
          </h3>

          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
            <li>
              • Minimum withdrawal is $1.
            </li>

            <li>
              • Withdrawal fee is 5%.
            </li>

            <li>
              • Requests are reviewed by the EarnNova
              Team.
            </li>

            <li>
              • Make sure your withdrawal account
              details are correct.
            </li>

            <li>
              • Withdrawal processing may take
              1–5 business days.
            </li>
          </ul>
        </div>

      </div>
    </main>
  );
}