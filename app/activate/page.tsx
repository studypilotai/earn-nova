"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type PaymentMethod = "bank" | "crypto";

const plans = {
  Bronze: 5,
  Silver: 10,
  Gold: 25,
  Platinum: 50,
  Diamond: 100,
} as const;

type PlanName = keyof typeof plans;

type StoredPlan = {
  name: PlanName;
  monthlyPrice: number;
  totalPrice: number;
  months: number;
  dailyTasks?: number;
  dailyEarning?: number;
};

type ActivationStatus =
  | "pending"
  | "approved"
  | "rejected";

type Activation = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_reference: string | null;
  status: ActivationStatus;
  created_at: string;
  updated_at: string;
};

const countries = [
  "Pakistan",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Italy",
  "Spain",
  "Netherlands",
  "Belgium",
  "Switzerland",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Ireland",
  "New Zealand",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Kuwait",
  "Oman",
  "Bahrain",
  "India",
  "Bangladesh",
  "Malaysia",
  "Singapore",
  "Indonesia",
  "South Africa",
  "Nigeria",
  "Kenya",
  "Other",
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function LogoMark() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
      <span className="text-lg font-black text-white">
        E
      </span>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect
        x="9"
        y="9"
        width="11"
        height="11"
        rx="2"
      />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m3 10 9-7 9 7" />
      <path d="M5 10v9" />
      <path d="M9 10v9" />
      <path d="M15 10v9" />
      <path d="M19 10v9" />
      <path d="M3 19h18" />
      <path d="M2 22h20" />
    </svg>
  );
}

function CryptoIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M9 8h4.5a2 2 0 0 1 0 4H9h4.5a2 2 0 0 1 0 4H9V8Z" />
      <path d="M11 6v12M13 6v12" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}

function LoaderIcon() {
  return (
    <svg
      className="h-5 w-5 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />

      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Clock3Icon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="shrink-0 text-amber-400"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

export default function ActivatePage() {
  const router = useRouter();

  const [planParam, setPlanParam] =
    useState<string | null>(null);

  const [step, setStep] = useState<1 | 2>(1);

  const [country, setCountry] = useState("");

  const [method, setMethod] =
    useState<PaymentMethod>("crypto");

  const [bankName, setBankName] =
    useState("");

  const [senderName, setSenderName] =
    useState("");

  const [senderNumber, setSenderNumber] =
    useState("");

  const [trxId, setTrxId] =
    useState("");

  const [note, setNote] =
    useState("");

  const [storedPlan, setStoredPlan] =
    useState<StoredPlan | null>(null);

  const [accountCopied, setAccountCopied] =
    useState(false);

  const [addressCopied, setAddressCopied] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [checkingRequest, setCheckingRequest] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [existingActivation, setExistingActivation] =
    useState<Activation | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    setPlanParam(params.get("plan"));
  }, []);

  useEffect(() => {
    const loadPlan = () => {
      const saved =
        localStorage.getItem(
          "earnNovaSelectedPlan"
        );

      if (!saved) {
        router.replace("/plans");
        return;
      }

      try {
        const parsed = JSON.parse(saved);

        if (
          !parsed?.name ||
          !(parsed.name in plans)
        ) {
          localStorage.removeItem(
            "earnNovaSelectedPlan"
          );

          router.replace("/plans");
          return;
        }

        const planName =
          parsed.name as PlanName;

        const monthlyPrice =
          Number(parsed.monthlyPrice) ||
          plans[planName];

        const months = Math.max(
          1,
          Number(parsed.months) || 1
        );

        const totalPrice =
          Number(parsed.totalPrice) ||
          monthlyPrice * months;

        setStoredPlan({
          name: planName,
          monthlyPrice,
          totalPrice,
          months,
          dailyTasks:
            parsed.dailyTasks,
          dailyEarning:
            parsed.dailyEarning,
        });
      } catch (error) {
        console.error(
          "PLAN LOAD ERROR:",
          error
        );

        localStorage.removeItem(
          "earnNovaSelectedPlan"
        );

        router.replace("/plans");
      }
    };

    loadPlan();
  }, [router]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } =
          await supabase.auth.getUser();

        if (error || !user) {
          window.location.replace(
            "/login"
          );
          return;
        }

        setCheckingAuth(false);

        /*
         * IMPORTANT:
         * Check database for existing activation.
         *
         * This means even after page refresh,
         * pending status remains visible.
         */
        const {
          data: activation,
          error: activationError,
        } = await supabase
          .from("activations")
          .select(
            "id,user_id,amount,currency,payment_method,payment_reference,status,created_at,updated_at"
          )
          .eq("user_id", user.id)
          .in("status", [
            "pending",
            "approved",
          ])
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (activationError) {
          console.error(
            "ACTIVATION STATUS ERROR:",
            activationError
          );

          /*
           * Do not block the page.
           * If RLS prevents reading, submission
           * will show the exact database error.
           */
        } else if (activation) {
          setExistingActivation(
            activation as Activation
          );

          if (
            activation.status ===
            "pending"
          ) {
            setSubmitted(true);
          }
        }

        setCheckingRequest(false);
      } catch (error) {
        console.error(
          "AUTH CHECK ERROR:",
          error
        );

        window.location.replace(
          "/login"
        );
      }
    };

    checkAuth();
  }, []);

  const selectedPlan = useMemo(() => {
    if (
      planParam &&
      planParam in plans
    ) {
      const name =
        planParam as PlanName;

      if (
        storedPlan &&
        storedPlan.name === name
      ) {
        return storedPlan;
      }

      return {
        name,
        monthlyPrice: plans[name],
        totalPrice: plans[name],
        months: 1,
        dailyTasks: undefined,
        dailyEarning: undefined,
      };
    }

    return storedPlan;
  }, [planParam, storedPlan]);

  const monthlyPrice =
    selectedPlan?.monthlyPrice || 0;

  const totalPrice =
    selectedPlan?.totalPrice || 0;

  const pkrAmount =
    totalPrice * 280;

  const isPakistan =
    country === "Pakistan";

  const durationLabel = selectedPlan
    ? `${selectedPlan.months} Month${
        selectedPlan.months !== 1
          ? "s"
          : ""
      }`
    : "";

  useEffect(() => {
    if (!isPakistan) {
      setMethod("crypto");
    }
  }, [isPakistan]);

  const handleCountryContinue = () => {
    if (!country) {
      alert(
        "Please select your country."
      );
      return;
    }

    setStep(2);
  };

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(
        "00551011258485"
      );

      setAccountCopied(true);

      setTimeout(() => {
        setAccountCopied(false);
      }, 2000);
    } catch (error) {
      console.error(error);

      alert(
        "Unable to copy account number."
      );
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(
        "TAWgQk5vdz964jxps2nYjTAj6c8WRpp4hb"
      );

      setAddressCopied(true);

      setTimeout(() => {
        setAddressCopied(false);
      }, 2000);
    } catch (error) {
      console.error(error);

      alert(
        "Unable to copy wallet address."
      );
    }
  };

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    if (!selectedPlan) {
      alert(
        "Please select a plan first."
      );

      router.push("/plans");
      return;
    }

    if (!country) {
      alert(
        "Please select your country."
      );

      setStep(1);
      return;
    }

    if (!bankName.trim()) {
      alert(
        method === "bank"
          ? "Please enter the bank name."
          : "Please enter the wallet/exchange name."
      );

      return;
    }

    if (!senderName.trim()) {
      alert(
        "Please enter sender name."
      );

      return;
    }

    if (!senderNumber.trim()) {
      alert(
        method === "bank"
          ? "Please enter sender account/number."
          : "Please enter sender wallet/account."
      );

      return;
    }

    if (!trxId.trim()) {
      alert(
        "Please enter transaction ID."
      );

      return;
    }

    try {
      setSubmitting(true);

      /*
       * 1. AUTH
       */
      const {
        data: { user },
        error: authError,
      } =
        await supabase.auth.getUser();

      if (authError) {
        console.error(
          "AUTH ERROR:",
          authError
        );

        throw new Error(
          authError.message
        );
      }

      if (!user) {
        window.location.replace(
          "/login"
        );
        return;
      }

      console.log(
        "ACTIVATION USER:",
        user.id
      );

      /*
       * 2. CHECK EXISTING PENDING REQUEST
       */
      const {
        data: pendingRequest,
        error: pendingError,
      } = await supabase
        .from("activations")
        .select("id,status")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (pendingError) {
        console.error(
          "PENDING CHECK ERROR:",
          pendingError
        );

        throw new Error(
          `Unable to check activation status: ${pendingError.message}`
        );
      }

      if (pendingRequest) {
        setExistingActivation(
          pendingRequest as Activation
        );

        setSubmitted(true);

        alert(
          "You already have a pending activation request. Please wait for admin approval."
        );

        return;
      }

      /*
       * 3. PREPARE ACTIVATION
       */
      const activationData = {
        user_id: user.id,
        amount: Number(totalPrice),
        currency: "USD",
        payment_method:
          method === "bank"
            ? "Bank Transfer"
            : "USDT TRC20",
        payment_reference:
          trxId.trim(),
        status: "pending",
      };

      console.log(
        "ACTIVATION DATA:",
        activationData
      );

      /*
       * 4. INSERT INTO SAME TABLE USED BY ADMIN
       */
      const {
        data: insertedActivation,
        error: insertError,
      } = await supabase
        .from("activations")
        .insert(activationData)
        .select(
          "id,user_id,amount,currency,payment_method,payment_reference,status,created_at,updated_at"
        )
        .single();

      /*
       * VERY IMPORTANT:
       * If RLS/schema is wrong, this will show
       * the exact Supabase error.
       */
      if (insertError) {
        console.error(
          "ACTIVATION INSERT ERROR:",
          insertError
        );

        throw new Error(
          `Activation request failed: ${insertError.message}`
        );
      }

      if (!insertedActivation) {
        throw new Error(
          "Activation request was not created."
        );
      }

      console.log(
        "ACTIVATION CREATED:",
        insertedActivation
      );

      /*
       * 5. STORE ACTIVATION IN STATE
       */
      setExistingActivation(
        insertedActivation as Activation
      );

      /*
       * 6. SAVE PLAN LOCALLY
       */
      localStorage.setItem(
        "earnNovaSelectedPlan",
        JSON.stringify({
          name: selectedPlan.name,
          monthlyPrice,
          totalPrice,
          months:
            selectedPlan.months,
          dailyTasks:
            selectedPlan.dailyTasks,
          dailyEarning:
            selectedPlan.dailyEarning,
        })
      );

      /*
       * 7. SAVE CUSTOMER ACTIVATION DETAILS
       */
      localStorage.setItem(
        "earnNovaActivation",
        JSON.stringify({
          id: insertedActivation.id,
          plan: selectedPlan.name,
          monthlyPrice,
          months:
            selectedPlan.months,
          amount: totalPrice,
          totalAmount: totalPrice,
          country,
          paymentMethod: method,
          bankName:
            bankName.trim(),
          senderName:
            senderName.trim(),
          senderNumber:
            senderNumber.trim(),
          transactionId:
            trxId.trim(),
          note:
            note.trim() || null,
          status: "pending",
          submittedAt:
            new Date().toISOString(),
        })
      );

      /*
       * 8. SHOW PENDING SCREEN
       */
      setSubmitted(true);

      alert(
        "Activation request submitted successfully. Your account is now pending admin approval."
      );
    } catch (error: any) {
      console.error(
        "ACTIVATION SUBMISSION ERROR:",
        error
      );

      alert(
        error?.message ||
          "Something went wrong while submitting your activation request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * AUTH LOADING
   */
  if (
    checkingAuth ||
    checkingRequest
  ) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

            <p className="text-sm text-slate-400">
              Checking your activation status...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * NO PLAN
   */
  if (!selectedPlan) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-slate-400">
              No plan selected.
            </p>

            <button
              onClick={() =>
                router.push("/plans")
              }
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Choose Plan
            </button>
          </div>
        </div>
      </main>
    );
  }

  /*
   * PENDING SCREEN
   *
   * This screen is shown:
   * - immediately after submission
   * - after refresh
   * - when DB has pending activation
   */
  if (
    submitted &&
    existingActivation?.status ===
      "pending"
  ) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <header className="border-b border-slate-800 bg-slate-950/90">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
            <button
              onClick={() =>
                router.push(
                  "/dashboard"
                )
              }
              className="flex items-center gap-3"
            >
              <LogoMark />

              <div className="text-left">
                <div className="text-lg font-black tracking-tight">
                  Earn
                  <span className="text-blue-500">
                    Nova
                  </span>
                </div>

                <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                  Activation
                </div>
              </div>
            </button>

            <button
              onClick={() =>
                router.push(
                  "/dashboard"
                )
              }
              className="rounded-xl border border-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 hover:text-white"
            >
              Dashboard
            </button>
          </div>
        </header>

        <div className="mx-auto flex min-h-[calc(100vh-145px)] max-w-2xl items-center justify-center px-5 py-10">
          <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
              <Clock3Icon />
            </div>

            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-300">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
              Pending
            </div>

            <h1 className="text-3xl font-black">
              Activation Pending
            </h1>

            <p className="mx-auto mt-4 max-w-lg leading-7 text-slate-400">
              Your activation request has
              been received and is waiting
              for admin approval. Your
              earning features will unlock
              after approval.
            </p>

            <div className="mt-7 rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-left">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-sm text-slate-400">
                  Plan
                </span>

                <span className="font-bold text-white">
                  {
                    selectedPlan.name
                  }
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 py-4">
                <span className="text-sm text-slate-400">
                  Duration
                </span>

                <span className="font-semibold text-white">
                  {
                    durationLabel
                  }
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 py-4">
                <span className="text-sm text-slate-400">
                  Amount
                </span>

                <span className="text-xl font-bold text-blue-400">
                  $
                  {Number(
                    existingActivation.amount ??
                      totalPrice
                  ).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-slate-400">
                  Status
                </span>

                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-bold text-amber-300">
                  Pending
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-left">
              <Clock3Icon />

              <div>
                <p className="font-semibold text-amber-300">
                  Waiting for admin approval
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Please wait while our
                  admin team verifies your
                  payment.
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                router.push(
                  "/dashboard"
                )
              }
              className="mt-7 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-500 hover:to-indigo-500"
            >
              Go to Dashboard
            </button>
          </div>
        </div>

        <footer className="border-t border-slate-800 bg-slate-950">
          <div className="mx-auto max-w-6xl px-5 py-6 text-center text-xs text-slate-600">
            ©{" "}
            {new Date().getFullYear()}{" "}
            EarnNova. All rights
            reserved.
          </div>
        </footer>
      </main>
    );
  }

  /*
   * APPROVED
   */
  if (
    submitted &&
    existingActivation?.status ===
      "approved"
  ) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen items-center justify-center px-5">
          <div className="w-full max-w-2xl rounded-3xl border border-emerald-500/20 bg-slate-900 p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
              <CheckIcon />
            </div>

            <h1 className="text-3xl font-black">
              Account Activated
            </h1>

            <p className="mt-4 text-slate-400">
              Your account has already
              been approved.
            </p>

            <button
              onClick={() =>
                router.push(
                  "/dashboard"
                )
              }
              className="mt-7 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 font-bold"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  /*
   * MAIN ACTIVATION FORM
   */
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <button
            onClick={() =>
              router.push(
                "/dashboard"
              )
            }
            className="flex items-center gap-3"
          >
            <LogoMark />

            <div className="text-left">
              <div className="text-lg font-black tracking-tight">
                Earn
                <span className="text-blue-500">
                  Nova
                </span>
              </div>

              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Activation
              </div>
            </div>
          </button>

          <button
            onClick={() =>
              router.push(
                "/dashboard"
              )
            }
            className="rounded-xl border border-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-slate-700 hover:bg-slate-900 hover:text-white"
          >
            Dashboard
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-2 text-sm font-semibold text-blue-400">
            <ShieldIcon />
            Secure Activation
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Activate Your Account
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Complete your payment and submit
            the transaction details for admin
            verification.
          </p>
        </div>

        <div className="mx-auto mb-10 flex max-w-xl items-center">
          <div className="flex flex-1 items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
              1
            </div>

            <div
              className={`h-1 flex-1 ${
                step >= 2
                  ? "bg-blue-600"
                  : "bg-slate-800"
              }`}
            />
          </div>

          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${
              step >= 2
                ? "bg-blue-600 text-white"
                : "bg-slate-800 text-slate-500"
            }`}
          >
            2
          </div>
        </div>

        {step === 1 && (
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
                <h2 className="text-xl font-bold">
                  Select Country
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Select your country to see
                  available payment methods.
                </p>

                <div className="relative mt-6">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <GlobeIcon />
                  </div>

                  <select
                    value={country}
                    onChange={(e) =>
                      setCountry(
                        e.target.value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-950 px-12 py-3.5 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">
                      Select your country
                    </option>

                    {countries.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      Selected plan
                    </span>

                    <span className="rounded-lg bg-blue-500/10 px-3 py-1 text-sm font-bold text-blue-400">
                      {
                        selectedPlan.name
                      }
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-sm text-slate-500">
                        Duration
                      </p>

                      <p className="mt-1 font-semibold text-white">
                        {
                          durationLabel
                        }
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-slate-500">
                        Total
                      </p>

                      <p className="mt-1 text-2xl font-black text-white">
                        $
                        {
                          totalPrice
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={
                    handleCountryContinue
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-500 hover:to-indigo-500"
                >
                  Continue
                  <ArrowRightIcon />
                </button>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
                <h3 className="font-bold">
                  Plan Summary
                </h3>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      Plan
                    </span>

                    <span className="font-semibold">
                      {
                        selectedPlan.name
                      }
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      Monthly
                    </span>

                    <span className="font-semibold">
                      $
                      {
                        monthlyPrice
                      }
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      Duration
                    </span>

                    <span className="font-semibold">
                      {
                        durationLabel
                      }
                    </span>
                  </div>

                  <div className="border-t border-slate-800 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        Total
                      </span>

                      <span className="text-2xl font-black text-blue-400">
                        $
                        {
                          totalPrice
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex gap-3 text-sm text-slate-400">
                    <span className="mt-0.5 text-emerald-400">
                      <CheckIcon />
                    </span>
                    Secure payment verification
                  </div>

                  <div className="flex gap-3 text-sm text-slate-400">
                    <span className="mt-0.5 text-emerald-400">
                      <CheckIcon />
                    </span>
                    Admin approval required
                  </div>

                  <div className="flex gap-3 text-sm text-slate-400">
                    <span className="mt-0.5 text-emerald-400">
                      <CheckIcon />
                    </span>
                    Earnings unlock after approval
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mx-auto max-w-4xl">
            <button
              onClick={() =>
                setStep(1)
              }
              className="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white"
            >
              <ArrowLeftIcon />
              Back
            </button>

            <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
                <h2 className="text-xl font-bold">
                  Payment Details
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Send the exact amount and
                  enter your transaction
                  information below.
                </p>

                <div className="mt-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">
                        Amount to pay
                      </p>

                      <p className="mt-1 text-3xl font-black text-white">
                        $
                        {
                          totalPrice
                        }
                      </p>
                    </div>

                    {isPakistan && (
                      <div className="text-right">
                        <p className="text-sm text-slate-400">
                          Pakistan
                        </p>

                        <p className="mt-1 text-xl font-bold text-blue-400">
                          PKR{" "}
                          {pkrAmount.toLocaleString()}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          $1 = PKR 280
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="mb-3 text-sm font-semibold text-slate-300">
                    Payment Method
                  </p>

                  <div
                    className={`grid gap-3 ${
                      isPakistan
                        ? "sm:grid-cols-2"
                        : "grid-cols-1"
                    }`}
                  >
                    {isPakistan && (
                      <button
                        type="button"
                        onClick={() =>
                          setMethod(
                            "bank"
                          )
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          method === "bank"
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                              method ===
                              "bank"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            <BankIcon />
                          </div>

                          <div>
                            <p className="font-bold">
                              Bank Transfer
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Pakistan
                            </p>
                          </div>
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setMethod(
                          "crypto"
                        )
                      }
                      className={`rounded-2xl border p-4 text-left transition ${
                        method ===
                        "crypto"
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                            method ===
                            "crypto"
                              ? "bg-blue-600 text-white"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          <CryptoIcon />
                        </div>

                        <div>
                          <p className="font-bold">
                            USDT TRC20
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Crypto payment
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  {method ===
                    "bank" &&
                    isPakistan && (
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500">
                              Bank
                            </p>

                            <p className="mt-1 font-bold">
                              Bank Alfalah
                            </p>
                          </div>

                          <BankIcon />
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs text-slate-500">
                              Account Name
                            </p>

                            <p className="mt-1 font-semibold">
                              ASIFA SALEEM
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Account Number
                            </p>

                            <div className="mt-1 flex items-center gap-2">
                              <p className="font-semibold">
                                00551011258485
                              </p>

                              <button
                                type="button"
                                onClick={
                                  copyAccount
                                }
                                className="rounded-lg bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-700 hover:text-white"
                              >
                                {accountCopied ? (
                                  <CheckIcon />
                                ) : (
                                  <CopyIcon />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {method ===
                    "crypto" && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-slate-500">
                            Network
                          </p>

                          <p className="mt-1 font-bold">
                            USDT TRC20
                          </p>
                        </div>

                        <CryptoIcon />
                      </div>

                      <div className="mt-5">
                        <p className="text-xs text-slate-500">
                          Wallet Address
                        </p>

                        <div className="mt-2 flex gap-2">
                          <div className="min-w-0 flex-1 break-all rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-medium text-slate-200">
                            TAWgQk5vdz964jxps2nYjTAj6c8WRpp4hb
                          </div>

                          <button
                            type="button"
                            onClick={
                              copyAddress
                            }
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-slate-300 transition hover:bg-slate-700 hover:text-white"
                          >
                            {addressCopied ? (
                              <CheckIcon />
                            ) : (
                              <CopyIcon />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-amber-300">
                        Make sure you send
                        USDT using the TRC20
                        network. Sending through
                        another network may result
                        in loss of funds.
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      {method ===
                      "bank"
                        ? "Bank Name"
                        : "Wallet / Exchange Name"}
                    </label>

                    <input
                      value={bankName}
                      onChange={(e) =>
                        setBankName(
                          e.target.value
                        )
                      }
                      placeholder={
                        method ===
                        "bank"
                          ? "Enter bank name"
                          : "e.g. Binance, OKX, Bybit"
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      Sender Name
                    </label>

                    <input
                      value={senderName}
                      onChange={(e) =>
                        setSenderName(
                          e.target.value
                        )
                      }
                      placeholder="Enter sender name"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      {method ===
                      "bank"
                        ? "Sender Account / Number"
                        : "Sender Wallet / Account"}
                    </label>

                    <input
                      value={
                        senderNumber
                      }
                      onChange={(e) =>
                        setSenderNumber(
                          e.target.value
                        )
                      }
                      placeholder={
                        method ===
                        "bank"
                          ? "Enter account number"
                          : "Enter sender wallet/account"
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      Transaction ID
                    </label>

                    <input
                      value={trxId}
                      onChange={(e) =>
                        setTrxId(
                          e.target.value
                        )
                      }
                      placeholder="Enter transaction ID / TXID"
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      Note{" "}
                      <span className="font-normal text-slate-600">
                        (Optional)
                      </span>
                    </label>

                    <textarea
                      value={note}
                      onChange={(e) =>
                        setNote(
                          e.target.value
                        )
                      }
                      rows={3}
                      placeholder="Add any additional information..."
                      className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={
                    submitting
                  }
                  onClick={
                    handleSubmit
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <LoaderIcon />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Activation
                      <ArrowRightIcon />
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-5">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
                  <h3 className="font-bold">
                    Order Summary
                  </h3>

                  <div className="mt-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        Plan
                      </span>

                      <span className="font-bold">
                        {
                          selectedPlan.name
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        Monthly price
                      </span>

                      <span className="font-semibold">
                        $
                        {
                          monthlyPrice
                        }
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">
                        Duration
                      </span>

                      <span className="font-semibold">
                        {
                          durationLabel
                        }
                      </span>
                    </div>

                    <div className="border-t border-slate-800 pt-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold">
                          Total
                        </span>

                        <span className="text-2xl font-black text-blue-400">
                          $
                          {
                            totalPrice
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <ShieldIcon />
                    </div>

                    <div>
                      <h3 className="font-bold">
                        Secure Verification
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Your payment will be
                        manually verified.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div className="flex gap-3 text-sm text-slate-400">
                      <span className="text-emerald-400">
                        <CheckIcon />
                      </span>
                      Admin reviews your
                      transaction
                    </div>

                    <div className="flex gap-3 text-sm text-slate-400">
                      <span className="text-emerald-400">
                        <CheckIcon />
                      </span>
                      Account activates
                      after approval
                    </div>

                    <div className="flex gap-3 text-sm text-slate-400">
                      <span className="text-emerald-400">
                        <CheckIcon />
                      </span>
                      Earning features
                      unlock after
                      activation
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
                  <p className="text-sm font-semibold text-amber-300">
                    Important
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Please make sure your
                    transaction ID is correct.
                    False or invalid payment
                    information may result in
                    rejection of your activation
                    request.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-5 py-6 text-center text-xs text-slate-600">
          ©{" "}
          {new Date().getFullYear()}{" "}
          EarnNova. All rights reserved.
        </div>
      </footer>
    </main>
  );
}