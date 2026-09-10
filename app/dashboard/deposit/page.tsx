"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type PaymentMethod = "USDT" | "Bank Transfer";

/*
 * =========================================================
 * PAYMENT DETAILS
 * =========================================================
 *
 * USDT:
 * TRON / TRC20
 *
 * Bank Transfer:
 * Pakistan only
 */

const USDT_ADDRESS = "TAWgQk5vdz964jxps2nYjTAj6c8WRpp4hb";

const BANK_NAME = "Bank Alfalah";
const ACCOUNT_TITLE = "ASIFA SALEEM";
const ACCOUNT_NUMBER = "00551011258485";

/*
 * Display/reference conversion only.
 *
 * Database deposit amount remains USD.
 */
const USD_TO_PKR = 280;

export default function DepositPage() {
  const router = useRouter();

  /* =======================================================
     FORM STATE
     ======================================================= */

  const [amount, setAmount] = useState("");
  const [method, setMethod] =
    useState<PaymentMethod>("USDT");

  /* =======================================================
     PAGE STATE
     ======================================================= */

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* =======================================================
     USER STATE
     ======================================================= */

  const [profileName, setProfileName] = useState("");
  const [wallet, setWallet] = useState(0);

  /* =======================================================
     PAYMENT VERIFICATION
     ======================================================= */

  const [senderName, setSenderName] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [note, setNote] = useState("");

  /* =======================================================
     UI STATE
     ======================================================= */

  const [copied, setCopied] = useState(false);
  const [accountCopied, setAccountCopied] =
    useState(false);

  const [submitted, setSubmitted] = useState(false);

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
        console.error(
          "AUTH ERROR:",
          authError
        );
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
        console.error(
          "PROFILE ERROR:",
          error
        );
        return;
      }

      setProfileName(
        data?.full_name || "Member"
      );

      setWallet(
        Number(data?.wallet || 0)
      );
    } catch (error) {
      console.error(
        "LOAD PROFILE ERROR:",
        error
      );
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
      console.error(
        "COPY ADDRESS ERROR:",
        error
      );

      alert(
        "Unable to copy wallet address."
      );
    }
  }

  /* =======================================================
     COPY BANK ACCOUNT
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
      console.error(
        "COPY ACCOUNT ERROR:",
        error
      );

      alert(
        "Unable to copy account number."
      );
    }
  }

  /* =======================================================
     SUBMIT DEPOSIT
     ======================================================= */

  async function continueDeposit() {
    if (submitting) return;

    const value = Number(amount);

    /* =====================================================
       AMOUNT VALIDATION
       ===================================================== */

    if (!amount.trim() || !Number.isFinite(value)) {
      alert(
        "Please enter a valid deposit amount."
      );
      return;
    }

    if (value < 1) {
      alert(
        "Minimum deposit is $1."
      );
      return;
    }

    /*
     * Avoid unnecessarily huge / invalid values.
     */
    if (value > 1000000) {
      alert(
        "Please enter a valid deposit amount."
      );
      return;
    }

    /* =====================================================
       SENDER NAME
       ===================================================== */

    if (!senderName.trim()) {
      alert(
        "Please enter sender name."
      );
      return;
    }

    /* =====================================================
       SENDER ACCOUNT / WALLET
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
       TRANSACTION ID
       ===================================================== */

    if (!trxId.trim()) {
      alert(
        "Please enter transaction ID / hash."
      );
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
        console.error(
          "AUTH ERROR:",
          authError
        );
      }

      if (!user) {
        router.replace("/login");
        return;
      }

      /* ===================================================
         CHECK EXISTING PENDING REQUEST
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
        throw existingError;
      }

      if (
        existingRequests &&
        existingRequests.length > 0
      ) {
        alert(
          "You already have a pending deposit request. Please wait for the EarnNova Team to review it."
        );

        setSubmitted(true);
        return;
      }

      /* ===================================================
         CREATE DEPOSIT REQUEST
         ===================================================
         
         IMPORTANT:
         - amount is stored in USD
         - status starts as pending
         - wallet is NOT updated here
         - admin verification is required
         - no screenshot is uploaded
         */

      const { error: insertError } =
        await supabase
          .from("deposits")
          .insert({
            user_id: user.id,
            amount: value,
            method,
            transaction_id: trxId.trim(),

            /*
             * No screenshot/payment proof upload.
             *
             * The existing database column is kept null.
             */
            payment_proof: null,

            status: "pending",

            /*
             * Optional customer note is not used as
             * payment proof.
             *
             * If your database later gets a dedicated
             * customer_note column, it can be stored there.
             */
            admin_note: note.trim()
              ? note.trim()
              : null,
          });

      if (insertError) {
        throw insertError;
      }

      setSubmitted(true);
    } catch (error: unknown) {
      console.error(
        "DEPOSIT SUBMIT ERROR:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your deposit request.";

      alert(message);
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     LOADING SCREEN
     ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b10] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-[#11151b]">
            <Loader2
              size={22}
              className="animate-spin text-blue-500"
            />
          </div>

          <p className="text-sm font-semibold text-slate-400">
            Loading Deposit...
          </p>
        </div>
      </main>
    );
  }

  /* =======================================================
     SUCCESS / PENDING STATE
     ======================================================= */

  if (submitted) {
    return (
      <main className="min-h-screen bg-[#070b10] px-4 py-8 text-white sm:px-5">
        <div className="mx-auto flex min-h-[85vh] w-full max-w-[570px] items-center justify-center">
          <div className="w-full rounded-3xl border border-slate-800 bg-[#11151b] p-7 text-center shadow-2xl sm:p-8">

            {/* SUCCESS ICON */}

            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/10 bg-emerald-500/10 text-emerald-400">
              <CheckCircle size={38} />
            </div>

            <h1 className="mt-6 text-2xl font-black tracking-tight">
              Deposit Request Submitted
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Your deposit request has been submitted
              successfully. Your wallet will be updated
              after verification by the EarnNova Team.
            </p>

            {/* SUMMARY */}

            <div className="mt-7 rounded-2xl border border-slate-800 bg-[#090d12] p-5 text-left">

              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-sm text-slate-500">
                  Amount
                </span>

                <span className="text-lg font-black text-blue-400">
                  $
                  {Number(amount).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 py-4">
                <span className="text-sm text-slate-500">
                  Payment Method
                </span>

                <span className="font-semibold text-white">
                  {method}
                </span>
              </div>

              {method === "Bank Transfer" && (
                <div className="flex items-center justify-between border-b border-slate-800 py-4">
                  <span className="text-sm text-slate-500">
                    Reference PKR
                  </span>

                  <span className="font-semibold text-emerald-400">
                    PKR{" "}
                    {(
                      Number(amount) *
                      USD_TO_PKR
                    ).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-slate-500">
                  Status
                </span>

                <span className="rounded-full border border-amber-500/10 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-400">
                  Pending Review
                </span>
              </div>
            </div>

            {/* WAITING */}

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-amber-400">
              <ShieldCheck size={16} />
              Waiting for EarnNova Team verification
            </div>

            {/* DASHBOARD */}

            <button
              type="button"
              onClick={() =>
                router.push("/dashboard")
              }
              className="mt-7 block w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     CALCULATIONS
     ======================================================= */

  const numericAmount = Number(
    amount || 0
  );

  const pkrAmount =
    Number.isFinite(numericAmount) &&
    numericAmount > 0
      ? numericAmount * USD_TO_PKR
      : 0;

  /* =======================================================
     MAIN PAGE
     ======================================================= */

  return (
    <main className="min-h-screen bg-[#070b10] px-3 py-5 text-white sm:px-5 sm:py-8">
      <div className="mx-auto w-full max-w-[570px]">

        {/* =================================================
            HEADER
            ================================================= */}

        <header className="mb-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/30 hover:text-white"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-400">
              EarnNova
            </p>

            <h1 className="mt-1 text-xl font-black tracking-tight">
              Deposit Funds
            </h1>
          </div>
        </header>

        {/* =================================================
            WELCOME
            ================================================= */}

        <section className="mb-4 rounded-2xl border border-blue-500/10 bg-gradient-to-r from-blue-500/[0.07] to-transparent p-4">
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-500/10 bg-blue-500/10 text-blue-400">
              <CircleDollarSign size={22} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-bold">
                Add funds to your wallet
              </p>

              <p className="mt-1 truncate text-[10px] text-slate-500">
                Hello, {profileName}
              </p>
            </div>
          </div>
        </section>

        {/* =================================================
            CURRENT BALANCE
            ================================================= */}

        <section className="mb-4 rounded-[22px] border border-slate-800 bg-[#11151b] p-5 shadow-xl">
          <div className="flex items-center justify-between gap-4">

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">
                Current Balance
              </p>

              <p className="mt-1 text-3xl font-extrabold tracking-tight">
                ${wallet.toFixed(2)}
              </p>

              <p className="mt-1 text-[9px] text-slate-600">
                Wallet balance in USD
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <Wallet size={23} />
            </div>
          </div>
        </section>

        {/* =================================================
            DEPOSIT FORM
            ================================================= */}

        <section className="rounded-[22px] border border-slate-800 bg-[#11151b] p-5 shadow-2xl sm:p-6">

          {/* FORM HEADER */}

          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Deposit Amount
            </p>

            <h2 className="mt-1 text-lg font-bold">
              How much do you want to deposit?
            </h2>

            <p className="mt-1 text-[10px] leading-5 text-slate-600">
              Deposit amounts are recorded and maintained
              in USD.
            </p>
          </div>

          {/* =================================================
              AMOUNT
              ================================================= */}

          <div>
            <label
              htmlFor="deposit-amount"
              className="mb-2 block text-xs font-bold text-slate-400"
            >
              Amount
            </label>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-500">
                $
              </span>

              <input
                id="deposit-amount"
                type="number"
                min="1"
                max="1000000"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
                }
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-800 bg-[#090d12] py-4 pl-10 pr-4 text-lg font-bold text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/50"
              />
            </div>

            <p className="mt-2 text-[10px] text-slate-600">
              Minimum deposit: $1.00
            </p>
          </div>

          {/* =================================================
              QUICK AMOUNTS
              ================================================= */}

          <div className="mt-4 grid grid-cols-4 gap-2">
            {["1", "5", "10", "25"].map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setAmount(value)
                  }
                  className="rounded-xl border border-slate-800 bg-[#090d12] px-3 py-3 text-xs font-bold text-slate-400 transition hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-white"
                >
                  ${value}
                </button>
              )
            )}
          </div>

          {/* =================================================
              PAYMENT METHOD
              ================================================= */}

          <div className="mt-6">
            <label className="mb-3 block text-xs font-bold text-slate-400">
              Payment Method
            </label>

            <div className="grid grid-cols-2 gap-3">

              {/* USDT */}

              <button
                type="button"
                onClick={() =>
                  setMethod("USDT")
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  method === "USDT"
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-slate-800 bg-[#090d12] hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <CircleDollarSign size={20} />
                  </div>

                  {method === "USDT" && (
                    <CheckCircle
                      size={17}
                      className="text-blue-400"
                    />
                  )}
                </div>

                <p className="mt-3 text-sm font-bold">
                  USDT
                </p>

                <p className="mt-1 text-[9px] text-slate-500">
                  TRC20 crypto payment
                </p>
              </button>

              {/* BANK */}

              <button
                type="button"
                onClick={() =>
                  setMethod("Bank Transfer")
                }
                className={`rounded-2xl border p-4 text-left transition ${
                  method === "Bank Transfer"
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-slate-800 bg-[#090d12] hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <CreditCard size={20} />
                  </div>

                  {method === "Bank Transfer" && (
                    <CheckCircle
                      size={17}
                      className="text-blue-400"
                    />
                  )}
                </div>

                <p className="mt-3 text-sm font-bold">
                  Bank Transfer
                </p>

                <p className="mt-1 text-[9px] text-slate-500">
                  Pakistan only
                </p>
              </button>
            </div>
          </div>

          {/* =================================================
              PAYMENT DETAILS
              ================================================= */}

          <div className="mt-6 rounded-2xl border border-slate-800 bg-[#090d12] p-4">

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <ShieldCheck size={20} />
              </div>

              <div>
                <p className="text-sm font-bold">
                  Payment Details
                </p>

                <p className="mt-1 text-[9px] leading-5 text-slate-500">
                  Send payment only to the official
                  EarnNova payment details below.
                </p>
              </div>
            </div>

            {/* =================================================
                USDT DETAILS
                ================================================= */}

            {method === "USDT" && (
              <div className="mt-5">

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-600">
                    Network
                  </p>

                  <p className="mt-1 text-sm font-bold text-white">
                    TRON (TRC20)
                  </p>
                </div>

                <div className="mt-5">
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.13em] text-slate-600">
                    USDT Deposit Address
                  </p>

                  <div className="flex items-center gap-2">

                    <div className="min-w-0 flex-1 rounded-xl border border-slate-800 bg-[#070b10] px-3 py-3">
                      <p className="break-all font-mono text-[10px] font-medium text-slate-300">
                        {USDT_ADDRESS}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={copyAddress}
                      className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white transition hover:bg-blue-500"
                    >
                      {copied ? (
                        <>
                          <CheckCircle size={17} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={17} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={16}
                      className="mt-0.5 shrink-0 text-amber-400"
                    />

                    <div>
                      <p className="text-sm font-bold text-amber-400">
                        Send exactly{" "}
                        {numericAmount > 0
                          ? numericAmount.toFixed(2)
                          : "0.00"}{" "}
                        USDT
                      </p>

                      <p className="mt-1 text-[9px] leading-5 text-slate-500">
                        Use the TRC20 network only.
                        Sending through another network
                        may cause the payment to be lost.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                BANK DETAILS
                ================================================= */}

            {method === "Bank Transfer" && (
              <div className="mt-5 space-y-4">

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-600">
                    Availability
                  </p>

                  <p className="mt-1 text-sm font-bold text-white">
                    Pakistan only
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-600">
                    Bank
                  </p>

                  <p className="mt-1 text-sm font-bold text-white">
                    {BANK_NAME}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-600">
                    Account Title
                  </p>

                  <p className="mt-1 text-sm font-bold text-white">
                    {ACCOUNT_TITLE}
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.13em] text-slate-600">
                    Account Number
                  </p>

                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-[#070b10] px-4 py-3">

                    <span className="break-all font-mono text-sm font-bold text-slate-300">
                      {ACCOUNT_NUMBER}
                    </span>

                    <button
                      type="button"
                      onClick={copyAccount}
                      className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-bold text-blue-400 transition hover:bg-blue-500/10"
                    >
                      {accountCopied ? (
                        <>
                          <CheckCircle size={17} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={17} />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* USD */}

                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-600">
                    Deposit Amount
                  </p>

                  <p className="mt-1 text-xl font-black text-blue-400">
                    $
                    {numericAmount.toFixed(2)}
                  </p>

                  <p className="mt-1 text-[9px] text-slate-600">
                    Wallet/deposit amount is maintained in USD.
                  </p>
                </div>

                {/* PKR REFERENCE */}

                <div className="rounded-xl border border-blue-500/10 bg-blue-500/5 p-4">
                  <p className="text-[9px] font-bold uppercase tracking-[0.13em] text-slate-500">
                    Pakistan Payment Reference
                  </p>

                  <p className="mt-1 text-lg font-black text-emerald-400">
                    PKR{" "}
                    {pkrAmount.toLocaleString()}
                  </p>

                  <p className="mt-1 text-[9px] text-slate-600">
                    Reference rate: $1 = PKR 280
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <p className="text-sm font-medium text-amber-400">
                    Send the corresponding PKR amount
                  </p>

                  <p className="mt-1 text-[9px] leading-5 text-slate-500">
                    After making the payment, enter your
                    sender details and transaction ID below.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* =================================================
              VERIFICATION
              ================================================= */}

          <div className="mt-6">

            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                Payment Verification
              </p>

              <h3 className="mt-1 text-lg font-bold">
                Confirm your payment
              </h3>

              <p className="mt-1 text-[10px] leading-5 text-slate-600">
                No screenshot is required. Enter the
                transaction details so the EarnNova Team
                can verify your payment.
              </p>
            </div>

            <div className="space-y-4">

              {/* =================================================
                  SENDER NAME
                  ================================================= */}

              <div>
                <label
                  htmlFor="sender-name"
                  className="mb-2 block text-xs font-bold text-slate-400"
                >
                  Sender Name
                </label>

                <input
                  id="sender-name"
                  type="text"
                  value={senderName}
                  onChange={(e) =>
                    setSenderName(e.target.value)
                  }
                  placeholder="Name used for payment"
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-800 bg-[#090d12] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500/50"
                />
              </div>

              {/* =================================================
                  SENDER ACCOUNT
                  ================================================= */}

              <div>
                <label
                  htmlFor="sender-number"
                  className="mb-2 block text-xs font-bold text-slate-400"
                >
                  {method === "USDT"
                    ? "Sender Wallet / Account"
                    : "Sender Account / Number"}
                </label>

                <input
                  id="sender-number"
                  type="text"
                  value={senderNumber}
                  onChange={(e) =>
                    setSenderNumber(e.target.value)
                  }
                  placeholder={
                    method === "USDT"
                      ? "Wallet address or exchange account"
                      : "Account or mobile number"
                  }
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-xl border border-slate-800 bg-[#090d12] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500/50"
                />
              </div>

              {/* =================================================
                  TRANSACTION ID
                  ================================================= */}

              <div>
                <label
                  htmlFor="transaction-id"
                  className="mb-2 block text-xs font-bold text-slate-400"
                >
                  Transaction ID / Hash
                </label>

                <input
                  id="transaction-id"
                  type="text"
                  value={trxId}
                  onChange={(e) =>
                    setTrxId(e.target.value)
                  }
                  placeholder="Enter transaction ID / hash"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-xl border border-slate-800 bg-[#090d12] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500/50"
                />
              </div>

              {/* =================================================
                  NOTE
                  ================================================= */}

              <div>
                <label
                  htmlFor="deposit-note"
                  className="mb-2 block text-xs font-bold text-slate-400"
                >
                  Note{" "}
                  <span className="text-slate-600">
                    (Optional)
                  </span>
                </label>

                <textarea
                  id="deposit-note"
                  value={note}
                  onChange={(e) =>
                    setNote(e.target.value)
                  }
                  placeholder="Additional information..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-800 bg-[#090d12] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500/50"
                />
              </div>
            </div>
          </div>

          {/* =================================================
              SUMMARY
              ================================================= */}

          <div className="mt-6 rounded-2xl border border-slate-800 bg-[#090d12] p-4">

            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-600">
              Deposit Summary
            </p>

            <div className="mt-4 space-y-3">

              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-500">
                  Amount
                </span>

                <span className="font-bold">
                  ${numericAmount.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-500">
                  Method
                </span>

                <span className="text-right font-bold">
                  {method}
                </span>
              </div>

              {method === "Bank Transfer" && (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs text-slate-500">
                    PKR Reference
                  </span>

                  <span className="font-bold text-emerald-400">
                    PKR{" "}
                    {pkrAmount.toLocaleString()}
                  </span>
                </div>
              )}

              <div className="border-t border-slate-800 pt-3">
                <div className="flex items-center justify-between gap-4">

                  <span className="text-sm font-bold text-slate-300">
                    Status
                  </span>

                  <span className="rounded-full border border-amber-500/10 bg-amber-500/10 px-3 py-1 text-[10px] font-bold text-amber-400">
                    Pending Verification
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              SUBMIT
              ================================================= */}

          <button
            type="button"
            onClick={continueDeposit}
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Submitting...
              </>
            ) : (
              <>
                Submit Deposit
                <ArrowLeft
                  size={17}
                  className="rotate-180"
                />
              </>
            )}
          </button>

          {/* =================================================
              SECURITY
              ================================================= */}

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] p-3">

            <ShieldCheck
              size={15}
              className="mt-0.5 shrink-0 text-emerald-400"
            />

            <p className="text-[9px] leading-5 text-slate-600">
              Never share your password or account credentials.
              Always verify the payment details before sending
              funds. Your deposit will only be added to your
              wallet after EarnNova Team verification.
            </p>
          </div>
        </section>

        {/* =================================================
            BACK TO DASHBOARD
            ================================================= */}

        <button
          type="button"
          onClick={() =>
            router.push("/dashboard")
          }
          className="mt-5 flex w-full items-center justify-center gap-2 py-3 text-xs font-bold text-slate-600 transition hover:text-white"
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </button>

        {/* =================================================
            FOOTER
            ================================================= */}

        <footer className="py-5 text-center">
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-700">
            EarnNova
          </p>

          <p className="mt-1 text-[9px] text-slate-700">
            Earn • Grow • Repeat
          </p>
        </footer>
      </div>
    </main>
  );
}