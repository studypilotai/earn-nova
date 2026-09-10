"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Clock3,
  Loader2,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type Activation = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  payment_reference: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function AdminActivationsPage() {
  const router = useRouter();

  const [activations, setActivations] = useState<Activation[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(
    null
  );

  const [filter, setFilter] = useState("all");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /* =========================================================
     CHECK ADMIN
     ========================================================= */

  const checkAdmin = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/admin/login");
      return false;
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error(
        "ADMIN PROFILE ERROR:",
        profileError
      );

      setErrorMessage(
        profileError.message ||
          "Unable to verify admin account."
      );

      return false;
    }

    if (!profile || profile.role !== "admin") {
      router.replace("/dashboard");
      return false;
    }

    return true;
  }, [router]);

  /* =========================================================
     LOAD ACTIVATIONS
     ========================================================= */

  const loadActivations = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const isAdmin = await checkAdmin();

      if (!isAdmin) {
        return;
      }

      const {
        data,
        error,
      } = await supabase
        .from("activations")
        .select(
          `
            id,
            user_id,
            amount,
            currency,
            payment_method,
            payment_reference,
            status,
            created_at,
            updated_at
          `
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "LOAD ACTIVATIONS ERROR:",
          error
        );

        setActivations([]);

        setErrorMessage(
          error.message ||
            "Unable to load activation requests."
        );

        return;
      }

      const formatted: Activation[] = (
        data || []
      ).map((item) => ({
        id: String(item.id),
        user_id: String(item.user_id),
        amount: Number(item.amount ?? 0),
        currency: String(
          item.currency ?? "USD"
        ).toUpperCase(),
        payment_method:
          item.payment_method ?? null,
        payment_reference:
          item.payment_reference ?? null,
        status: String(
          item.status ?? "pending"
        ).toLowerCase(),
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      setActivations(formatted);
    } catch (error) {
      console.error(
        "LOAD ACTIVATIONS EXCEPTION:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading activations."
      );
    } finally {
      setLoading(false);
    }
  }, [checkAdmin]);

  useEffect(() => {
    loadActivations();
  }, [loadActivations]);

  /* =========================================================
     APPROVE ACTIVATION
     ========================================================= */

  async function approveActivation(id: string) {
    const activation = activations.find(
      (item) => item.id === id
    );

    if (!activation) {
      setErrorMessage(
        "Activation request not found."
      );
      return;
    }

    if (activation.status !== "pending") {
      setErrorMessage(
        "This activation has already been processed."
      );
      return;
    }

    const confirmed = window.confirm(
      `Approve this activation?\n\n` +
        `Amount: $${activation.amount.toFixed(
          2
        )} ${activation.currency}\n\n` +
        `The customer's plan will be activated and any eligible referral reward will be processed securely by the database.`
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(id);
    setMessage("");
    setErrorMessage("");

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "approve_activation",
        {
          p_activation_id: id,
        }
      );

      if (error) {
        console.error(
          "APPROVE ACTIVATION ERROR:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to approve activation."
        );

        return;
      }

      /*
       * RPC can return:
       * {
       *   success: true,
       *   message: "...",
       *   referrer_id: "..."
       * }
       */

      if (
        data &&
        typeof data === "object" &&
        "success" in data &&
        data.success === false
      ) {
        const rpcMessage =
          "message" in data &&
          typeof data.message === "string"
            ? data.message
            : "Activation could not be approved.";

        setErrorMessage(rpcMessage);

        return;
      }

      setMessage(
        "Activation approved successfully. The customer plan has been activated."
      );

      await loadActivations();
    } catch (error) {
      console.error(
        "APPROVE ACTIVATION EXCEPTION:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while approving activation."
      );
    } finally {
      setProcessingId(null);
    }
  }

  /* =========================================================
     REJECT ACTIVATION
     ========================================================= */

  async function rejectActivation(id: string) {
    const activation = activations.find(
      (item) => item.id === id
    );

    if (!activation) {
      setErrorMessage(
        "Activation request not found."
      );
      return;
    }

    if (activation.status !== "pending") {
      setErrorMessage(
        "This activation has already been processed."
      );
      return;
    }

    const confirmed = window.confirm(
      `Reject this activation request?\n\n` +
        `Amount: $${activation.amount.toFixed(
          2
        )} ${activation.currency}`
    );

    if (!confirmed) {
      return;
    }

    setProcessingId(id);
    setMessage("");
    setErrorMessage("");

    try {
      /*
       * Only change a request that is still pending.
       * This prevents approving/rejecting the same request
       * twice from the UI.
       */

      const {
        data,
        error,
      } = await supabase
        .from("activations")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", "pending")
        .select(
          "id, status, updated_at"
        )
        .maybeSingle();

      if (error) {
        console.error(
          "REJECT ACTIVATION ERROR:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to reject activation."
        );

        return;
      }

      if (!data) {
        setErrorMessage(
          "This activation was not changed. It may already have been processed."
        );

        await loadActivations();

        return;
      }

      setMessage(
        "Activation rejected successfully."
      );

      await loadActivations();
    } catch (error) {
      console.error(
        "REJECT ACTIVATION EXCEPTION:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while rejecting activation."
      );
    } finally {
      setProcessingId(null);
    }
  }

  /* =========================================================
     FILTER
     ========================================================= */

  const filteredActivations =
    filter === "all"
      ? activations
      : activations.filter(
          (item) =>
            item.status ===
            filter.toLowerCase()
        );

  /* =========================================================
     COUNTS
     ========================================================= */

  const pendingCount = activations.filter(
    (item) => item.status === "pending"
  ).length;

  const approvedCount = activations.filter(
    (item) => item.status === "approved"
  ).length;

  const rejectedCount = activations.filter(
    (item) => item.status === "rejected"
  ).length;

  /* =========================================================
     STATUS STYLE
     ========================================================= */

  function statusClass(status: string) {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-emerald-100 text-emerald-700";

      case "rejected":
        return "bg-red-100 text-red-700";

      case "pending":
      default:
        return "bg-amber-100 text-amber-700";
    }
  }

  /* =========================================================
     DATE
     ========================================================= */

  function formatDate(
    date: string | null | undefined
  ) {
    if (!date) {
      return "—";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "—";
    }

    return parsed.toLocaleString();
  }

  /* =========================================================
     UI
     ========================================================= */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* =====================================================
            HEADER
            ===================================================== */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                router.push("/admin")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
              aria-label="Back to admin dashboard"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Activations
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage customer activation requests
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadActivations}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>
        </div>

        {/* =====================================================
            STATS
            ===================================================== */}

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              All
            </p>

            <p className="mt-2 text-2xl font-black">
              {activations.length}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Pending
            </p>

            <p className="mt-2 text-2xl font-black text-amber-600">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-500">
              Approved
            </p>

            <p className="mt-2 text-2xl font-black text-emerald-600">
              {approvedCount}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-red-500">
              Rejected
            </p>

            <p className="mt-2 text-2xl font-black text-red-600">
              {rejectedCount}
            </p>
          </div>

        </div>

        {/* =====================================================
            FILTERS
            ===================================================== */}

        <div className="mb-4 flex flex-wrap gap-2">
          {[
            ["all", "All"],
            ["pending", "Pending"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
          ].map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setFilter(value)
                }
                className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                  filter === value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            )
          )}
        </div>

        {/* =====================================================
            SUCCESS MESSAGE
            ===================================================== */}

        {message && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{message}</span>
          </div>
        )}

        {/* =====================================================
            ERROR MESSAGE
            ===================================================== */}

        {errorMessage && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            <XCircle
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{errorMessage}</span>
          </div>
        )}

        {/* =====================================================
            LOADING
            ===================================================== */}

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <Loader2
              size={30}
              className="mx-auto animate-spin text-blue-600"
            />

            <p className="mt-3 text-sm font-semibold text-slate-500">
              Loading activation requests...
            </p>
          </div>
        )}

        {/* =====================================================
            EMPTY
            ===================================================== */}

        {!loading &&
          filteredActivations.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Clock3
                size={32}
                className="mx-auto text-slate-300"
              />

              <h2 className="mt-4 text-base font-bold">
                No Activation Requests
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                There are no requests in this
                category.
              </p>
            </div>
          )}

        {/* =====================================================
            DESKTOP TABLE
            ===================================================== */}

        {!loading &&
          filteredActivations.length > 0 && (
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left">

                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        User ID
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Amount
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Payment
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Reference
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Status
                      </th>

                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Date
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredActivations.map(
                      (activation) => (
                        <tr
                          key={activation.id}
                          className="transition hover:bg-slate-50"
                        >

                          {/* USER */}

                          <td className="px-5 py-4">
                            <p
                              title={
                                activation.user_id
                              }
                              className="max-w-[180px] truncate font-mono text-xs text-slate-600"
                            >
                              {
                                activation.user_id
                              }
                            </p>
                          </td>

                          {/* AMOUNT */}

                          <td className="px-5 py-4">
                            <p className="font-black">
                              $
                              {activation.amount.toFixed(
                                2
                              )}
                            </p>

                            <p className="text-[10px] uppercase text-slate-400">
                              {
                                activation.currency
                              }
                            </p>
                          </td>

                          {/* PAYMENT */}

                          <td className="px-5 py-4 text-sm font-semibold text-slate-700">
                            {activation.payment_method ||
                              "—"}
                          </td>

                          {/* REFERENCE */}

                          <td className="px-5 py-4">
                            <p
                              title={
                                activation.payment_reference ||
                                ""
                              }
                              className="max-w-[160px] truncate font-mono text-xs text-slate-500"
                            >
                              {activation.payment_reference ||
                                "—"}
                            </p>
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase ${statusClass(
                                activation.status
                              )}`}
                            >
                              {
                                activation.status
                              }
                            </span>
                          </td>

                          {/* DATE */}

                          <td className="px-5 py-4 text-xs text-slate-500">
                            {formatDate(
                              activation.created_at
                            )}
                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4">
                            {activation.status ===
                            "pending" ? (
                              <div className="flex justify-end gap-2">

                                <button
                                  type="button"
                                  disabled={
                                    processingId ===
                                    activation.id
                                  }
                                  onClick={() =>
                                    approveActivation(
                                      activation.id
                                    )
                                  }
                                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {processingId ===
                                  activation.id ? (
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <CheckCircle2
                                      size={14}
                                    />
                                  )}

                                  Approve
                                </button>

                                <button
                                  type="button"
                                  disabled={
                                    processingId ===
                                    activation.id
                                  }
                                  onClick={() =>
                                    rejectActivation(
                                      activation.id
                                    )
                                  }
                                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <XCircle
                                    size={14}
                                  />

                                  Reject
                                </button>

                              </div>
                            ) : (
                              <div className="text-right text-xs font-semibold text-slate-400">
                                Processed
                              </div>
                            )}
                          </td>

                        </tr>
                      )
                    )}
                  </tbody>

                </table>
              </div>
            </div>
          )}

        {/* =====================================================
            MOBILE CARDS
            ===================================================== */}

        {!loading &&
          filteredActivations.length > 0 && (
            <div className="space-y-3 md:hidden">
              {filteredActivations.map(
                (activation) => (
                  <div
                    key={activation.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >

                    {/* TOP */}

                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Activation
                        </p>

                        <p className="mt-1 text-lg font-black">
                          $
                          {activation.amount.toFixed(
                            2
                          )}
                        </p>

                        <p className="text-[10px] uppercase text-slate-400">
                          {
                            activation.currency
                          }
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-[9px] font-bold uppercase ${statusClass(
                          activation.status
                        )}`}
                      >
                        {
                          activation.status
                        }
                      </span>
                    </div>

                    {/* DETAILS */}

                    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">

                      {/* USER */}

                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs text-slate-400">
                          User
                        </span>

                        <span
                          title={
                            activation.user_id
                          }
                          className="max-w-[220px] truncate text-right font-mono text-[10px] text-slate-600"
                        >
                          {
                            activation.user_id
                          }
                        </span>
                      </div>

                      {/* PAYMENT */}

                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs text-slate-400">
                          Payment
                        </span>

                        <span className="text-right text-xs font-semibold text-slate-700">
                          {activation.payment_method ||
                            "—"}
                        </span>
                      </div>

                      {/* REFERENCE */}

                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs text-slate-400">
                          Reference
                        </span>

                        <span
                          title={
                            activation.payment_reference ||
                            ""
                          }
                          className="max-w-[180px] truncate text-right font-mono text-[10px] text-slate-600"
                        >
                          {activation.payment_reference ||
                            "—"}
                        </span>
                      </div>

                      {/* CREATED */}

                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs text-slate-400">
                          Submitted
                        </span>

                        <span className="text-right text-[10px] text-slate-500">
                          {formatDate(
                            activation.created_at
                          )}
                        </span>
                      </div>

                      {/* UPDATED */}

                      {activation.status !==
                        "pending" && (
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-xs text-slate-400">
                            Updated
                          </span>

                          <span className="text-right text-[10px] text-slate-500">
                            {formatDate(
                              activation.updated_at
                            )}
                          </span>
                        </div>
                      )}

                    </div>

                    {/* ACTIONS */}

                    {activation.status ===
                      "pending" && (
                      <div className="mt-4 grid grid-cols-2 gap-2">

                        <button
                          type="button"
                          disabled={
                            processingId ===
                            activation.id
                          }
                          onClick={() =>
                            approveActivation(
                              activation.id
                            )
                          }
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {processingId ===
                          activation.id ? (
                            <Loader2
                              size={14}
                              className="animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              size={14}
                            />
                          )}

                          Approve
                        </button>

                        <button
                          type="button"
                          disabled={
                            processingId ===
                            activation.id
                          }
                          onClick={() =>
                            rejectActivation(
                              activation.id
                            )
                          }
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-red-600 py-3 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XCircle size={14} />

                          Reject
                        </button>

                      </div>
                    )}

                  </div>
                )
              )}
            </div>
          )}

      </div>
    </main>
  );
}