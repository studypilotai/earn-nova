"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  CheckCircle,
  CircleDollarSign,
  Copy,
  CreditCard,
  ShieldCheck,
  Wallet,
  AlertTriangle,
  Loader2,
} from "lucide-react";

const supabase = createClient();

type PaymentMethod = "USDT" | "Bank Transfer";

/* =========================================================
   PAYMENT DETAILS
========================================================= */

const USDT_ADDRESS = "TAWgQk5vdz964jxps2nYjTAj6c8WRpp4hb";

const BANK_NAME = "JazzCash";
const ACCOUNT_TITLE = "MUHAMMAD ABDULLAH";
const ACCOUNT_NUMBER = "PK38JCMA2710923339830897";

const USD_TO_PKR = 288;

export default function DepositPage() {
  const router = useRouter();

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [amount, setAmount] = useState("");
  const [method, setMethod] =
    useState<PaymentMethod>("USDT");

  const [senderName, setSenderName] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [note, setNote] = useState("");

  /* =======================================================
     PAGE STATE
  ======================================================= */

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [profileName, setProfileName] = useState("");
  const [wallet, setWallet] = useState(0);

  const [copied, setCopied] = useState(false);
  const [accountCopied, setAccountCopied] =
    useState(false);

  /* =======================================================
     LOAD PROFILE
  ======================================================= */

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("AUTH ERROR:", authError);
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, wallet")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("PROFILE ERROR:", error);
        return;
      }

      setProfileName(data?.full_name || "Member");
      setWallet(Number(data?.wallet || 0));
    } catch (error) {
      console.error("LOAD PROFILE ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     COPY USDT ADDRESS
  ======================================================= */

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(
        USDT_ADDRESS
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("COPY ADDRESS ERROR:", error);
      alert("Unable to copy wallet address.");
    }
  }

  /* =======================================================
     COPY JAZZCASH IBAN
  ======================================================= */

  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(
        ACCOUNT_NUMBER
      );

      setAccountCopied(true);

      window.setTimeout(() => {
        setAccountCopied(false);
      }, 2000);
    } catch (error) {
      console.error("COPY ACCOUNT ERROR:", error);
      alert("Unable to copy account details.");
    }
  }

  /* =======================================================
     SUBMIT DEPOSIT
  ======================================================= */

  async function continueDeposit() {
    if (submitting) return;

    const numericAmount = Number(amount);

    /* =====================================================
       VALIDATE AMOUNT
    ===================================================== */

    if (
      !amount.trim() ||
      !Number.isFinite(numericAmount)
    ) {
      alert("Please enter a valid deposit amount.");
      return;
    }

    if (numericAmount < 1) {
      alert("Minimum deposit is $1.");
      return;
    }

    if (numericAmount > 1000000) {
      alert("Please enter a valid deposit amount.");
      return;
    }

    /* =====================================================
       VALIDATE SENDER NAME
    ===================================================== */

    if (!senderName.trim()) {
      alert("Please enter sender name.");
      return;
    }

    /* =====================================================
       VALIDATE SENDER ACCOUNT
    ===================================================== */

    if (!senderNumber.trim()) {
      alert(
        method === "USDT"
          ? "Please enter sender wallet or exchange account."
          : "Please enter sender account or number."
      );
      return;
    }

    /* =====================================================
       VALIDATE TRANSACTION ID
    ===================================================== */

    if (!trxId.trim()) {
      alert("Please enter transaction ID / hash.");
      return;
    }

    try {
      setSubmitting(true);

      /* ===================================================
         AUTH
      =================================================== */

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("AUTH ERROR:", authError);
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      /* ===================================================
         CHECK EXISTING PENDING DEPOSIT
      =================================================== */

      const {
        data: existingRequests,
        error: existingError,
      } = await supabase
        .from("deposits")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .limit(1);

      if (existingError) {
        console.error(
          "PENDING DEPOSIT CHECK ERROR:",
          existingError
        );

        alert(
          "Unable to check existing deposit requests."
        );
        return;
      }

      if (
        existingRequests &&
        existingRequests.length > 0
      ) {
        alert(
          "You already have a pending deposit request. Please wait for EarnNova Team to review it."
        );
        return;
      }

      /* ===================================================
         DATABASE METHOD
         
         IMPORTANT:
         Existing deposits table uses:
         "Bank Transfer"
         
         UI displays this as JazzCash.
      =================================================== */

      const databaseMethod: PaymentMethod =
        method === "USDT"
          ? "USDT"
          : "Bank Transfer";

      /* ===================================================
         INSERT DEPOSIT
      =================================================== */

      const { error: insertError } = await supabase
        .from("deposits")
        .insert({
          user_id: user.id,
          amount: numericAmount,
          method: databaseMethod,
          transaction_id: trxId.trim(),
          payment_proof: null,
          status: "pending",
          admin_note: note.trim() || null,
        });

      if (insertError) {
        console.error(
          "DEPOSIT INSERT ERROR:",
          insertError
        );

        alert(
          insertError.message ||
            "Unable to submit deposit request."
        );

        return;
      }

      /* ===================================================
         SUCCESS
      =================================================== */

      setSubmitted(true);

      setAmount("");
      setSenderName("");
      setSenderNumber("");
      setTrxId("");
      setNote("");
    } catch (error) {
      console.error(
        "SUBMIT DEPOSIT ERROR:",
        error
      );

      alert(
        "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     DISPLAY METHOD
  ======================================================= */

  const displayMethod =
    method === "Bank Transfer"
      ? "JazzCash"
      : "USDT TRC20";

  /* =======================================================
     PKR CALCULATION
  ======================================================= */

  const numericAmount = Number(amount || 0);

  const pkrAmount =
    Number.isFinite(numericAmount)
      ? numericAmount * USD_TO_PKR
      : 0;

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            Loading...
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     SUCCESS SCREEN
  ======================================================= */

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
        <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle className="h-10 w-10 text-emerald-400" />
            </div>

            <h1 className="text-2xl font-bold">
              Deposit Submitted
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Your deposit request has been submitted
              successfully. EarnNova Team will review
              your payment and update your account.
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5 text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-sm text-slate-400">
                  Payment Method
                </span>

                <span className="font-semibold text-white">
                  {displayMethod}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/10 py-3">
                <span className="text-sm text-slate-400">
                  Status
                </span>

                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  Pending
                </span>
              </div>

              <div className="flex items-center justify-between pt-3">
                <span className="text-sm text-slate-400">
                  Review
                </span>

                <span className="text-sm font-medium text-slate-200">
                  EarnNova Team
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push("/dashboard")
              }
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/10 transition hover:opacity-90"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>

          <div className="text-right">
            <p className="text-xs text-slate-500">
              Welcome
            </p>

            <p className="max-w-[180px] truncate text-sm font-semibold text-white">
              {profileName}
            </p>
          </div>
        </div>

        {/* =================================================
            TITLE
        ================================================= */}

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10">
              <Wallet className="h-6 w-6 text-cyan-400" />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Deposit Funds
              </h1>

              <p className="text-sm text-slate-400">
                Add funds to your EarnNova wallet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Payments are reviewed by EarnNova Team.
          </div>
        </div>

        {/* =================================================
            WALLET
        ================================================= */}

        <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Current Wallet
              </p>

              <p className="mt-1 text-2xl font-bold text-white">
                ${wallet.toFixed(2)}
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10">
              <CircleDollarSign className="h-6 w-6 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* =================================================
            PAYMENT METHOD
        ================================================= */}

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <h2 className="text-lg font-bold">
              Payment Method
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Select your preferred payment method.
            </p>

            <div className="mt-5 grid gap-3">
              {/* USDT */}

              <button
                type="button"
                onClick={() =>
                  setMethod("USDT")
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  method === "USDT"
                    ? "border-cyan-400/50 bg-cyan-400/10"
                    : "border-white/10 bg-slate-900/40 hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10">
                      <Wallet className="h-5 w-5 text-emerald-400" />
                    </div>

                    <div>
                      <p className="font-semibold">
                        USDT TRC20
                      </p>

                      <p className="text-xs text-slate-500">
                        Available internationally
                      </p>
                    </div>
                  </div>

                  {method === "USDT" && (
                    <CheckCircle className="h-5 w-5 text-cyan-400" />
                  )}
                </div>
              </button>

              {/* JAZZCASH */}

              <button
                type="button"
                onClick={() =>
                  setMethod("Bank Transfer")
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  method === "Bank Transfer"
                    ? "border-cyan-400/50 bg-cyan-400/10"
                    : "border-white/10 bg-slate-900/40 hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-400/10">
                      <CreditCard className="h-5 w-5 text-blue-400" />
                    </div>

                    <div>
                      <p className="font-semibold">
                        JazzCash
                      </p>

                      <p className="text-xs text-slate-500">
                        Pakistan only
                      </p>
                    </div>
                  </div>

                  {method === "Bank Transfer" && (
                    <CheckCircle className="h-5 w-5 text-cyan-400" />
                  )}
                </div>
              </button>
            </div>

            {/* =================================================
                PAYMENT DETAILS
            ================================================= */}

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-5">

              {method === "USDT" ? (
                <>
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      USDT TRC20 Wallet
                    </p>

                    <p className="mt-1 text-xs text-slate-300">
                      Send only USDT using the TRON
                      network.
                    </p>
                  </div>

                  <div className="break-all rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-cyan-300">
                    {USDT_ADDRESS}
                  </div>

                  <button
                    type="button"
                    onClick={copyAddress}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy Wallet Address
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      JazzCash Account
                    </p>

                    <p className="mt-1 text-xs text-slate-300">
                      Pakistan payment account
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-500">
                        Account
                      </p>

                      <p className="mt-1 font-semibold text-white">
                        {BANK_NAME}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Account Title
                      </p>

                      <p className="mt-1 font-semibold text-white">
                        {ACCOUNT_TITLE}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        IBAN
                      </p>

                      <p className="mt-1 break-all font-semibold text-cyan-300">
                        {ACCOUNT_NUMBER}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={copyAccount}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15"
                  >
                    {accountCopied ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy IBAN
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* =================================================
                RATE
            ================================================= */}

            <div className="mt-4 rounded-2xl border border-amber-400/10 bg-amber-400/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />

                <div>
                  <p className="text-sm font-semibold text-amber-300">
                    Reference Rate
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    $1 USD = PKR {USD_TO_PKR}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              DEPOSIT FORM
          ================================================= */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
            <h2 className="text-lg font-bold">
              Deposit Details
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Enter your payment information below.
            </p>

            {/* AMOUNT */}

            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Deposit Amount (USD)
              </label>

              <div className="relative">
                <CircleDollarSign className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />

                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value)
                  }
                  placeholder="Enter amount"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/70 py-3.5 pl-12 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
                />
              </div>

              {numericAmount > 0 && (
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Approximate PKR
                  </span>

                  <span className="font-semibold text-cyan-300">
                    PKR{" "}
                    {pkrAmount.toLocaleString(
                      "en-PK"
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* SENDER NAME */}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Sender Name
              </label>

              <input
                type="text"
                value={senderName}
                onChange={(e) =>
                  setSenderName(e.target.value)
                }
                placeholder="Name used for payment"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
              />
            </div>

            {/* SENDER ACCOUNT */}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                {method === "USDT"
                  ? "Sender Wallet / Exchange"
                  : "Sender Account / Number"}
              </label>

              <input
                type="text"
                value={senderNumber}
                onChange={(e) =>
                  setSenderNumber(e.target.value)
                }
                placeholder={
                  method === "USDT"
                    ? "Sender wallet or exchange account"
                    : "Sender JazzCash account / number"
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
              />
            </div>

            {/* TRANSACTION ID */}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Transaction ID / Hash
              </label>

              <input
                type="text"
                value={trxId}
                onChange={(e) =>
                  setTrxId(e.target.value)
                }
                placeholder="Enter transaction ID"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
              />
            </div>

            {/* NOTE */}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Note
                <span className="ml-1 text-xs text-slate-600">
                  Optional
                </span>
              </label>

              <textarea
                value={note}
                onChange={(e) =>
                  setNote(e.target.value)
                }
                rows={3}
                placeholder="Optional note for EarnNova Team"
                className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/50"
              />
            </div>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Payment Method
                </span>

                <span className="text-sm font-semibold text-white">
                  {displayMethod}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Deposit
                </span>

                <span className="text-sm font-bold text-cyan-300">
                  $
                  {numericAmount > 0
                    ? numericAmount.toFixed(2)
                    : "0.00"}
                </span>
              </div>

              {numericAmount > 0 && (
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
                  <span className="text-xs text-slate-500">
                    Reference PKR value
                  </span>

                  <span className="text-xs font-semibold text-slate-300">
                    PKR{" "}
                    {pkrAmount.toLocaleString(
                      "en-PK"
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* =================================================
                WARNING
            ================================================= */}

            <div className="mt-5 flex gap-3 rounded-2xl border border-blue-400/10 bg-blue-400/5 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />

              <p className="text-xs leading-5 text-slate-400">
                Make sure the payment details and
                transaction ID are correct. Deposits
                are manually reviewed by EarnNova
                Team before funds are added to your
                wallet.
              </p>
            </div>

            {/* =================================================
                SUBMIT
            ================================================= */}

            <button
              type="button"
              onClick={continueDeposit}
              disabled={submitting}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-cyan-500/10 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Submit Deposit Request
                </>
              )}
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}