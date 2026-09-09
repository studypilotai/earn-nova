"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Crown,
  Gem,
  Medal,
  Sparkles,
  Zap,
  ShieldCheck,
  Check,
  PlayCircle,
  ListTodo,
} from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: 2.5,
    tasks: "10–20",
    videos: "40–60",
    description: "A simple start for new members",
    icon: Medal,
    popular: false,
  },
  {
    name: "Basic",
    price: 5,
    tasks: "20–40",
    videos: "80–120",
    description: "More opportunities to earn",
    icon: Zap,
    popular: false,
  },
  {
    name: "Pro",
    price: 10,
    tasks: "30–60",
    videos: "160–240",
    description: "More earning opportunities",
    icon: Crown,
    popular: true,
  },
  {
    name: "Premium",
    price: 20,
    tasks: "50–80",
    videos: "280–420",
    description: "For active members",
    icon: Gem,
    popular: false,
  },
  {
    name: "VIP",
    price: 50,
    tasks: "70–100",
    videos: "400–600",
    description: "Maximum access and opportunities",
    icon: Sparkles,
    popular: false,
  },
];

const PLAN_DURATION_MONTHS = 3;

export default function PlansPage() {
  const router = useRouter();

  const handleSelectPlan = (plan: (typeof plans)[number]) => {
    const totalPrice = plan.price;

    localStorage.setItem(
      "earnNovaSelectedPlan",
      JSON.stringify({
        name: plan.name,
        monthlyPrice: plan.price,
        totalPrice,
        months: PLAN_DURATION_MONTHS,
        taskRange: plan.tasks,
        videoRange: plan.videos,
      })
    );

    router.push("/activate");
  };

  return (
    <main className="min-h-screen bg-[#070b14] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto max-w-4xl">

        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:border-blue-500/30 hover:bg-blue-500/[0.06] hover:text-white"
          >
            <ArrowLeft
              size={15}
              className="transition-transform group-hover:-translate-x-0.5"
            />
            Dashboard
          </Link>

          <div className="text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-blue-400/70">
              EarnNova
            </p>

            <p className="mt-0.5 text-sm font-bold text-white">
              Membership
            </p>
          </div>
        </div>

        {/* HERO */}
        <section className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400 shadow-lg shadow-blue-500/5">
            <Crown size={22} />
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Choose Your{" "}
            <span className="text-blue-400">Plan</span>
          </h1>

          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
            Select a membership that matches your earning activity.
          </p>
        </section>

        {/* MEMBERSHIP BADGE */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/[0.06] px-4 py-2">
            <ShieldCheck size={14} className="text-blue-400" />

            <span className="text-[10px] font-bold text-slate-300">
              3-Month Membership
            </span>

            <span className="h-1 w-1 rounded-full bg-slate-600" />

            <span className="text-[10px] text-slate-500">
              One-time payment
            </span>
          </div>
        </div>

        {/* PLANS */}
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((plan) => {
            const Icon = plan.icon;

            return (
              <div
                key={plan.name}
                className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 ${
                  plan.popular
                    ? "border-blue-500/40 bg-gradient-to-br from-blue-500/[0.10] via-white/[0.035] to-white/[0.02] shadow-xl shadow-blue-950/20"
                    : "border-white/10 bg-white/[0.035] hover:border-blue-500/20 hover:bg-white/[0.05]"
                }`}
              >
                {/* DECORATIVE GLOW */}
                {plan.popular && (
                  <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
                )}

                {/* RECOMMENDED */}
                {plan.popular && (
                  <div className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-blue-400/20 bg-blue-500/10 px-2.5 py-1">
                    <Sparkles size={10} className="text-blue-400" />

                    <span className="text-[8px] font-black uppercase tracking-wider text-blue-300">
                      Recommended
                    </span>
                  </div>
                )}

                {/* PLAN HEADER */}
                <div className="relative flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                      plan.popular
                        ? "border-blue-500/20 bg-blue-500/10 text-blue-400"
                        : "border-white/10 bg-white/[0.05] text-slate-300"
                    }`}
                  >
                    <Icon size={21} />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      EarnNova
                    </p>

                    <h2 className="mt-0.5 text-lg font-black text-white">
                      {plan.name}
                    </h2>
                  </div>
                </div>

                {/* PRICE */}
                <div className="relative mt-5">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black tracking-tight">
                      ${plan.price}
                    </span>

                    <span className="mb-1 text-[10px] font-medium text-slate-500">
                      / 3 months
                    </span>
                  </div>

                  <p className="mt-1 text-[10px] text-slate-500">
                    {plan.description}
                  </p>
                </div>

                {/* TASK + VIDEO ACCESS */}
                <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">

                  {/* TASKS */}
                  <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                        <ListTodo
                          size={14}
                          className="text-blue-400"
                        />
                      </div>

                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Tasks
                      </span>
                    </div>

                    <p className="text-sm font-black text-white">
                      {plan.tasks}
                    </p>

                    <p className="mt-0.5 text-[8px] text-slate-600">
                      Daily opportunities
                    </p>
                  </div>

                  {/* VIDEOS */}
                  <div className="rounded-xl border border-white/5 bg-black/20 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                        <PlayCircle
                          size={14}
                          className="text-blue-400"
                        />
                      </div>

                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Videos
                      </span>
                    </div>

                    <p className="text-sm font-black text-white">
                      {plan.videos}
                    </p>

                    <p className="mt-0.5 text-[8px] text-slate-600">
                      Daily opportunities
                    </p>
                  </div>
                </div>

                {/* FEATURES */}
                <div className="relative mt-4 space-y-2 border-t border-white/10 pt-4">

                  <div className="flex items-center gap-2.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10">
                      <Check
                        size={11}
                        className="text-blue-400"
                      />
                    </div>

                    <span className="text-[10px] text-slate-400">
                      Separate task & video access
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10">
                      <Check
                        size={11}
                        className="text-blue-400"
                      />
                    </div>

                    <span className="text-[10px] text-slate-400">
                      3-month membership access
                    </span>
                  </div>
                </div>

                {/* SELECT BUTTON */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  className={`relative mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${
                    plan.popular
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-500"
                      : "border border-white/10 bg-white/[0.07] text-white hover:border-blue-500/20 hover:bg-blue-500/[0.08]"
                  }`}
                >
                  Select {plan.name}

                  <ArrowRight
                    size={14}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* INFORMATION */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <ShieldCheck size={17} />
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-300">
                Membership Information
              </p>

              <p className="mt-1 text-[9px] leading-5 text-slate-600">
                Your selected membership remains active for 3 months.
                Task and video availability may vary according to your
                selected membership and platform availability.
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="py-6 text-center">
          <p className="text-[9px] text-slate-600">
            Choose a membership to continue to activation.
          </p>
        </div>

      </div>
    </main>
  );
}