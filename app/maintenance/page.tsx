"use client";

import {
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import { useEffect } from "react";

export default function MaintenancePage() {
  useEffect(() => {
    /*
     * Automatically check every 30 seconds.
     * When admin turns maintenance OFF,
     * customer will automatically return to the site.
     */
    const interval = setInterval(() => {
      window.location.reload();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050b16] px-6 text-white">

      <div className="w-full max-w-2xl text-center">

        {/* =================================================
            LOGO
        ================================================= */}

        <div className="mb-10 flex justify-center">
          <div className="flex items-center gap-2">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
              <ShieldCheck className="h-6 w-6 text-cyan-400" />
            </div>

            <span className="text-2xl font-bold tracking-tight">
              Earn<span className="text-cyan-400">
                Nova
              </span>
            </span>

          </div>
        </div>

        {/* =================================================
            ICON
        ================================================= */}

        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/5">
          <Wrench className="h-11 w-11 text-cyan-400" />
        </div>

        {/* =================================================
            TITLE
        ================================================= */}

        <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
          We&apos;ll be back soon
        </h1>

        {/* =================================================
            MESSAGE
        ================================================= */}

        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-slate-400 sm:text-lg">
          EarnNova is currently undergoing maintenance
          and improvements.
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Your account and data remain safe.
        </p>

        {/* =================================================
            STATUS
        ================================================= */}

        <div className="mx-auto mt-10 flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-5 py-3">

          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />

            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
          </span>

          <span className="text-sm font-medium text-slate-300">
            Maintenance in progress
          </span>

        </div>

        {/* =================================================
            CHECK AGAIN
        ================================================= */}

        <button
          type="button"
          onClick={() => {
            window.location.reload();
          }}
          className="mt-10 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
        >
          <RefreshCw className="h-4 w-4" />

          Check again
        </button>

        {/* =================================================
            FOOTER
        ================================================= */}

        <p className="mt-10 text-xs text-slate-600">
          EarnNova • Secure earning platform
        </p>

      </div>

    </main>
  );
}