"use client";

import { useState } from "react";

/* =====================================================
   ICONS
===================================================== */

function LogoMark() {
  return (
    <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
      <div className="absolute inset-1 rounded-lg border border-white/20" />

      <div className="absolute h-7 w-7 rounded-full border border-white/30" />

      <div className="absolute h-5 w-5 rounded-full border border-white/30" />

      <span className="relative z-10 text-lg font-black italic text-white">
        EN
      </span>

      <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 7V6a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v8a2 2 0 0 1-2 2H5a3 3 0 0 1-3-3V7" />
      <path d="M16 14h.01" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13" />
      <path d="M3 12h18" />
      <path d="M12 8H7.5a2.5 2.5 0 1 1 0-5C11 3 12 8 12 8Z" />
      <path d="M12 8h4.5a2.5 2.5 0 1 0 0-5C13 3 12 8 12 8Z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

/* =====================================================
   MAIN PAGE
===================================================== */

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#070b10] text-white">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/[0.07] bg-[#070b10]/90 backdrop-blur-xl">

        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">

          {/* LOGO */}

          <a href="#" className="flex items-center gap-3">

            <LogoMark />

            <div className="leading-none">

              <div className="flex items-center gap-1.5 text-xl font-black tracking-tight">

                <span className="text-white">
                  Earn
                </span>

                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Nova
                </span>

              </div>

              <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.25em] text-slate-600">
                Earn • Grow • Repeat
              </div>

            </div>

          </a>

          {/* DESKTOP NAV */}

          <nav className="hidden items-center gap-8 md:flex">

            <a
              href="#features"
              className="text-sm font-semibold text-slate-400 transition hover:text-blue-400"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-semibold text-slate-400 transition hover:text-blue-400"
            >
              How It Works
            </a>

            <a
              href="#activation"
              className="text-sm font-semibold text-slate-400 transition hover:text-blue-400"
            >
              Activation
            </a>

            <a
              href="#about"
              className="text-sm font-semibold text-slate-400 transition hover:text-blue-400"
            >
              About
            </a>

          </nav>

          {/* DESKTOP BUTTONS */}

          <div className="hidden items-center gap-3 md:flex">

            {/* LOGIN */}

            <a
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
            >
              Login
            </a>

            {/* GET STARTED */}

            <a
              href="/signup"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              Get Started
            </a>

          </div>

          {/* MOBILE */}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-slate-300 md:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

        </div>

        {/* MOBILE MENU */}

        {menuOpen && (

          <div className="border-t border-white/[0.07] bg-[#0a0f15] px-5 py-5 md:hidden">

            <div className="flex flex-col gap-4">

              {[
                ["#features", "Features"],
                ["#how-it-works", "How It Works"],
                ["#activation", "Activation"],
                ["#about", "About"],
              ].map(([href, label]) => (

                <a
                  key={label}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="font-semibold text-slate-300"
                >
                  {label}
                </a>

              ))}

              <div className="mt-2 border-t border-white/[0.07] pt-4">

                {/* MOBILE LOGIN */}

                <a
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block py-2 font-semibold text-slate-300"
                >
                  Login
                </a>

                {/* MOBILE GET STARTED */}

                <a
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 block rounded-xl bg-blue-600 px-5 py-3 text-center font-bold text-white"
                >
                  Get Started
                </a>

              </div>

            </div>

          </div>

        )}

      </header>

      {/* =================================================
          HERO
      ================================================= */}

      <section className="relative overflow-hidden bg-[#070b10] pt-32">

        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 lg:grid-cols-2 lg:px-8 lg:pb-28">

          {/* HERO TEXT */}

          <div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/[0.06] px-4 py-2 text-xs font-bold text-blue-400">

              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />

              A smarter way to earn online

            </div>

            <h1 className="max-w-2xl text-5xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">

              Turn your time into{" "}

              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                real rewards.
              </span>

            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">

              Earn Nova gives you simple ways to earn through tasks,
              surveys, daily rewards and referrals — all from one
              professional platform.

            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">

              <a
                href="/signup"
                className="inline-flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-7 py-4 font-bold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-1 hover:bg-blue-500"
              >
                Start Earning
                <ArrowIcon />
              </a>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-4 font-bold text-slate-200 transition hover:-translate-y-1 hover:border-blue-500/30 hover:bg-white/[0.07]"
              >
                See How It Works
              </a>

            </div>

            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-semibold">

              <div className="flex items-center gap-2 text-emerald-400">
                <CheckIcon />
                Secure platform
              </div>

              <div className="flex items-center gap-2 text-emerald-400">
                <CheckIcon />
                Easy withdrawals
              </div>

              <div className="flex items-center gap-2 text-emerald-400">
                <CheckIcon />
                Referral rewards
              </div>

            </div>

          </div>

          {/* DASHBOARD PREVIEW */}

          <div className="relative">

            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-r from-blue-600/10 to-cyan-400/10 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#11161d] p-4 shadow-2xl shadow-black/40 sm:p-6">

              {/* BALANCE */}

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <p className="text-xs font-semibold text-slate-500">
                    Available Balance
                  </p>

                  <p className="mt-1 text-3xl font-black text-white">
                    $128.40
                  </p>

                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                  <WalletIcon />
                </div>

              </div>

              {/* EARNINGS */}

              <div className="rounded-2xl bg-[#070b10] p-5">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-xs text-slate-500">
                      Today's Earnings
                    </p>

                    <p className="mt-1 text-2xl font-black">
                      $14.25
                    </p>

                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                    +18.4%
                  </span>

                </div>

                <div className="mt-7 flex h-28 items-end gap-2">

                  {[35, 48, 42, 65, 55, 78, 69, 91, 75, 100, 86, 96].map(
                    (height, index) => (

                      <div
                        key={index}
                        className="flex-1 rounded-t-lg bg-gradient-to-t from-blue-700 to-cyan-400"
                        style={{
                          height: `${height}%`,
                        }}
                      />

                    )
                  )}

                </div>

              </div>

              {/* STATS */}

              <div className="mt-4 grid grid-cols-2 gap-4">

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">

                  <p className="text-xs font-semibold text-slate-500">
                    Referrals
                  </p>

                  <p className="mt-1 text-xl font-black text-white">
                    24
                  </p>

                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">

                  <p className="text-xs font-semibold text-slate-500">
                    Completed Tasks
                  </p>

                  <p className="mt-1 text-xl font-black text-white">
                    186
                  </p>

                </div>

              </div>

              {/* ACTIVATION */}

              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-500/10 bg-amber-500/[0.05] p-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                  <ShieldIcon />
                </div>

                <div>

                  <p className="text-sm font-black text-white">
                    Activation Required
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Activate your account to unlock earning features.
                  </p>

                </div>

              </div>

            </div>

            {/* FLOATING REWARD */}

            <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-white/[0.08] bg-[#11161d] p-4 shadow-xl sm:block">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CheckIcon />
                </div>

                <div>

                  <p className="text-xs font-bold text-slate-500">
                    Reward received
                  </p>

                  <p className="font-black text-white">
                    +$4.80
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          ACTIVATION
      ================================================= */}

      <section
        id="activation"
        className="px-5 py-8 lg:px-8"
      >

        <div className="mx-auto max-w-7xl">

          <div className="relative overflow-hidden rounded-3xl border border-blue-500/10 bg-gradient-to-r from-blue-600/[0.08] via-[#11161d] to-cyan-500/[0.06] p-6 sm:p-7">

            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                  <ShieldIcon />
                </div>

                <div>

                  <div className="flex flex-wrap items-center gap-2">

                    <h3 className="text-lg font-black text-white">
                      Account Activation Required
                    </h3>

                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-amber-400">
                      Required
                    </span>

                  </div>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    Complete your account activation before accessing
                    earning features.
                  </p>

                </div>

              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3">

                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />

                <span className="text-sm font-bold text-slate-300">
                  Activation Required
                </span>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          STATS
      ================================================= */}

      <section className="border-y border-white/[0.06] bg-[#0a0f15]">

        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/[0.06] lg:grid-cols-4">

          {[
            ["10K+", "Members"],
            ["$500K+", "Rewards Earned"],
            ["50K+", "Tasks Completed"],
            ["24/7", "Platform Access"],
          ].map(([number, label]) => (

            <div
              key={label}
              className="px-5 py-8 text-center"
            >

              <p className="text-3xl font-black text-white">
                {number}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                {label}
              </p>

            </div>

          ))}

        </div>

      </section>

      {/* =================================================
          FEATURES
      ================================================= */}

      <section
        id="features"
        className="px-5 py-24 lg:px-8"
      >

        <div className="mx-auto max-w-7xl">

          <div className="mx-auto max-w-2xl text-center">

            <span className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">
              Everything in one place
            </span>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Multiple ways to grow your earnings
            </h2>

            <p className="mt-5 text-lg leading-8 text-slate-500">
              Choose the earning methods that work best for you.
            </p>

          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            {[
              {
                title: "Complete Tasks",
                text: "Finish simple online tasks and receive rewards.",
                icon: <CheckIcon />,
              },
              {
                title: "Paid Surveys",
                text: "Share your opinion and earn from available surveys.",
                icon: <WalletIcon />,
              },
              {
                title: "Daily Rewards",
                text: "Come back every day and unlock additional rewards.",
                icon: <GiftIcon />,
              },
              {
                title: "Referral Program",
                text: "Invite friends and earn through your referral network.",
                icon: <UsersIcon />,
              },
            ].map((item) => (

              <div
                key={item.title}
                className="group rounded-3xl border border-white/[0.07] bg-[#11161d] p-7 transition hover:-translate-y-1 hover:border-blue-500/30 hover:bg-[#131a22]"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 transition group-hover:bg-blue-600 group-hover:text-white">
                  {item.icon}
                </div>

                <h3 className="mt-6 text-xl font-black text-white">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {item.text}
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm font-bold text-blue-400">
                  Learn more
                  <ArrowIcon />
                </div>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* =================================================
          HOW IT WORKS
      ================================================= */}

      <section
        id="how-it-works"
        className="bg-[#0a0f15] px-5 py-24 lg:px-8"
      >

        <div className="mx-auto max-w-7xl">

          <div className="text-center">

            <span className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">
              Simple Process
            </span>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-white">
              Start earning in 3 steps
            </h2>

          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">

            {[
              [
                "01",
                "Create Account",
                "Register your Earn Nova account in minutes.",
              ],
              [
                "02",
                "Activate Account",
                "Complete the required account activation process.",
              ],
              [
                "03",
                "Earn & Withdraw",
                "Once activated, complete available activities and request withdrawals.",
              ],
            ].map(([number, title, text]) => (

              <div
                key={number}
                className="relative rounded-3xl border border-white/[0.07] bg-[#11161d] p-8"
              >

                <div className="text-5xl font-black text-blue-500/10">
                  {number}
                </div>

                <h3 className="mt-4 text-2xl font-black text-white">
                  {title}
                </h3>

                <p className="mt-3 leading-7 text-slate-500">
                  {text}
                </p>

              </div>

            ))}

          </div>

        </div>

      </section>

      {/* =================================================
          ABOUT
      ================================================= */}

      <section
        id="about"
        className="px-5 py-24 lg:px-8"
      >

        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">

          <div>

            <span className="text-sm font-black uppercase tracking-[0.2em] text-blue-400">
              Why Earn Nova
            </span>

            <h2 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Built to make online earning simple.
            </h2>

            <p className="mt-6 text-lg leading-8 text-slate-500">
              No complicated systems. Just a clean dashboard, clear earning
              opportunities and a straightforward wallet experience.
            </p>

            <div className="mt-8 space-y-5">

              {[
                "Professional and easy-to-use dashboard",
                "Multiple earning opportunities",
                "Transparent wallet and withdrawal system",
                "Referral rewards",
                "Account security and verification",
              ].map((item) => (

                <div
                  key={item}
                  className="flex items-center gap-3"
                >

                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                    <CheckIcon />
                  </div>

                  <span className="font-semibold text-slate-400">
                    {item}
                  </span>

                </div>

              ))}

            </div>

          </div>

          {/* SECURITY CARD */}

          <div className="rounded-[2rem] border border-white/[0.07] bg-[#11161d] p-7 shadow-2xl sm:p-9">

            <div className="flex items-center gap-4">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <ShieldIcon />
              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Security
                </p>

                <h3 className="text-xl font-black text-white">
                  Your account matters
                </h3>

              </div>

            </div>

            <p className="mt-7 leading-7 text-slate-500">
              Earn Nova is designed with account verification, secure
              authentication and controlled withdrawal processing in mind.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">

                <p className="text-2xl font-black text-white">
                  24/7
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Access
                </p>

              </div>

              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5">

                <p className="text-2xl font-black text-white">
                  Secure
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Account system
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          CTA
      ================================================= */}

      <section className="px-5 py-24 lg:px-8">

        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-blue-400/20 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 px-7 py-14 text-center shadow-2xl shadow-blue-900/30 sm:px-12">

          <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
            Ready to start your earning journey?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/70">
            Create your account, complete activation and explore the
            Earn Nova earning ecosystem.
          </p>

          <div className="mt-8 flex justify-center">

            <a
              href="/signup"
              className="rounded-2xl bg-white px-7 py-4 font-black text-blue-700 transition hover:-translate-y-1 hover:bg-slate-100"
            >
              Create Account
            </a>

          </div>

        </div>

      </section>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="border-t border-white/[0.06] bg-[#05080c]">

        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">

          <div className="flex items-center gap-3">

            <LogoMark />

            <div>

              <div className="flex items-center gap-1.5 font-black">

                <span className="text-white">
                  Earn
                </span>

                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Nova
                </span>

              </div>

              <p className="text-xs text-slate-600">
                Earn • Grow • Repeat
              </p>

            </div>

          </div>

          <div className="flex flex-wrap gap-5 text-sm font-semibold text-slate-600">

            <a
              href="/privacy"
              className="transition hover:text-blue-400"
            >
              Privacy
            </a>

            <a
              href="/terms"
              className="transition hover:text-blue-400"
            >
              Terms
            </a>

            <a
              href="/contact"
              className="transition hover:text-blue-400"
            >
              Contact
            </a>

          </div>

          <p className="text-sm text-slate-700">
            © 2026 Earn Nova. All rights reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}