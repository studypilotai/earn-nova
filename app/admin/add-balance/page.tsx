"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Loader2,
  UserPlus,
  Wallet,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const MAX_ADD_BALANCE = 1_000_000;

type RpcResult = {
  success?: boolean;
  message?: string;
  amount_added?: number | string;
  new_wallet?: number | string;
};

function getRpcResult(data: unknown): RpcResult | null {
  if (Array.isArray(data)) {
    const first = data[0];

    if (
      first &&
      typeof first === "object"
    ) {
      return first as RpcResult;
    }

    return null;
  }

  if (
    data &&
    typeof data === "object"
  ) {
    return data as RpcResult;
  }

  return null;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

export default function AddBalancePage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingAdmin, setCheckingAdmin] =
    useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* =========================================================
     ADMIN CHECK
  ========================================================= */

  const checkAdmin = useCallback(
    async () => {
      try {
        setCheckingAdmin(true);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/admin/login");
          return false;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            "ADMIN PROFILE ERROR:",
            profileError
          );

          setError(
            profileError.message ||
              "Unable to verify admin account."
          );

          return false;
        }

        if (
          !profile ||
          profile.role !== "admin"
        ) {
          await supabase.auth.signOut();
          router.replace("/admin/login");
          return false;
        }

        return true;
      } catch (err) {
        console.error(
          "ADMIN CHECK ERROR:",
          err
        );

        setError(
          "Unable to verify admin access."
        );

        return false;
      } finally {
        setCheckingAdmin(false);
      }
    },
    [router]
  );

  useEffect(() => {
    void checkAdmin();
  }, [checkAdmin]);

  /* =========================================================
     ADD BALANCE
  ========================================================= */

  async function handleAddBalance() {
    if (loading || checkingAdmin) {
      return;
    }

    setMessage("");
    setError("");

    const cleanEmail = email
      .trim()
      .toLowerCase();

    const rawAmount = amount.trim();

    const numericAmount = Number(
      rawAmount
    );

    /* =======================================================
       VALIDATION
    ======================================================= */

    if (!cleanEmail) {
      setError(
        "Please enter the user's email."
      );
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    if (!rawAmount) {
      setError(
        "Please enter an amount."
      );
      return;
    }

    if (
      !Number.isFinite(numericAmount)
    ) {
      setError(
        "Please enter a valid amount."
      );
      return;
    }

    if (
      numericAmount <= 0
    ) {
      setError(
        "Amount must be greater than $0."
      );
      return;
    }

    if (
      numericAmount > MAX_ADD_BALANCE
    ) {
      setError(
        "Amount is too large."
      );
      return;
    }

    if (
      !Number.isInteger(
        Math.round(
          numericAmount * 100
        )
      )
    ) {
      setError(
        "Invalid amount."
      );
      return;
    }

    /*
     * Keep wallet amounts at maximum
     * two decimal places.
     */
    const roundedAmount =
      Math.round(
        numericAmount * 100
      ) / 100;

    if (
      roundedAmount <= 0 ||
      !Number.isFinite(
        roundedAmount
      )
    ) {
      setError(
        "Invalid amount."
      );
      return;
    }

    /* =======================================================
       ENSURE ADMIN
    ======================================================= */

    const isAdmin =
      await checkAdmin();

    if (!isAdmin) {
      return;
    }

    /* =======================================================
       CONFIRMATION
    ======================================================= */

    const confirmed =
      window.confirm(
        `Confirm balance addition?\n\n` +
          `User: ${cleanEmail}\n` +
          `Amount: $${roundedAmount.toFixed(
            2
          )}\n\n` +
          `This will directly increase the user's wallet balance.`
      );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      /* =====================================================
         SECURE ADMIN RPC

         Database function is responsible for:
         - authentication
         - admin authorization
         - customer lookup
         - customer role verification
         - wallet locking
         - wallet update
         - transaction safety
         - amount validation
      ===================================================== */

      const {
        data,
        error: rpcError,
      } = await supabase.rpc(
        "admin_add_balance",
        {
          p_email: cleanEmail,
          p_amount: roundedAmount,
        }
      );

      if (rpcError) {
        console.error(
          "ADMIN ADD BALANCE RPC ERROR:",
          rpcError
        );

        throw new Error(
          rpcError.message ||
            "Unable to add balance."
        );
      }

      const result =
        getRpcResult(data);

      if (!result) {
        throw new Error(
          "No valid response was returned from the balance function."
        );
      }

      if (
        result.success !== true
      ) {
        throw new Error(
          result.message ||
            "Unable to add balance."
        );
      }

      const amountAdded =
        Number(
          result.amount_added
        );

      const newWallet =
        Number(
          result.new_wallet
        );

      if (
        !Number.isFinite(
          amountAdded
        ) ||
        amountAdded <= 0
      ) {
        throw new Error(
          "Invalid amount returned by the server."
        );
      }

      if (
        !Number.isFinite(
          newWallet
        ) ||
        newWallet < 0
      ) {
        throw new Error(
          "Invalid wallet balance returned by the server."
        );
      }

      /* =====================================================
         SUCCESS
      ===================================================== */

      setMessage(
        `$${amountAdded.toFixed(
          2
        )} added successfully. New wallet balance: $${newWallet.toFixed(
          2
        )}.`
      );

      setEmail("");
      setAmount("");
    } catch (err: unknown) {
      console.error(
        "ADD BALANCE ERROR:",
        err
      );

      if (
        err instanceof Error
      ) {
        setError(
          err.message ||
            "Something went wrong while adding balance."
        );
      } else {
        setError(
          "Something went wrong while adding balance."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (checkingAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc] text-slate-900">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <Loader2
            size={20}
            className="animate-spin text-blue-600"
          />

          Checking admin access...
        </div>
      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                router.push("/admin")
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              aria-label="Back to admin dashboard"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <h1 className="text-xl font-black text-slate-900">
                Add Balance
              </h1>

              <p className="text-sm text-slate-500">
                Add funds directly to a user's wallet
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 sm:flex">
            <Wallet size={17} />
            Wallet Control
          </div>
        </div>
      </header>

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div className="mx-auto max-w-4xl px-5 py-10 lg:px-8">
        {/* ===================================================
            MAIN CARD
        =================================================== */}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          {/* CARD HEADER */}

          <div className="border-b border-slate-200 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <UserPlus size={22} />
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Add User Balance
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Enter the user's registered email
                  and the USD amount you want to add
                  to their wallet.
                </p>
              </div>
            </div>
          </div>

          {/* FORM */}

          <div className="p-6 sm:p-8">
            {/* EMAIL */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                User Email
              </label>

              <div className="relative">
                <UserPlus
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={(event) => {
                    setEmail(
                      event.target.value
                    );
                    setError("");
                    setMessage("");
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      void handleAddBalance();
                    }
                  }}
                  placeholder="user@example.com"
                  disabled={loading}
                  maxLength={254}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>
            </div>

            {/* AMOUNT */}

            <div className="mt-5">
              <label
                htmlFor="amount"
                className="mb-2 block text-sm font-bold text-slate-700"
              >
                Amount (USD)
              </label>

              <div className="relative">
                <DollarSign
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="amount"
                  type="number"
                  min="0.01"
                  max={MAX_ADD_BALANCE}
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => {
                    setAmount(
                      event.target.value
                    );
                    setError("");
                    setMessage("");
                  }}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      void handleAddBalance();
                    }
                  }}
                  placeholder="10.00"
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:bg-slate-50"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Balance is maintained and displayed
                in USD. Maximum manual addition:
                $1,000,000.
              </p>
            </div>

            {/* QUICK AMOUNTS */}

            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Quick Amount
              </p>

              <div className="flex flex-wrap gap-2">
                {[5, 10, 25, 50, 100].map(
                  (value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => {
                        setAmount(
                          String(value)
                        );
                        setError("");
                        setMessage("");
                      }}
                      disabled={loading}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ${value}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* SUCCESS */}

            {message && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <div>
                  <p className="font-bold text-emerald-700">
                    Balance Added
                  </p>

                  <p className="mt-1 text-sm leading-6 text-emerald-600">
                    {message}
                  </p>
                </div>
              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                <XCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <div>
                  <p className="font-bold text-red-700">
                    Unable to Add Balance
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-600">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* ADD BUTTON */}

            <button
              type="button"
              onClick={() =>
                void handleAddBalance()
              }
              disabled={
                loading || checkingAdmin
              }
              className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />

                  Adding Balance...
                </>
              ) : (
                <>
                  <Wallet size={19} />

                  Add Balance
                </>
              )}
            </button>
          </div>
        </div>

        {/* =====================================================
            WARNING / INFO
        ====================================================== */}

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <div className="mt-0.5 text-amber-600">
              <DollarSign size={20} />
            </div>

            <div>
              <h3 className="font-black text-amber-800">
                Wallet Balance Control
              </h3>

              <p className="mt-1 text-sm leading-6 text-amber-700">
                This action directly increases the
                user's wallet balance. Verify the
                email and amount before confirming.
                Every balance addition is processed
                through the secure admin database
                function.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            BACK
        ====================================================== */}

        <div className="mt-6">
          <button
            type="button"
            onClick={() =>
              router.push("/admin")
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Back to Admin
          </button>
        </div>
      </div>
    </main>
  );
}