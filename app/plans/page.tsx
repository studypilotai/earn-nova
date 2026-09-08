"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Gem,
  Medal,
  Sparkles,
  Zap,
  ArrowRight,
} from "lucide-react";

const plans = [
  {
    name: "Bronze",
    price: 5,
    dailyTasks: 10,
    dailyEarning: "0.30",
    icon: Medal,
    popular: false,
  },
  {
    name: "Silver",
    price: 10,
    dailyTasks: 20,
    dailyEarning: "0.70",
    icon: Zap,
    popular: true,
  },
  {
    name: "Gold",
    price: 25,
    dailyTasks: 40,
    dailyEarning: "2.00",
    icon: Crown,
    popular: false,
  },
  {
    name: "Platinum",
    price: 50,
    dailyTasks: 60,
    dailyEarning: "4.50",
    icon: Gem,
    popular: false,
  },
  {
    name: "Diamond",
    price: 100,
    dailyTasks: 100,
    dailyEarning: "10.00",
    icon: Sparkles,
    popular: false,
  },
];

const PLAN_DURATION_MONTHS = 3;

export default function PlansPage() {
  const router = useRouter();

  const handleSelectPlan = (
    plan: (typeof plans)[number]
  ) => {
    // Price is the TOTAL price for 3 months.
    // No multiplication.
    const totalPrice = plan.price;

    localStorage.setItem(
      "earnNovaSelectedPlan",
      JSON.stringify({
        name: plan.name,
        monthlyPrice: plan.price,
        totalPrice: totalPrice,
        months: PLAN_DURATION_MONTHS,
        dailyTasks: plan.dailyTasks,
        dailyEarning: plan.dailyEarning,
      })
    );

    router.push("/activate");
  };

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">

        {/* HEADER */}

        <div className="mb-6 flex items-center justify-between">

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.08]"
          >
            <ArrowLeft size={15} />
            Dashboard
          </Link>

          <div className="text-right">

            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
              EarnNova
            </p>

            <p className="text-sm font-bold">
              Membership Plans
            </p>

          </div>

        </div>

        {/* TITLE */}

        <div className="mb-6 text-center">

          <h1 className="text-2xl font-black sm:text-3xl">
            Choose Your{" "}
            <span className="text-blue-400">
              Plan
            </span>
          </h1>

          <p className="mt-2 text-xs text-slate-500">
            One-time fee • Valid for 3 months
          </p>

        </div>

        {/* FIXED 3 MONTH NOTICE */}

        <div className="mb-5 rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-4">

          <div className="flex items-center justify-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Crown size={19} />
            </div>

            <div>

              <p className="text-xs font-black text-white">
                3 Month Membership
              </p>

              <p className="mt-1 text-[9px] text-slate-500">
                Plan price includes the complete 3-month period
              </p>

            </div>

          </div>

        </div>

        {/* PLANS */}

        <div className="space-y-3">

          {plans.map((plan) => {
            const Icon = plan.icon;

            // IMPORTANT:
            // plan.price is already the total 3-month fee.
            const totalPrice = plan.price;

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-4 transition ${
                  plan.popular
                    ? "border-blue-500/50 bg-blue-500/[0.07]"
                    : "border-white/10 bg-white/[0.035] hover:border-white/20"
                }`}
              >

                {/* POPULAR */}

                {plan.popular && (
                  <span className="absolute right-3 top-3 rounded-full bg-blue-600 px-2.5 py-1 text-[8px] font-bold uppercase tracking-wider">
                    Popular
                  </span>
                )}

                <div className="flex items-center gap-4">

                  {/* ICON */}

                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      plan.popular
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-white/[0.06] text-slate-300"
                    }`}
                  >
                    <Icon size={21} />
                  </div>

                  {/* PLAN NAME + TOTAL PRICE */}

                  <div className="min-w-[105px]">

                    <h2 className="text-base font-black">
                      {plan.name}
                    </h2>

                    <p className="mt-0.5 text-lg font-bold text-white">
                      ${plan.price}

                      <span className="ml-1 text-[9px] font-medium text-slate-500">
                        / 3 months
                      </span>
                    </p>

                  </div>

                  {/* STATS */}

                  <div className="hidden flex-1 items-center justify-center gap-8 sm:flex">

                    <div>

                      <p className="text-[8px] uppercase text-slate-500">
                        Tasks
                      </p>

                      <p className="mt-1 text-sm font-bold">
                        {plan.dailyTasks}
                      </p>

                    </div>

                    <div>

                      <p className="text-[8px] uppercase text-slate-500">
                        Daily Earn
                      </p>

                      <p className="mt-1 text-sm font-bold text-emerald-400">
                        ${plan.dailyEarning}
                      </p>

                    </div>

                    <div>

                      <p className="text-[8px] uppercase text-slate-500">
                        Total
                      </p>

                      <p className="mt-1 text-sm font-bold text-blue-400">
                        ${totalPrice}
                      </p>

                    </div>

                  </div>

                  {/* BUTTON */}

                  <button
                    onClick={() =>
                      handleSelectPlan(plan)
                    }
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-[10px] font-bold transition ${
                      plan.popular
                        ? "bg-blue-600 text-white hover:bg-blue-500"
                        : "bg-white/[0.08] text-white hover:bg-white/[0.13]"
                    }`}
                  >
                    Select
                    <ArrowRight size={13} />
                  </button>

                </div>

                {/* MOBILE STATS */}

                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 sm:hidden">

                  <div className="rounded-lg bg-black/20 p-2 text-center">

                    <p className="text-[8px] text-slate-500">
                      Tasks
                    </p>

                    <p className="mt-1 text-xs font-bold">
                      {plan.dailyTasks}
                    </p>

                  </div>

                  <div className="rounded-lg bg-black/20 p-2 text-center">

                    <p className="text-[8px] text-slate-500">
                      Daily
                    </p>

                    <p className="mt-1 text-xs font-bold text-emerald-400">
                      ${plan.dailyEarning}
                    </p>

                  </div>

                  <div className="rounded-lg bg-black/20 p-2 text-center">

                    <p className="text-[8px] text-slate-500">
                      3 Months
                    </p>

                    <p className="mt-1 text-xs font-bold text-blue-400">
                      ${totalPrice}
                    </p>

                  </div>

                </div>

                {/* VALIDITY */}

                <div className="mt-2 flex items-center justify-end gap-1">

                  <span className="text-[8px] text-slate-600">
                    Valid for
                  </span>

                  <span className="text-[8px] font-bold text-slate-400">
                    3 Months
                  </span>

                </div>

              </div>
            );
          })}

        </div>

        {/* RENEWAL INFO */}

        <div className="mt-5 rounded-2xl border border-amber-500/10 bg-amber-500/[0.04] p-4 text-center">

          <p className="text-[10px] font-bold text-amber-400">
            Membership Renewal
          </p>

          <p className="mt-1 text-[9px] leading-5 text-slate-600">
            Your membership is valid for 3 months.
            After expiry, you will need to renew your
            plan to continue using earning features.
          </p>

        </div>

        {/* FOOTER */}

        <p className="py-6 text-center text-[9px] text-slate-600">
          Select a plan to continue to activation.
        </p>

      </div>
    </main>
  );
}