"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  ShieldCheck,
  Wallet,
} from "lucide-react";

const supabase = createClient();

const USD_TO_PKR = 285;

const BANK_ACCOUNT = "Bank Transfer";
const BANK_ACCOUNT_TITLE = "MUHAMMAD ABDULLAH";
const BANK_IBAN = "PK38JCMA2710923339830897";

type Plan = {
  name: string;
  monthlyPrice: number;
  totalPrice: number;
  months: number;
  dailyTasks?: number;
  dailyVideos?: number;
  taskRange?: string;
  videoRange?: string;
};

type Activation = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_reference: string | null;
  status: string;
  created_at: string;
};

const PLANS: Plan[] = [
  {
    name: "Starter",
    monthlyPrice: 2.5,
    totalPrice: 2.5,
    months: 3,
    dailyTasks: 10,
    dailyVideos: 50,
  },
  {
    name: "Basic",
    monthlyPrice: 5,
    totalPrice: 5,
    months: 3,
    dailyTasks: 10,
    dailyVideos: 50,
  },
  {
    name: "Pro",
    monthlyPrice: 10,
    totalPrice: 10,
    months: 3,
    dailyTasks: 10,
    dailyVideos: 50,
  },
  {
    name: "Premium",
    monthlyPrice: 20,
    totalPrice: 20,
    months: 3,
    dailyTasks: 10,
    dailyVideos: 50,
  },
  {
    name: "VIP",
    monthlyPrice: 50,
    totalPrice: 50,
    months: 3,
    dailyTasks: 10,
    dailyVideos: 50,
  },
];

const COUNTRIES = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
];

function LogoMark() {
  return (
    <div className="relative flex h-12 w-12 items-center justify-center">
      <div className="absolute inset-0 rounded-[15px] bg-blue-600/20 blur-md" />

      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[15px] border border-blue-400/20 bg-gradient-to-br from-white via-slate-100 to-blue-50 shadow-xl">
        <div className="absolute -right-3 -top-3 h-7 w-7 rounded-full bg-blue-500/20 blur-md" />

        <div className="relative flex items-center justify-center">
          <span className="text-[21px] font-black italic tracking-[-0.15em] text-slate-950">
            E
          </span>

          <span className="-ml-0.5 text-[21px] font-black italic tracking-[-0.15em] text-blue-600">
            N
          </span>
        </div>

        <div className="absolute bottom-1.5 left-2 h-[2px] w-5 rounded-full bg-blue-500" />
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <LogoMark />

      <div>
        <h1 className="text-[20px] font-black tracking-tight text-white">
          Earn<span className="text-blue-500">Nova</span>
        </h1>

        <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-slate-400">
          Earn • Grow • Repeat
        </p>
      </div>
    </div>
  );
}

function formatUsd(value: number) {
  return `$${value.toFixed(2)}`;
}

export default function ActivatePage() {
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [country, setCountry] = useState("");

  const [method, setMethod] = useState<"bank" | "crypto" | "">("");

  const [senderName, setSenderName] = useState("");
  const [senderNumber, setSenderNumber] = useState("");

  const [trxId, setTrxId] = useState("");
  const [note, setNote] = useState("");

  const [activation, setActivation] =
    useState<Activation | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  const isPakistan = country === "Pakistan";

  const pkrAmount = useMemo(() => {
    if (!selectedPlan) return 0;

    const normalAmount =
      selectedPlan.totalPrice * USD_TO_PKR;

    if (selectedPlan.name === "Starter") {
      return 710;
    }

    return normalAmount;
  }, [selectedPlan]);

  const normalPkrAmount = useMemo(() => {
    if (!selectedPlan) return 0;

    return selectedPlan.totalPrice * USD_TO_PKR;
  }, [selectedPlan]);

  const loadPage = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const storedPlan = localStorage.getItem(
        "earnNovaSelectedPlan"
      );

      if (!storedPlan) {
        router.replace("/plans");
        return;
      }

      let parsedPlan: Plan | null = null;

      try {
        parsedPlan = JSON.parse(storedPlan);
      } catch {
        parsedPlan = null;
      }

      if (
        !parsedPlan ||
        !parsedPlan.name ||
        !parsedPlan.totalPrice
      ) {
        router.replace("/plans");
        return;
      }

      const matchedPlan = PLANS.find(
        (plan) =>
          plan.name.toLowerCase() ===
          String(parsedPlan?.name).toLowerCase()
      );

      const finalPlan: Plan = matchedPlan
        ? {
            ...matchedPlan,
            ...parsedPlan,
          }
        : parsedPlan;

      setSelectedPlan(finalPlan);

      /*
       * Existing activation ko sirf display ke liye load kar rahe hain.
       *
       * Important:
       * Yahan approved/pending activation ki wajah se
       * dashboard redirect nahi hoga.
       *
       * Is se plan select karne ke baad activation page
       * properly open rahega.
       */
      const {
        data: latestActivation,
        error: activationError,
      } = await supabase
        .from("activations")
        .select(
          "id,user_id,amount,currency,payment_method,payment_reference,status,created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (activationError) {
        console.error(
          "Activation fetch error:",
          activationError
        );
      }

      if (latestActivation) {
        setActivation(
          latestActivation as Activation
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "Page load nahi ho saki. Dobara try karein."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!isPakistan && method === "bank") {
      setMethod("crypto");
    }

    if (isPakistan && method === "crypto") {
      // Pakistan ke liye sirf bank transfer.
      setMethod("bank");
    }
  }, [isPakistan, method]);

  async function copyText(
    value: string,
    label: string
  ) {
    try {
      await navigator.clipboard.writeText(value);

      setCopied(label);

      window.setTimeout(() => {
        setCopied("");
      }, 1800);
    } catch {
      setError(
        "Copy nahi ho saka. Details manually copy karein."
      );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) return;

    setError("");

    if (!selectedPlan) {
      setError(
        "Plan select nahi hua. Plans page par wapas jayein."
      );
      return;
    }

    if (!country) {
      setError("Country select karein.");
      return;
    }

    /*
     * Pakistan = Bank Transfer only
     * International = USDT TRC20 only
     */
    if (isPakistan && method !== "bank") {
      setError(
        "Pakistan users ke liye sirf Bank Transfer available hai."
      );
      return;
    }

    if (!isPakistan && method !== "crypto") {
      setError(
        "International users ke liye sirf USDT TRC20 available hai."
      );
      return;
    }

    if (method === "bank") {
      if (!senderName.trim()) {
        setError("Sender name enter karein.");
        return;
      }

      if (!senderNumber.trim()) {
        setError(
          "Sender bank / mobile number enter karein."
        );
        return;
      }
    }

    if (!trxId.trim()) {
      setError(
        method === "crypto"
          ? "Transaction ID / TXID enter karein."
          : "Transaction reference enter karein."
      );
      return;
    }

    try {
      setSubmitting(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      /*
       * Existing pending activation check.
       *
       * Pending request milne par dashboard par redirect nahi
       * karna. User ko activation page par hi rehna hai.
       */
      const {
        data: pendingActivation,
        error: pendingError,
      } = await supabase
        .from("activations")
        .select(
          "id,user_id,amount,currency,payment_method,payment_reference,status,created_at"
        )
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (pendingError) {
        console.error(
          "Pending activation check:",
          pendingError
        );
      }

      if (pendingActivation) {
        setActivation(
          pendingActivation as Activation
        );

        localStorage.setItem(
          "earnNovaActivation",
          JSON.stringify(pendingActivation)
        );

        setError(
          "Aapki activation request already pending hai. EarnNova Team verification complete karegi."
        );

        return;
      }

      /*
       * Starter PKR discount:
       *
       * Normal:
       * $2.50 × 285 = Rs. 712.50
       *
       * Discounted:
       * Rs. 710
       *
       * Database amount USD mein hi rahega.
       */
      const activationData = {
        user_id: user.id,
        amount: Number(selectedPlan.totalPrice),
        currency: "USD",
        payment_method:
          method === "bank"
            ? "Bank Transfer"
            : "USDT TRC20",
        payment_reference: trxId.trim(),
        status: "pending",
      };

      const {
        data,
        error: insertError,
      } = await supabase
        .from("activations")
        .insert(activationData)
        .select(
          "id,user_id,amount,currency,payment_method,payment_reference,status,created_at"
        )
        .single();

      if (insertError) {
        console.error(
          "Activation insert error:",
          insertError
        );

        if (
          insertError.code === "23505" ||
          insertError.message
            ?.toLowerCase()
            .includes("duplicate")
        ) {
          setError(
            "Aapki activation request already submit ho chuki hai."
          );
        } else {
          setError(
            insertError.message ||
              "Activation request submit nahi ho saki."
          );
        }

        return;
      }

      localStorage.setItem(
        "earnNovaSelectedPlan",
        JSON.stringify(selectedPlan)
      );

      localStorage.setItem(
        "earnNovaActivation",
        JSON.stringify(data)
      );

      setActivation(data as Activation);

      /*
       * Activation submit ke baad dashboard par direct redirect
       * nahi karna. User activation page par hi rahega.
       */
      setError(
        "Activation request successfully submit ho gayi hai. EarnNova Team verification ke baad account activate karegi."
      );

      return;
    } catch (err) {
      console.error(
        "Activation submit error:",
        err
      );

      setError(
        "Kuch ghalat ho gaya. Dobara try karein."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050b16] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-xl" />

              <Loader2 className="relative h-10 w-10 animate-spin text-blue-500" />
            </div>

            <p className="text-sm text-slate-400">
              Activation page load ho rahi hai...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!selectedPlan) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#050b16] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-150px] top-[-150px] h-[400px] w-[400px] rounded-full bg-blue-600/10 blur-[100px]" />

        <div className="absolute right-[-150px] top-[20%] h-[350px] w-[350px] rounded-full bg-cyan-500/10 blur-[100px]" />

        <div className="absolute bottom-[-150px] left-[30%] h-[350px] w-[350px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <header className="relative z-10 border-b border-white/10 bg-[#07101f]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Brand />

          <button
            type="button"
            onClick={() => router.push("/plans")}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />

            <span className="hidden sm:inline">
              Back to Plans
            </span>

            <span className="sm:hidden">
              Back
            </span>
          </button>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-400">
            <ShieldCheck className="h-3.5 w-3.5" />

            Secure Activation
          </div>

          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Activate your{" "}
            <span className="text-blue-500">
              {selectedPlan.name}
            </span>{" "}
            plan
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Payment submit karein aur EarnNova Team
            aapki activation verify karegi.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          {/* PLAN CARD */}
          <div className="h-fit rounded-3xl border border-white/10 bg-[#0a1424]/90 p-6 shadow-2xl shadow-black/20">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Selected Plan
                </p>

                <h3 className="mt-1 text-2xl font-black">
                  {selectedPlan.name}
                </h3>
              </div>

              <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
                <Wallet className="h-6 w-6" />
              </div>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.07] p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Amount
              </p>

              <div className="mt-1 flex items-end gap-2">
                <span className="text-4xl font-black">
                  {formatUsd(selectedPlan.totalPrice)}
                </span>

                <span className="pb-1 text-sm text-slate-400">
                  USD
                </span>
              </div>

              {isPakistan &&
                selectedPlan.name === "Starter" && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-500 line-through">
                      Normal: Rs.{" "}
                      {normalPkrAmount.toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }
                      )}
                    </p>

                    <p className="mt-1 text-sm font-bold text-emerald-400">
                      Discounted: Rs.{" "}
                      {pkrAmount.toLocaleString()} PKR
                    </p>
                  </div>
                )}

              {isPakistan &&
                selectedPlan.name !== "Starter" && (
                  <p className="mt-2 text-xs text-slate-500">
                    Approx. Rs.{" "}
                    {pkrAmount.toLocaleString()} PKR
                  </p>
                )}
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-sm text-slate-400">
                  Plan price
                </span>

                <span className="text-sm font-bold text-white">
                  {formatUsd(
                    selectedPlan.totalPrice
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-sm text-slate-400">
                  Duration
                </span>

                <span className="text-sm font-bold text-white">
                  3 months
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-sm text-slate-400">
                  Daily tasks
                </span>

                <span className="text-sm font-bold text-white">
                  10
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">
                  Daily videos
                </span>

                <span className="text-sm font-bold text-white">
                  50
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/5 bg-black/20 p-4">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />

                <div>
                  <p className="text-sm font-bold text-white">
                    Verification required
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Payment submit hone ke baad
                    EarnNova Team transaction
                    verify karegi.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* PAYMENT CARD */}
          <div className="rounded-3xl border border-white/10 bg-[#0a1424]/90 p-6 shadow-2xl shadow-black/20 sm:p-7">
            <div className="mb-7">
              <h3 className="text-xl font-black">
                Payment Details
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Apni payment method select karein.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* COUNTRY */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-200">
                  Country
                </label>

                <select
                  value={country}
                  onChange={(e) => {
                    const value = e.target.value;

                    setCountry(value);

                    if (value === "Pakistan") {
                      setMethod("bank");
                    } else if (value) {
                      setMethod("crypto");
                    } else {
                      setMethod("");
                    }
                  }}
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#07101f] px-4 text-sm text-white outline-none transition focus:border-blue-500"
                >
                  <option
                    value=""
                    className="bg-[#07101f]"
                  >
                    Select country
                  </option>

                  {COUNTRIES.map((item) => (
                    <option
                      key={item}
                      value={item}
                      className="bg-[#07101f]"
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              {/* PAYMENT METHOD */}
              {country && (
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-200">
                    Payment Method
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* BANK TRANSFER */}
                    {isPakistan && (
                      <button
                        type="button"
                        onClick={() =>
                          setMethod("bank")
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          method === "bank"
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-white/10 bg-black/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
                            <CreditCard className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="text-sm font-bold text-white">
                              Bank Transfer
                            </p>

                            <p className="text-xs text-slate-500">
                              Pakistan only
                            </p>
                          </div>
                        </div>
                      </button>
                    )}

                    {/* CRYPTO */}
                    {!isPakistan && (
                      <button
                        type="button"
                        onClick={() =>
                          setMethod("crypto")
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          method === "crypto"
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-white/10 bg-black/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-400">
                            <Wallet className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="text-sm font-bold text-white">
                              USDT TRC20
                            </p>

                            <p className="text-xs text-slate-500">
                              International only
                            </p>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* BANK PAYMENT */}
              {method === "bank" &&
                isPakistan && (
                  <div className="space-y-4 rounded-2xl border border-blue-500/10 bg-blue-500/[0.04] p-4">
                    <div>
                      <p className="mb-3 text-sm font-black text-white">
                        Bank Transfer Payment
                      </p>

                      <div className="space-y-3">
                        {/* ACCOUNT */}
                        <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Account
                          </p>

                          <p className="mt-1 text-sm font-bold text-white">
                            {BANK_ACCOUNT}
                          </p>
                        </div>

                        {/* ACCOUNT TITLE */}
                        <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Account Title
                          </p>

                          <p className="mt-1 text-sm font-bold text-white">
                            {BANK_ACCOUNT_TITLE}
                          </p>
                        </div>

                        {/* IBAN */}
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/20 p-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                              IBAN
                            </p>

                            <p className="mt-1 break-all text-sm font-bold text-white">
                              {BANK_IBAN}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                BANK_IBAN,
                                "bank"
                              )
                            }
                            className="shrink-0 rounded-lg border border-white/10 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                          >
                            {copied === "bank" ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SENDER NAME */}
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-200">
                        Sender Name
                      </label>

                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) =>
                          setSenderName(
                            e.target.value
                          )
                        }
                        placeholder="Payment sender name"
                        className="h-12 w-full rounded-xl border border-white/10 bg-[#07101f] px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                      />
                    </div>

                    {/* SENDER NUMBER */}
                    <div>
                      <label className="mb-2 block text-sm font-bold text-slate-200">
                        Sender Bank / Mobile
                      </label>

                      <input
                        type="text"
                        value={senderNumber}
                        onChange={(e) =>
                          setSenderNumber(
                            e.target.value
                          )
                        }
                        placeholder="Bank account / mobile number"
                        className="h-12 w-full rounded-xl border border-white/10 bg-[#07101f] px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

              {/* CRYPTO PAYMENT */}
              {method === "crypto" && !isPakistan && (
                <div className="space-y-4 rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.04] p-4">
                  <div>
                    <p className="text-sm font-black text-white">
                      USDT TRC20 Payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Sirf USDT TRC20 network use
                      karein.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-black/20 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      USDT TRC20 Wallet
                    </p>

                    <div className="mt-2 flex items-start gap-3">
                      <p className="min-w-0 flex-1 break-all text-xs font-bold leading-5 text-white">
                        TAWgQk5vdz964jxps2nYjTAj6c8WRpp4hb
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            "TAWgQk5vdz964jxps2nYjTAj6c8WRpp4hb",
                            "crypto"
                          )
                        }
                        className="shrink-0 rounded-lg border border-white/10 p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
                      >
                        {copied === "crypto" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3">
                    <p className="text-xs leading-5 text-amber-300">
                      Network carefully check karein.
                      TRC20 ke ilawa kisi network par
                      payment na bhejein.
                    </p>
                  </div>
                </div>
              )}

              {/* TRANSACTION ID */}
              {method && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-200">
                      {method === "crypto"
                        ? "Transaction ID / TXID"
                        : "Transaction Reference"}
                    </label>

                    <input
                      type="text"
                      value={trxId}
                      onChange={(e) =>
                        setTrxId(e.target.value)
                      }
                      placeholder={
                        method === "crypto"
                          ? "Enter your TXID"
                          : "Enter transaction reference"
                      }
                      className="h-12 w-full rounded-xl border border-white/10 bg-[#07101f] px-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>

                  {/* NOTE */}
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-200">
                      Note{" "}
                      <span className="font-normal text-slate-600">
                        (optional)
                      </span>
                    </label>

                    <textarea
                      value={note}
                      onChange={(e) =>
                        setNote(e.target.value)
                      }
                      rows={3}
                      placeholder="Optional payment note..."
                      className="w-full resize-none rounded-xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={
                  submitting || !method
                }
                className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Submit Activation
                  </>
                )}
              </button>

              <p className="text-center text-[11px] leading-5 text-slate-600">
                Submit karne ke baad request verification
                ke liye EarnNova Team ko chali jayegi.
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}