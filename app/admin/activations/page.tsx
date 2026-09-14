"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type ActivationStatus = "pending" | "approved" | "rejected";

type Activation = {
  id: string;
  user_id: string;
  amount: number;
  currency: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  status: ActivationStatus;
  created_at: string;
  updated_at: string | null;

  customer?: {
    full_name: string | null;
    email: string | null;
  };
};

type FilterType = "all" | ActivationStatus;

const ACTIVE_PLANS = [
  { price: 2.5, name: "Starter" },
  { price: 5, name: "Basic" },
  { price: 10, name: "Pro" },
  { price: 20, name: "Premium" },
  { price: 50, name: "VIP" },
];

function getPlanName(amount: number) {
  const plan = ACTIVE_PLANS.find(
    (item) => Math.abs(Number(item.price) - Number(amount)) < 0.001
  );

  return plan?.name ?? "Unknown Plan";
}

function formatDate(date: string) {
  return new Date(date).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatAmount(amount: number, currency: string | null) {
  return `${currency || "USD"} ${Number(amount).toFixed(2)}`;
}

export default function AdminActivationsPage() {
  const router = useRouter();

  const [activations, setActivations] = useState<Activation[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const checkAdmin = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/admin/login");
      return false;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      return false;
    }

    if (profile?.role !== "admin") {
      await supabase.auth.signOut();

      if (typeof window !== "undefined") {
        localStorage.removeItem("earnNovaLoggedIn");
        localStorage.removeItem("earnNovaUserEmail");
        localStorage.removeItem("earnNovaUserName");
        localStorage.removeItem("earnNovaUserId");
      }

      router.replace("/admin/login");
      return false;
    }

    return true;
  }, [router]);

  const loadActivations = useCallback(async () => {
    setLoading(true);
    setError("");

    const isAdmin = await checkAdmin();

    if (!isAdmin) {
      setLoading(false);
      return;
    }

    const { data, error: activationError } = await supabase
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
      .order("created_at", { ascending: false });

    if (activationError) {
      setError(activationError.message);
      setLoading(false);
      return;
    }

    const rows = (data || []) as Activation[];

    /*
     * Customer profiles separate fetch:
     * Is se Supabase relationship/cache issue avoid hota hai.
     */
    const userIds = [...new Set(rows.map((item) => item.user_id))];

    let customerMap = new Map<
      string,
      { full_name: string | null; email: string | null }
    >();

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      if (profilesError) {
        setError(profilesError.message);
        setLoading(false);
        return;
      }

      customerMap = new Map(
        (profiles || []).map(
          (profile: {
            id: string;
            full_name: string | null;
            email: string | null;
          }) => [
            profile.id,
            {
              full_name: profile.full_name,
              email: profile.email,
            },
          ]
        )
      );
    }

    const enriched = rows.map((activation) => ({
      ...activation,
      customer: customerMap.get(activation.user_id) || {
        full_name: null,
        email: null,
      },
    }));

    setActivations(enriched);
    setLoading(false);
  }, [checkAdmin]);

  useEffect(() => {
    loadActivations();
  }, [loadActivations]);

  const approveActivation = async (activation: Activation) => {
    if (activation.status !== "pending") return;

    const planName = getPlanName(Number(activation.amount));

    const confirmed = window.confirm(
      `Approve this activation?\n\nCustomer: ${
        activation.customer?.full_name || "Unknown"
      }\nPlan: ${planName}\nAmount: ${formatAmount(
        activation.amount,
        activation.currency
      )}\n\nCustomer membership will be activated for 3 months.`
    );

    if (!confirmed) return;

    setProcessingId(activation.id);
    setError("");
    setMessage("");

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "approve_activation",
        {
          p_activation_id: activation.id,
        }
      );

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      if (
        data &&
        typeof data === "object" &&
        "success" in data &&
        data.success === false
      ) {
        setError(
          "message" in data
            ? String(data.message)
            : "Activation approval failed."
        );
        return;
      }

      setMessage(
        `Activation approved successfully. ${planName} plan is now active for the customer.`
      );

      await loadActivations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while approving activation."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const rejectActivation = async (activation: Activation) => {
    if (activation.status !== "pending") return;

    const confirmed = window.confirm(
      `Reject this activation?\n\nCustomer: ${
        activation.customer?.full_name || "Unknown"
      }\nAmount: ${formatAmount(
        activation.amount,
        activation.currency
      )}`
    );

    if (!confirmed) return;

    setProcessingId(activation.id);
    setError("");
    setMessage("");

    try {
      /*
       * Reject RPC bhi admin authorization enforce karta hai.
       * Direct browser UPDATE intentionally use nahi kiya gaya.
       */
      const { data, error: rpcError } = await supabase.rpc(
        "reject_activation",
        {
          p_activation_id: activation.id,
        }
      );

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      if (
        data &&
        typeof data === "object" &&
        "success" in data &&
        data.success === false
      ) {
        setError(
          "message" in data
            ? String(data.message)
            : "Activation rejection failed."
        );
        return;
      }

      setMessage("Activation rejected successfully.");

      await loadActivations();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while rejecting activation."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const filteredActivations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return activations.filter((activation) => {
      const matchesFilter =
        filter === "all" || activation.status === filter;

      if (!matchesFilter) return false;

      if (!normalizedSearch) return true;

      const planName = getPlanName(Number(activation.amount));

      const searchable = [
        activation.id,
        activation.user_id,
        activation.payment_reference,
        activation.payment_method,
        activation.status,
        activation.customer?.full_name,
        activation.customer?.email,
        planName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedSearch);
    });
  }, [activations, filter, search]);

  const counts = useMemo(() => {
    return {
      all: activations.length,
      pending: activations.filter((item) => item.status === "pending")
        .length,
      approved: activations.filter((item) => item.status === "approved")
        .length,
      rejected: activations.filter((item) => item.status === "rejected")
        .length,
    };
  }, [activations]);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-cyan-400" />

              <h1 className="text-2xl font-bold sm:text-3xl">
                Activations
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-400">
              Review customer activation requests.
            </p>
          </div>

          <button
            type="button"
            onClick={loadActivations}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="All"
            value={counts.all}
            icon={<ShieldCheck className="h-5 w-5" />}
          />

          <StatCard
            label="Pending"
            value={counts.pending}
            icon={<Clock3 className="h-5 w-5" />}
          />

          <StatCard
            label="Approved"
            value={counts.approved}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />

          <StatCard
            label="Rejected"
            value={counts.rejected}
            icon={<XCircle className="h-5 w-5" />}
          />
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <FilterButton
                active={filter === "all"}
                onClick={() => setFilter("all")}
                label={`All (${counts.all})`}
              />

              <FilterButton
                active={filter === "pending"}
                onClick={() => setFilter("pending")}
                label={`Pending (${counts.pending})`}
              />

              <FilterButton
                active={filter === "approved"}
                onClick={() => setFilter("approved")}
                label={`Approved (${counts.approved})`}
              />

              <FilterButton
                active={filter === "rejected"}
                onClick={() => setFilter("rejected")}
                label={`Rejected (${counts.rejected})`}
              />
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customer, email, ID..."
                className="w-full rounded-xl border border-white/10 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/40"
              />
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-10 text-center">
            <RefreshCw className="mx-auto h-7 w-7 animate-spin text-cyan-400" />

            <p className="mt-3 text-sm text-slate-400">
              Loading activation requests...
            </p>
          </div>
        ) : filteredActivations.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-10 text-center">
            <Clock3 className="mx-auto h-8 w-8 text-slate-600" />

            <p className="mt-3 font-medium text-slate-300">
              No activation requests found.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try another filter or search.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px]">
                  <thead className="border-b border-white/10 bg-white/[0.03]">
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-500">
                      <th className="px-5 py-4">Customer</th>
                      <th className="px-5 py-4">Plan</th>
                      <th className="px-5 py-4">Payment</th>
                      <th className="px-5 py-4">Reference</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/5">
                    {filteredActivations.map((activation) => {
                      const planName = getPlanName(
                        Number(activation.amount)
                      );

                      const isProcessing =
                        processingId === activation.id;

                      return (
                        <tr
                          key={activation.id}
                          className="transition hover:bg-white/[0.02]"
                        >
                          <td className="px-5 py-5">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                                <User className="h-5 w-5" />
                              </div>

                              <div className="min-w-0">
                                <p className="font-semibold text-white">
                                  {activation.customer?.full_name ||
                                    "Unknown Customer"}
                                </p>

                                <p className="mt-0.5 text-xs text-slate-400">
                                  {activation.customer?.email ||
                                    "No email"}
                                </p>

                                <p className="mt-1 max-w-[230px] truncate font-mono text-[10px] text-slate-600">
                                  {activation.user_id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <div>
                              <p className="font-semibold text-cyan-300">
                                {planName}
                              </p>

                              <p className="mt-1 text-sm font-medium text-white">
                                {formatAmount(
                                  activation.amount,
                                  activation.currency
                                )}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                3 months
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <p className="text-sm font-medium text-slate-200">
                              {activation.payment_method ||
                                "Not specified"}
                            </p>
                          </td>

                          <td className="max-w-[220px] px-5 py-5">
                            <p className="break-all font-mono text-xs text-slate-400">
                              {activation.payment_reference ||
                                "No reference"}
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <StatusBadge status={activation.status} />
                          </td>

                          <td className="whitespace-nowrap px-5 py-5 text-xs text-slate-400">
                            {formatDate(activation.created_at)}
                          </td>

                          <td className="px-5 py-5">
                            {activation.status === "pending" ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    rejectActivation(activation)
                                  }
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    approveActivation(activation)
                                  }
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isProcessing ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                  Approve
                                </button>
                              </div>
                            ) : (
                              <div className="text-right text-xs text-slate-600">
                                Processed
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="space-y-4 lg:hidden">
              {filteredActivations.map((activation) => {
                const planName = getPlanName(
                  Number(activation.amount)
                );

                const isProcessing =
                  processingId === activation.id;

                return (
                  <div
                    key={activation.id}
                    className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
                          <User className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">
                            {activation.customer?.full_name ||
                              "Unknown Customer"}
                          </p>

                          <p className="truncate text-xs text-slate-400">
                            {activation.customer?.email ||
                              "No email"}
                          </p>
                        </div>
                      </div>

                      <StatusBadge status={activation.status} />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <InfoBox
                        label="Plan"
                        value={planName}
                      />

                      <InfoBox
                        label="Amount"
                        value={formatAmount(
                          activation.amount,
                          activation.currency
                        )}
                      />

                      <InfoBox
                        label="Payment"
                        value={
                          activation.payment_method ||
                          "Not specified"
                        }
                      />

                      <InfoBox
                        label="Date"
                        value={formatDate(
                          activation.created_at
                        )}
                      />
                    </div>

                    <div className="mt-4 rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-600">
                        Payment Reference
                      </p>

                      <p className="mt-1 break-all font-mono text-xs text-slate-400">
                        {activation.payment_reference ||
                          "No reference"}
                      </p>
                    </div>

                    <div className="mt-3 rounded-xl border border-white/5 bg-black/20 p-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-600">
                        Customer ID
                      </p>

                      <p className="mt-1 break-all font-mono text-[10px] text-slate-500">
                        {activation.user_id}
                      </p>
                    </div>

                    {activation.status === "pending" && (
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            rejectActivation(activation)
                          }
                          disabled={isProcessing}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            approveActivation(activation)
                          }
                          disabled={isProcessing}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">{label}</div>

        <div className="text-cyan-400">{icon}</div>
      </div>

      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
        active
          ? "bg-cyan-500 text-white"
          : "border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function StatusBadge({
  status,
}: {
  status: ActivationStatus;
}) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Approved
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-300">
        <XCircle className="h-3.5 w-3.5" />
        Rejected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
      <Clock3 className="h-3.5 w-3.5" />
      Pending
    </span>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-semibold text-slate-200">
        {value}
      </p>
    </div>
  );
}