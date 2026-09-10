"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Save,
  Wallet,
  CheckCircle,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type WithdrawalAccount = {
  id: string;
  user_id: string;
  method: string;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
  wallet_address: string | null;
  created_at?: string;
  updated_at?: string;
};

export default function AccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [method, setMethod] = useState("USDT");

  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const [savedAccount, setSavedAccount] =
    useState<WithdrawalAccount | null>(null);

  useEffect(() => {
    loadAccount();
  }, []);

  /* =========================================================
     LOAD WITHDRAWAL ACCOUNT
     ========================================================= */

  async function loadAccount() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error(authError);
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("withdrawal_accounts")
        .select(
          `
          id,
          user_id,
          method,
          account_name,
          account_number,
          bank_name,
          wallet_address,
          created_at,
          updated_at
        `
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Withdrawal account load error:", error);
        setLoading(false);
        return;
      }

      if (data) {
        setSavedAccount(data);

        setMethod(data.method || "USDT");
        setBankName(data.bank_name || "");
        setAccountName(data.account_name || "");
        setAccountNumber(data.account_number || "");
        setWalletAddress(data.wallet_address || "");
      }
    } catch (error) {
      console.error("Unexpected load error:", error);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     CHANGE METHOD
     ========================================================= */

  function handleMethodChange(newMethod: string) {
    setMethod(newMethod);

    if (newMethod === "USDT") {
      setBankName("");
      setAccountName("");
      setAccountNumber("");
    }

    if (newMethod === "Bank") {
      setWalletAddress("");
    }

    if (newMethod === "UPaisa") {
      setBankName("");
      setWalletAddress("");
    }
  }

  /* =========================================================
     SAVE / UPDATE ACCOUNT
     ========================================================= */

  async function saveAccount() {
    if (saving) return;

    /* ===============================
       BASIC METHOD VALIDATION
       =============================== */

    if (!method) {
      alert("Please select a withdrawal method.");
      return;
    }

    /* ===============================
       USDT VALIDATION
       =============================== */

    if (method === "USDT") {
      if (!walletAddress.trim()) {
        alert("Please enter your USDT wallet address.");
        return;
      }

      if (walletAddress.trim().length < 20) {
        alert("Please enter a valid USDT wallet address.");
        return;
      }
    }

    /* ===============================
       BANK VALIDATION
       =============================== */

    if (method === "Bank") {
      if (!bankName.trim()) {
        alert("Please enter bank name.");
        return;
      }

      if (!accountName.trim()) {
        alert("Please enter account holder name.");
        return;
      }

      if (!accountNumber.trim()) {
        alert("Please enter account number or IBAN.");
        return;
      }
    }

    /* ===============================
       UPAISA VALIDATION
       =============================== */

    if (method === "UPaisa") {
      if (!accountName.trim()) {
        alert("Please enter account holder name.");
        return;
      }

      if (!accountNumber.trim()) {
        alert("Please enter your UPaisa account number.");
        return;
      }
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error(authError);
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      /* ===============================
         ACCOUNT DATA
         =============================== */

      const accountData = {
        method,

        bank_name:
          method === "Bank"
            ? bankName.trim()
            : null,

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

        updated_at: new Date().toISOString(),
      };

      /* ===============================
         UPDATE EXISTING ACCOUNT
         =============================== */

      if (savedAccount) {
        const { data, error } = await supabase
          .from("withdrawal_accounts")
          .update(accountData)
          .eq("id", savedAccount.id)
          .eq("user_id", user.id)
          .select(
            `
            id,
            user_id,
            method,
            account_name,
            account_number,
            bank_name,
            wallet_address,
            created_at,
            updated_at
          `
          )
          .single();

        if (error) {
          console.error("Account update error:", error);
          alert(error.message);
          return;
        }

        setSavedAccount(data);

        alert("Withdrawal account updated successfully.");
        return;
      }

      /* ===============================
         CREATE NEW ACCOUNT
         =============================== */

      const { data, error } = await supabase
        .from("withdrawal_accounts")
        .insert({
          user_id: user.id,
          ...accountData,
        })
        .select(
          `
          id,
          user_id,
          method,
          account_name,
          account_number,
          bank_name,
          wallet_address,
          created_at,
          updated_at
        `
        )
        .single();

      if (error) {
        console.error("Account insert error:", error);
        alert(error.message);
        return;
      }

      setSavedAccount(data);

      alert("Withdrawal account saved successfully.");
    } catch (error) {
      console.error("Unexpected save error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     LOADING SCREEN
     ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b10] text-white">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
          Loading account...
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN PAGE
     ========================================================= */

  return (
    <main className="min-h-screen bg-[#070b10] px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="mx-auto max-w-2xl">

        {/* =====================================================
            HEADER
            ===================================================== */}

        <div className="mb-7 flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-300 transition hover:border-slate-700 hover:bg-[#161b22] hover:text-white"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Withdrawal Account
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Add the account where you want to receive your earnings.
            </p>
          </div>
        </div>

        {/* =====================================================
            SAVED STATUS
            ===================================================== */}

        {savedAccount && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle className="h-5 w-5 text-emerald-400" />
            </div>

            <div>
              <p className="font-semibold text-emerald-300">
                Withdrawal account saved
              </p>

              <p className="mt-1 text-sm leading-5 text-slate-400">
                Your withdrawal receiving details are ready. You can
                update them anytime.
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            FORM CARD
            ===================================================== */}

        <div className="rounded-3xl border border-slate-800 bg-[#11151b] p-5 shadow-2xl sm:p-6">

          {/* CARD HEADER */}

          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/10 bg-blue-600/10 text-blue-400">
              <Wallet size={22} />
            </div>

            <div>
              <h2 className="font-bold text-white">
                Payment Details
              </h2>

              <p className="mt-0.5 text-sm text-slate-500">
                Enter your withdrawal receiving details.
              </p>
            </div>
          </div>

          {/* ===================================================
              METHOD
              =================================================== */}

          <div className="mb-6">
            <label
              htmlFor="withdrawal-method"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Withdrawal Method
            </label>

            <select
              id="withdrawal-method"
              value={method}
              onChange={(e) =>
                handleMethodChange(e.target.value)
              }
              className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3.5 text-sm text-white outline-none transition focus:border-blue-500"
            >
              <option value="USDT">USDT</option>
              <option value="Bank">Bank Account</option>
              <option value="UPaisa">UPaisa</option>
            </select>
          </div>

          {/* ===================================================
              USDT
              =================================================== */}

          {method === "USDT" && (
            <div className="space-y-5">

              <div>
                <label
                  htmlFor="wallet-address"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  USDT Wallet Address
                </label>

                <textarea
                  id="wallet-address"
                  value={walletAddress}
                  onChange={(e) =>
                    setWalletAddress(e.target.value)
                  }
                  placeholder="Enter your USDT wallet address"
                  rows={4}
                  spellCheck={false}
                  className="w-full resize-none rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Make sure your wallet address and supported USDT
                  network are correct before saving.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />

                <p className="text-xs leading-5 text-slate-400">
                  Incorrect wallet details may cause your withdrawal
                  to fail or become unrecoverable. Always verify the
                  address before submitting a withdrawal.
                </p>
              </div>
            </div>
          )}

          {/* ===================================================
              BANK ACCOUNT
              =================================================== */}

          {method === "Bank" && (
            <div className="space-y-5">

              {/* BANK NAME */}

              <div>
                <label
                  htmlFor="bank-name"
                  className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300"
                >
                  <Building2 size={15} />
                  Bank Name
                </label>

                <input
                  id="bank-name"
                  type="text"
                  value={bankName}
                  onChange={(e) =>
                    setBankName(e.target.value)
                  }
                  placeholder="Enter bank name"
                  autoComplete="organization"
                  className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* ACCOUNT NAME */}

              <div>
                <label
                  htmlFor="account-name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Account Name
                </label>

                <input
                  id="account-name"
                  type="text"
                  value={accountName}
                  onChange={(e) =>
                    setAccountName(e.target.value)
                  }
                  placeholder="Enter account holder name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* ACCOUNT NUMBER */}

              <div>
                <label
                  htmlFor="account-number"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Account Number / IBAN
                </label>

                <input
                  id="account-number"
                  type="text"
                  value={accountNumber}
                  onChange={(e) =>
                    setAccountNumber(e.target.value)
                  }
                  placeholder="Enter account number or IBAN"
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

            </div>
          )}

          {/* ===================================================
              UPAISA
              =================================================== */}

          {method === "UPaisa" && (
            <div className="space-y-5">

              {/* ACCOUNT NAME */}

              <div>
                <label
                  htmlFor="upaisa-account-name"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Account Name
                </label>

                <input
                  id="upaisa-account-name"
                  type="text"
                  value={accountName}
                  onChange={(e) =>
                    setAccountName(e.target.value)
                  }
                  placeholder="Enter account holder name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* ACCOUNT NUMBER */}

              <div>
                <label
                  htmlFor="upaisa-account-number"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  UPaisa Account Number
                </label>

                <input
                  id="upaisa-account-number"
                  type="text"
                  inputMode="numeric"
                  value={accountNumber}
                  onChange={(e) =>
                    setAccountNumber(e.target.value)
                  }
                  placeholder="Enter UPaisa number"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

            </div>
          )}

          {/* ===================================================
              SAVE BUTTON
              =================================================== */}

          <button
            type="button"
            onClick={saveAccount}
            disabled={saving}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                {savedAccount
                  ? "Update Account"
                  : "Save Account"}
              </>
            )}
          </button>
        </div>

        {/* =====================================================
            SECURITY / FEE INFO
            ===================================================== */}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">

          {/* SECURITY */}

          <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
              <ShieldCheck size={19} />
            </div>

            <p className="text-sm font-semibold text-slate-200">
              Account Security
            </p>

            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Only use a withdrawal account that belongs to you.
              Check your details carefully before saving.
            </p>
          </div>

          {/* FEE */}

          <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Wallet size={19} />
            </div>

            <p className="text-sm font-semibold text-slate-200">
              Withdrawal Fee
            </p>

            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              EarnNova charges a 5% withdrawal fee.
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Example: $10 withdrawal → $0.50 fee →{" "}
              <span className="font-semibold text-emerald-400">
                $9.50 received
              </span>
            </p>
          </div>
        </div>

        {/* =====================================================
            FOOTER NOTE
            ===================================================== */}

        <p className="mt-6 text-center text-xs leading-5 text-slate-600">
          Withdrawal requests are reviewed by the EarnNova Team
          before processing.
        </p>
      </div>
    </main>
  );
}