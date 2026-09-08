"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Save,
  Wallet,
  CheckCircle,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type WithdrawalAccount = {
  id: string;
  method: string;
  account_name: string | null;
  account_number: string | null;
  wallet_address: string | null;
};

export default function AccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [method, setMethod] = useState("USDT");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const [savedAccount, setSavedAccount] =
    useState<WithdrawalAccount | null>(null);

  useEffect(() => {
    loadAccount();
  }, []);

  async function loadAccount() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("withdrawal_accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error);
    }

    if (data) {
      setSavedAccount(data);
      setMethod(data.method || "USDT");
      setAccountName(data.account_name || "");
      setAccountNumber(data.account_number || "");
      setWalletAddress(data.wallet_address || "");
    }

    setLoading(false);
  }

  async function saveAccount() {
    if (saving) return;

    if (!method) {
      alert("Please select withdrawal method.");
      return;
    }

    if (method === "USDT") {
      if (!walletAddress.trim()) {
        alert("Please enter your USDT wallet address.");
        return;
      }
    }

    if (method !== "USDT") {
      if (!accountName.trim()) {
        alert("Please enter account name.");
        return;
      }

      if (!accountNumber.trim()) {
        alert("Please enter account number.");
        return;
      }
    }

    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (savedAccount) {
      const { data, error } = await supabase
        .from("withdrawal_accounts")
        .update({
          method,
          account_name:
            method === "USDT"
              ? null
              : accountName.trim(),
          account_number:
            method === "USDT"
              ? null
              : accountNumber.trim(),
          wallet_address:
            method === "USDT"
              ? walletAddress.trim()
              : null,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", savedAccount.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error(error);
        alert(error.message);
        setSaving(false);
        return;
      }

      setSavedAccount(data);
      alert("Withdrawal account updated successfully.");
    } else {
      const { data, error } = await supabase
        .from("withdrawal_accounts")
        .insert({
          user_id: user.id,
          method,
          account_name:
            method === "USDT"
              ? null
              : accountName.trim(),
          account_number:
            method === "USDT"
              ? null
              : accountNumber.trim(),
          wallet_address:
            method === "USDT"
              ? walletAddress.trim()
              : null,
        })
        .select()
        .single();

      if (error) {
        console.error(error);
        alert(error.message);
        setSaving(false);
        return;
      }

      setSavedAccount(data);
      alert("Withdrawal account saved successfully.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading Account...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">
        {/* HEADER */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-xl border border-slate-700 p-2.5 transition hover:bg-slate-800"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold">
              Withdrawal Account
            </h1>

            <p className="text-sm text-slate-400">
              Add the account where you want to receive
              your earnings.
            </p>
          </div>
        </div>

        {/* STATUS */}
        {savedAccount && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/10 p-4">
            <CheckCircle className="text-green-400" />

            <div>
              <p className="font-semibold text-green-300">
                Withdrawal account saved
              </p>

              <p className="text-sm text-slate-400">
                You can now request a withdrawal.
              </p>
            </div>
          </div>
        )}

        {/* FORM */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
              <Wallet size={22} />
            </div>

            <div>
              <h2 className="font-bold">
                Payment Details
              </h2>

              <p className="text-sm text-slate-400">
                Enter your withdrawal receiving details.
              </p>
            </div>
          </div>

          {/* METHOD */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Withdrawal Method
            </label>

            <select
              value={method}
              onChange={(e) =>
                setMethod(e.target.value)
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
            >
              <option value="USDT">
                USDT
              </option>

              <option value="Bank">
                Bank Account
              </option>

              <option value="UPaisa">
                UPaisa
              </option>
            </select>
          </div>

          {/* USDT */}
          {method === "USDT" && (
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                USDT Wallet Address
              </label>

              <textarea
                value={walletAddress}
                onChange={(e) =>
                  setWalletAddress(e.target.value)
                }
                placeholder="Enter your USDT wallet address"
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
              />

              <p className="mt-2 text-xs text-slate-500">
                Make sure the wallet address is correct
                before saving.
              </p>
            </div>
          )}

          {/* ACCOUNT NAME */}
          {method !== "USDT" && (
            <>
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Account Name
                </label>

                <input
                  type="text"
                  value={accountName}
                  onChange={(e) =>
                    setAccountName(e.target.value)
                  }
                  placeholder="Enter account holder name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* ACCOUNT NUMBER */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Account Number
                </label>

                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) =>
                    setAccountNumber(e.target.value)
                  }
                  placeholder="Enter account number"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>
            </>
          )}

          {/* SAVE */}
          <button
            onClick={saveAccount}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={18} />

            {saving
              ? "Saving..."
              : savedAccount
              ? "Update Account"
              : "Save Account"}
          </button>
        </div>

        {/* FEE INFO */}
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-sm font-semibold text-slate-300">
            Withdrawal Fee
          </p>

          <p className="mt-1 text-sm text-slate-500">
            EarnNova charges a 10% withdrawal fee.
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Example: $10 withdrawal → $1 fee →
            <span className="font-semibold text-green-400">
              {" "}
              $9 received
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}