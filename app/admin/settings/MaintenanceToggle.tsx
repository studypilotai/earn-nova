"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Power,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

type Settings = {
  id: number;
  maintenance_mode: boolean;
  maintenance_title: string;
  maintenance_message: string;
  updated_at: string;
};

export default function MaintenanceToggle() {
  const [settings, setSettings] =
    useState<Settings | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* ==================================================
     LOAD SETTINGS
  ================================================== */

  const loadSettings = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const response = await fetch(
          "/api/admin/maintenance",
          {
            method: "GET",
            cache: "no-store",
            credentials: "include",
          }
        );

        let data: {
          settings?: Settings;
          error?: string;
        };

        try {
          data = await response.json();
        } catch {
          throw new Error(
            "Invalid response from maintenance API."
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to load maintenance settings."
          );
        }

        if (!data.settings) {
          throw new Error(
            "Maintenance settings were not returned."
          );
        }

        setSettings(data.settings);
      } catch (err) {
        console.error(
          "MAINTENANCE LOAD ERROR:",
          err
        );

        setSettings(null);

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /* ==================================================
     TOGGLE MAINTENANCE
  ================================================== */

  async function toggleMaintenance() {
    if (!settings || saving) {
      return;
    }

    const nextMode =
      !settings.maintenance_mode;

    const confirmed = window.confirm(
      nextMode
        ? "Turn ON maintenance mode? Customers will be redirected to the maintenance page."
        : "Turn OFF maintenance mode? EarnNova will become available again."
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/admin/maintenance",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            maintenance_mode:
              nextMode,
          }),
        }
      );

      let data: {
        settings?: Settings;
        error?: string;
      };

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "Invalid response from maintenance API."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update maintenance mode."
        );
      }

      if (!data.settings) {
        throw new Error(
          "Updated maintenance settings were not returned."
        );
      }

      setSettings(data.settings);

      setSuccess(
        nextMode
          ? "Maintenance mode is now ON."
          : "EarnNova is now LIVE."
      );
    } catch (err) {
      console.error(
        "MAINTENANCE UPDATE ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ==================================================
     LOADING
  ================================================== */

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#07111f] p-6">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />

          <span>
            Loading maintenance settings...
          </span>
        </div>
      </div>
    );
  }

  /* ==================================================
     FAILED TO LOAD
  ================================================== */

  if (!settings) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">

        <div className="flex items-start gap-3 text-red-300">

          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

          <p className="text-sm leading-6">
            {error ||
              "Settings could not be loaded."}
          </p>

        </div>

        <button
          type="button"
          onClick={loadSettings}
          disabled={loading}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className="h-4 w-4" />

          Try Again
        </button>

      </div>
    );
  }

  /* ==================================================
     MAIN UI
  ================================================== */

  return (
    <section className="rounded-2xl border border-white/10 bg-[#07111f] p-6 shadow-xl">

      {/* HEADER */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10">
            <ShieldCheck className="h-6 w-6 text-cyan-400" />
          </div>

          <div>

            <h2 className="text-lg font-bold text-white">
              Maintenance Mode
            </h2>

            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">
              Temporarily disable customer access
              while EarnNova is being updated.
            </p>

          </div>

        </div>

        {/* STATUS */}

        <div
          className={
            settings.maintenance_mode
              ? "inline-flex w-fit items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-semibold text-amber-300"
              : "inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"
          }
        >

          {settings.maintenance_mode ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5" />
              Maintenance ON
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Website LIVE
            </>
          )}

        </div>

      </div>

      <div className="my-6 h-px bg-white/10" />

      {/* CONTROL */}

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <p className="font-semibold text-white">
            Customer Access
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {settings.maintenance_mode
              ? "Customers are currently seeing the maintenance page."
              : "Customers can currently access EarnNova normally."}
          </p>

        </div>

        <button
          type="button"
          onClick={toggleMaintenance}
          disabled={saving}
          className={
            settings.maintenance_mode
              ? "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              : "inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-black transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          }
        >

          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Power className="h-4 w-4" />
          )}

          {saving
            ? "Updating..."
            : settings.maintenance_mode
              ? "Turn Website ON"
              : "Turn Maintenance ON"}

        </button>

      </div>

      {/* SECURITY NOTICE */}

      <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">

        <div className="flex items-start gap-3">

          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />

          <p className="text-xs leading-5 text-slate-400">
            When maintenance mode is ON, customer
            pages redirect to the maintenance page.
            Admin access remains available.
          </p>

        </div>

      </div>

      {/* SUCCESS */}

      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-300">

          <CheckCircle2 className="h-4 w-4 shrink-0" />

          <span>{success}</span>

        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">

          <AlertTriangle className="h-4 w-4 shrink-0" />

          <span>{error}</span>

        </div>
      )}

    </section>
  );
}