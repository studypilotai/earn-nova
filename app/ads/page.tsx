"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ChevronUp,
  CircleDollarSign,
  ExternalLink,
  Gift,
  Menu,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type AdSlot = {
  id: string;
  position:
    | "hero"
    | "top"
    | "middle"
    | "content"
    | "bottom"
    | "footer";
  enabled: boolean;
};

/* =========================================================
   AD CONFIG
   ---------------------------------------------------------
   100+ configurable slots are supported.
   Only selected slots are rendered at once so the page
   does not become overloaded with advertisements.
========================================================= */

const AD_SLOTS: AdSlot[] = Array.from({ length: 120 }, (_, index) => ({
  id: `earnnova-ad-${String(index + 1).padStart(3, "0")}`,
  position:
    index === 0
      ? "hero"
      : index === 1
        ? "top"
        : index % 4 === 0
          ? "middle"
          : index === 119
            ? "footer"
            : "content",
  enabled: index < 5,
}));

/* =========================================================
   MAIN PAGE
========================================================= */

export default function AdsPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 500);
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const activeAds = useMemo(
    () => AD_SLOTS.filter((slot) => slot.enabled),
    [],
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#05080d] text-white">
      {/* =====================================================
          BACKGROUND GLOW
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-220px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/[0.10] blur-[120px]" />

        <div className="absolute -left-40 top-[35%] h-[400px] w-[400px] rounded-full bg-cyan-500/[0.05] blur-[120px]" />

        <div className="absolute -right-40 top-[60%] h-[500px] w-[500px] rounded-full bg-blue-500/[0.05] blur-[130px]" />
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#05080d]/85 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-blue-400/25 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 shadow-[0_0_30px_rgba(37,99,235,0.28)]">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shine_2.8s_ease-in-out_infinite]" />

              <span className="relative text-sm font-black tracking-tight text-white">
                EN
              </span>
            </div>

            <div>
              <div className="text-[17px] font-black tracking-tight">
                Earn<span className="text-cyan-400">Nova</span>
              </div>

              <div className="text-[8px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Earn • Grow • Repeat
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <Link
              href="/"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              Home
            </Link>

            <Link
              href="/plans"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
            >
              Plans
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-5 py-2.5 text-sm font-bold text-blue-300 transition hover:border-blue-400/40 hover:bg-blue-500/15"
            >
              Login
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 md:hidden"
            aria-label="Open menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-white/[0.06] bg-[#070b11] px-4 py-4 md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-2">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/[0.05]"
              >
                Home
              </Link>

              <Link
                href="/plans"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/[0.05]"
              >
                Plans
              </Link>

              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-xl bg-blue-600 px-4 py-3 text-center text-sm font-bold text-white"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className="relative overflow-hidden rounded-[30px] border border-blue-400/15 bg-gradient-to-br from-[#0c1726] via-[#09111c] to-[#071018] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] sm:p-10 lg:p-14">
          {/* Shine */}
          <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[500px] -translate-x-1/2 rounded-full bg-blue-500/[0.13] blur-[90px]" />

          <div className="pointer-events-none absolute right-[-100px] top-[-100px] h-64 w-64 rounded-full bg-cyan-400/[0.08] blur-[80px]" />

          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_20%,rgba(255,255,255,0.045)_40%,transparent_60%)] animate-[shine_5s_linear_infinite]" />

          <div className="relative max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-400/[0.07] px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
              <Sparkles size={13} />
              EarnNova Insights
            </div>

            <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Learn more.
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
                Earn smarter.
              </span>
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              EarnNova par useful earning guides, platform updates aur
              practical tips parho. Hamara goal simple hai: information ko
              easy, clean aur useful rakhna.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/plans"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-3 text-sm font-black text-white shadow-[0_10px_35px_rgba(37,99,235,0.25)] transition hover:-translate-y-0.5"
              >
                Explore Plans
                <ArrowRight
                  size={16}
                  className="transition group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.035] px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                <ArrowLeft size={16} />
                Back Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          TOP AD
      ===================================================== */}

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <AdUnit slot={activeAds[0]} />
      </section>

      {/* =====================================================
          ARTICLE
      ===================================================== */}

      <article className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#090e15] shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
          {/* Article header */}
          <div className="border-b border-white/[0.06] p-6 sm:p-9">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen size={13} />
                EarnNova Guide
              </span>

              <span>•</span>

              <span>Smart Earning</span>
            </div>

            <h2 className="mt-4 text-2xl font-black leading-tight sm:text-4xl">
              Online Earning ko Smart aur Responsible tareeqay se kaise
              approach karein
            </h2>

            <p className="mt-4 text-sm leading-7 text-slate-400">
              Online earning ka best approach sirf zyada opportunities
              dhoondna nahi, balkay apna time, consistency aur available
              resources smartly manage karna hai.
            </p>
          </div>

          {/* Article content */}
          <div className="p-6 sm:p-9">
            <ArticleSection
              icon={<TrendingUp size={18} />}
              title="1. Consistency sab se important hai"
            >
              Online earning mein results aksar ek din mein nahi aate.
              Consistent routine banana aur available earning activities ko
              properly complete karna zyada useful approach hai. Har din
              chhota progress long-term mein better result de sakta hai.
            </ArticleSection>

            <ArticleSection
              icon={<Zap size={18} />}
              title="2. Apna time smartly use karein"
            >
              Har opportunity ko ek saath follow karne ki zaroorat nahi.
              Pehle un activities ko identify karein jo aapke liye simple,
              useful aur manageable hain. Phir unko daily routine ka part
              banayein.
            </ArticleSection>

            {/* Middle Ad */}
            <div className="my-9">
              <AdUnit slot={activeAds[1]} />
            </div>

            <ArticleSection
              icon={<ShieldCheck size={18} />}
              title="3. Account security ko ignore na karein"
            >
              Strong password use karein, apni login information kisi ke saath
              share na karein aur suspicious links se bachain. Kisi bhi
              earning platform par security ko earning se pehle priority
              deni chahiye.
            </ArticleSection>

            <ArticleSection
              icon={<CircleDollarSign size={18} />}
              title="4. Earnings ko responsibly manage karein"
            >
              Earnings ko track karna useful habit hai. Apni wallet activity,
              withdrawals aur account information ko regularly review karein.
              Is se aapko apni progress ka clear idea milta rehta hai.
            </ArticleSection>

            {/* Second content ad */}
            <div className="my-9">
              <AdUnit slot={activeAds[2]} />
            </div>

            <ArticleSection
              icon={<Users size={18} />}
              title="5. Referral system ko naturally use karein"
            >
              Agar aap EarnNova ko friends ya family ke saath share karte hain
              to referral system use kiya ja sakta hai. Hamesha honest
              information share karein aur kisi ko unrealistic earning promise
              na karein.
            </ArticleSection>

            <ArticleSection
              icon={<Gift size={18} />}
              title="6. Growth ka focus rakhein"
            >
              Smart earning ka matlab sirf immediate reward nahi hota.
              Apni skills, consistency aur financial discipline ko improve
              karna bhi long-term growth ka important part hai.
            </ArticleSection>

            {/* Bottom content ad */}
            <div className="my-9">
              <AdUnit slot={activeAds[3]} />
            </div>

            <div className="mt-10 rounded-2xl border border-blue-400/10 bg-gradient-to-br from-blue-500/[0.08] to-cyan-400/[0.03] p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                  <Star size={19} />
                </div>

                <div>
                  <h3 className="font-black text-white">
                    EarnNova ka simple principle
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Learn → Stay Consistent → Grow → Repeat.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* =====================================================
          CTA
      ===================================================== */}

      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[26px] border border-blue-400/15 bg-gradient-to-r from-blue-600/[0.14] via-cyan-500/[0.08] to-blue-600/[0.12] p-7 sm:p-9">
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                Ready to start?
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Apni EarnNova journey start karein.
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                Plans explore karein aur apni preferred option select karein.
              </p>
            </div>

            <Link
              href="/plans"
              className="group inline-flex w-fit items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:-translate-y-0.5"
            >
              View Plans
              <ArrowRight
                size={16}
                className="transition group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER AD
      ===================================================== */}

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <AdUnit slot={activeAds[4]} />
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-white/[0.06] bg-[#04070b]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-7 text-center sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:text-left">
          <div>
            <div className="text-sm font-black">
              Earn<span className="text-cyan-400">Nova</span>
            </div>

            <p className="mt-1 text-[11px] text-slate-600">
              Earn • Grow • Repeat
            </p>
          </div>

          <div className="text-[11px] text-slate-600">
            © {new Date().getFullYear()} EarnNova Team. All rights reserved.
          </div>
        </div>
      </footer>

      {/* =====================================================
          BACK TO TOP
      ===================================================== */}

      {showTop && (
        <button
          type="button"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
          className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-blue-400/20 bg-[#0b121b]/90 text-cyan-300 shadow-[0_10px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-[#101b29]"
          aria-label="Back to top"
        >
          <ChevronUp size={20} />
        </button>
      )}

      {/* =====================================================
          ANIMATION
      ===================================================== */}

      <style jsx global>{`
        @keyframes shine {
          0% {
            transform: translateX(-120%);
          }

          50% {
            transform: translateX(120%);
          }

          100% {
            transform: translateX(120%);
          }
        }
      `}</style>
    </main>
  );
}

/* =========================================================
   AD UNIT
========================================================= */

function AdUnit({ slot }: { slot?: AdSlot }) {
  if (!slot) return null;

  return (
    <div
      data-ad-slot={slot.id}
      className="group relative my-5 overflow-hidden rounded-[22px] border border-slate-800/80 bg-gradient-to-br from-[#0d141d] via-[#0a1017] to-[#080d13] shadow-[0_15px_50px_rgba(0,0,0,0.22)]"
    >
      {/* Animated shine */}
      <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/[0.035] to-transparent transition-transform duration-[1800ms] group-hover:translate-x-[350%]" />

      <div className="relative flex min-h-[125px] items-center justify-center px-5 py-7">
        <div className="text-center">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-slate-800 bg-[#070b10] px-3 py-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-30" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-slate-600" />
            </span>

            <span className="text-[8px] font-black uppercase tracking-[0.22em] text-slate-600">
              Advertisement
            </span>
          </div>

          <p className="mt-3 text-[10px] font-semibold text-slate-700">
            Sponsored content
          </p>

          <div className="mt-1 flex items-center justify-center gap-1 text-[8px] font-bold uppercase tracking-[0.18em] text-slate-800">
            <span>EarnNova</span>
            <ExternalLink size={9} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ARTICLE SECTION
========================================================= */

function ArticleSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-9">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-blue-400/10 bg-blue-500/[0.08] text-blue-300">
          {icon}
        </div>

        <h3 className="text-lg font-black text-white">{title}</h3>
      </div>

      <p className="mt-4 pl-0 text-sm leading-7 text-slate-400 sm:pl-12">
        {children}
      </p>
    </section>
  );
}