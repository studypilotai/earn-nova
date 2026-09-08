"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  CheckCircle,
  DollarSign,
  Loader2,
  UserPlus,
  Wallet,
  XCircle,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AddBalancePage() {
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleAddBalance = async () => {
    setMessage("");
    setError("");

    const cleanEmail = email.trim();
    const numericAmount = Number(amount);

    if (!cleanEmail) {
      setError("Please enter the user's email.");
      return;
    }

    if (!cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!amount || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount greater than $0.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "admin_add_balance",
        {
          p_email: cleanEmail,
          p_amount: numericAmount,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      if (!data?.success) {
        throw new Error(
          data?.message || "Unable to add balance."
        );
      }

      setMessage(
        `$${Number(data.amount_added).toFixed(2)} added successfully. New wallet balance: $${Number(
          data.new_wallet
        ).toFixed(2)}`
      );

      setEmail("");
      setAmount("");
    } catch (err: any) {
      setError(
        err?.message ||
          "Something went wrong while adding balance."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900">

      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">

          <div className="flex items-center gap-4">

            <a
              href="/admin"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
            >
              <ArrowLeft size={19} />
            </a>

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
            Admin Wallet Control
          </div>

        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-4xl px-5 py-10 lg:px-8">

        {/* MAIN CARD */}

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
                  Enter the user's registered email and the amount
                  you want to add to their wallet.
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  disabled={loading}
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
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10.00"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  disabled={loading}
                />

              </div>

            </div>

            {/* QUICK AMOUNTS */}

            <div className="mt-4">

              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                Quick Amount
              </p>

              <div className="flex flex-wrap gap-2">

                {[5, 10, 25, 50, 100].map((value) => (

                  <button
                    key={value}
                    type="button"
                    onClick={() => setAmount(String(value))}
                    disabled={loading}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ${value}
                  </button>

                ))}

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
              onClick={handleAddBalance}
              disabled={loading}
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

        {/* WARNING / INFO */}

        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">

          <div className="flex gap-3">

            <div className="mt-0.5 text-amber-600">
              <DollarSign size={20} />
            </div>

            <div>

              <h3 className="font-black text-amber-800">
                Admin Balance Control
              </h3>

              <p className="mt-1 text-sm leading-6 text-amber-700">
                This action directly increases the user's wallet
                balance. Make sure the email and amount are correct
                before clicking Add Balance.
              </p>

            </div>

          </div>
        </div>

        {/* BACK BUTTON */}

        <div className="mt-6">

          <a
            href="/admin"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft size={17} />
            Back to Admin
          </a>

        </div>

      </div>
    </main>
  );
}