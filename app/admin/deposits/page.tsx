"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type DepositStatus =
  | "pending"
  | "approved"
  | "rejected";

type Deposit = {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  transaction_id: string | null;
  payment_proof: string | null;
  status: DepositStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;

  profile?: {
    full_name: string | null;
    email: string | null;
  } | null;
};

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type RpcResult = {
  success?: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
};

/* =========================================================
   SUPABASE
========================================================= */

const supabase = createClient();

/* =========================================================
   HELPERS
========================================================= */

function normalizeRpcResult(
  data: unknown
): RpcResult {
  if (Array.isArray(data)) {
    return (
      (data[0] as RpcResult | undefined) ?? {}
    );
  }

  if (
    data &&
    typeof data === "object"
  ) {
    return data as RpcResult;
  }

  return {};
}

function getRpcMessage(
  data: unknown,
  fallback: string
) {
  const result = normalizeRpcResult(data);

  if (
    typeof result.message === "string" &&
    result.message.trim()
  ) {
    return result.message;
  }

  if (
    typeof result.error === "string" &&
    result.error.trim()
  ) {
    return result.error;
  }

  return fallback;
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminDepositsPage() {
  const router = useRouter();

  const [deposits, setDeposits] = useState<
    Deposit[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<
      "all" | DepositStatus
    >("all");

  const [selectedDeposit, setSelectedDeposit] =
    useState<Deposit | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  /* =======================================================
     ADMIN CHECK + LOAD
  ======================================================= */

  const loadDeposits = useCallback(
    async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        /* --------------------------------------------------
           1. AUTH CHECK
        -------------------------------------------------- */

        const {
          data: {
            user,
          },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !user
        ) {
          router.replace(
            "/admin/login"
          );
          return;
        }

        /* --------------------------------------------------
           2. ADMIN ROLE CHECK
        -------------------------------------------------- */

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "id, role"
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

        if (
          profileError ||
          profile?.role !== "admin"
        ) {
          router.replace(
            "/dashboard"
          );
          return;
        }

        /* --------------------------------------------------
           3. LOAD DEPOSITS
           IMPORTANT:
           No relationship with profiles.
        -------------------------------------------------- */

        const {
          data: depositData,
          error: depositsError,
        } = await supabase
          .from("deposits")
          .select(
            `
              id,
              user_id,
              amount,
              method,
              transaction_id,
              payment_proof,
              status,
              admin_note,
              created_at,
              updated_at
            `
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (depositsError) {
          console.error(
            "DEPOSITS ERROR:",
            depositsError
          );

          throw new Error(
            depositsError.message
          );
        }

        const rawDeposits =
          depositData ?? [];

        /* --------------------------------------------------
           4. GET UNIQUE USER IDS
        -------------------------------------------------- */

        const userIds = [
          ...new Set(
            rawDeposits
              .map(
                (deposit) =>
                  deposit.user_id
              )
              .filter(Boolean)
          ),
        ];

        /* --------------------------------------------------
           5. LOAD PROFILES SEPARATELY
        -------------------------------------------------- */

        let profiles: Profile[] =
          [];

        if (
          userIds.length > 0
        ) {
          const {
            data: profileData,
            error: profilesError,
          } =
            await supabase
              .from("profiles")
              .select(
                `
                  id,
                  full_name,
                  email
                `
              )
              .in(
                "id",
                userIds
              );

          if (
            profilesError
          ) {
            /*
             * Deposits should still display
             * even if profile lookup fails.
             */
            console.error(
              "PROFILES ERROR:",
              profilesError
            );

            profiles = [];
          } else {
            profiles =
              profileData ?? [];
          }
        }

        /* --------------------------------------------------
           6. PROFILE MAP
        -------------------------------------------------- */

        const profileMap =
          new Map<
            string,
            {
              full_name:
                | string
                | null;
              email:
                | string
                | null;
            }
          >();

        for (
          const profile of profiles
        ) {
          profileMap.set(
            profile.id,
            {
              full_name:
                profile.full_name,
              email:
                profile.email,
            }
          );
        }

        /* --------------------------------------------------
           7. ATTACH PROFILE
        -------------------------------------------------- */

        const formatted: Deposit[] =
          rawDeposits.map(
            (item) => ({
              id: item.id,
              user_id:
                item.user_id,
              amount: Number(
                item.amount ?? 0
              ),
              method:
                item.method,
              transaction_id:
                item.transaction_id,
              payment_proof:
                item.payment_proof,
              status:
                item.status as DepositStatus,
              admin_note:
                item.admin_note,
              created_at:
                item.created_at,
              updated_at:
                item.updated_at,
              profile:
                profileMap.get(
                  item.user_id
                ) ?? null,
            })
          );

        setDeposits(
          formatted
        );
      } catch (error) {
        console.error(
          "LOAD DEPOSITS ERROR:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load deposit requests."
        );
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadDeposits();
  }, [loadDeposits]);

  /* =======================================================
     APPROVE DEPOSIT
  ======================================================= */

  async function approveDeposit(
    deposit: Deposit
  ) {
    if (
      processing ||
      deposit.status !==
        "pending"
    ) {
      return;
    }

    const userName =
      deposit.profile
        ?.full_name ||
      deposit.profile
        ?.email ||
      "this user";

    const confirmed =
      window.confirm(
        `Approve $${deposit.amount.toFixed(
          2
        )} deposit for ${userName}?`
      );

    if (!confirmed) {
      return;
    }

    setProcessing(
      deposit.id
    );

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          "admin_approve_deposit",
          {
            p_deposit_id:
              deposit.id,
            p_admin_note:
              "Deposit approved by EarnNova Team.",
          }
        );

      if (error) {
        console.error(
          "APPROVE ERROR:",
          error
        );

        throw new Error(
          error.message
        );
      }

      const result =
        normalizeRpcResult(
          data
        );

      if (
        result.success === false
      ) {
        throw new Error(
          getRpcMessage(
            data,
            "Deposit approval failed."
          )
        );
      }

      setSelectedDeposit(
        null
      );

      setSuccessMessage(
        getRpcMessage(
          data,
          "Deposit approved successfully."
        )
      );

      await loadDeposits();
    } catch (error) {
      console.error(
        "APPROVE DEPOSIT ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to approve deposit."
      );
    } finally {
      setProcessing(
        null
      );
    }
  }

  /* =======================================================
     REJECT DEPOSIT
  ======================================================= */

  async function rejectDeposit(
    deposit: Deposit
  ) {
    if (
      processing ||
      deposit.status !==
        "pending"
    ) {
      return;
    }

    const note =
      window.prompt(
        "Enter rejection reason:"
      );

    if (
      note === null
    ) {
      return;
    }

    const rejectionNote =
      note.trim() ||
      "Deposit rejected by EarnNova Team.";

    setProcessing(
      deposit.id
    );

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          "admin_reject_deposit",
          {
            p_deposit_id:
              deposit.id,
            p_admin_note:
              rejectionNote,
          }
        );

      if (error) {
        console.error(
          "REJECT ERROR:",
          error
        );

        throw new Error(
          error.message
        );
      }

      const result =
        normalizeRpcResult(
          data
        );

      if (
        result.success === false
      ) {
        throw new Error(
          getRpcMessage(
            data,
            "Deposit rejection failed."
          )
        );
      }

      setSelectedDeposit(
        null
      );

      setSuccessMessage(
        getRpcMessage(
          data,
          "Deposit rejected successfully."
        )
      );

      await loadDeposits();
    } catch (error) {
      console.error(
        "REJECT DEPOSIT ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to reject deposit."
      );
    } finally {
      setProcessing(
        null
      );
    }
  }

  /* =======================================================
     FILTERED DEPOSITS
  ======================================================= */

  const filteredDeposits =
    useMemo(() => {
      const searchText =
        search
          .toLowerCase()
          .trim();

      return deposits.filter(
        (deposit) => {
          const profile =
            deposit.profile;

          const matchesSearch =
            !searchText ||
            deposit.id
              .toLowerCase()
              .includes(
                searchText
              ) ||
            deposit.user_id
              .toLowerCase()
              .includes(
                searchText
              ) ||
            deposit.method
              .toLowerCase()
              .includes(
                searchText
              ) ||
            profile?.full_name
              ?.toLowerCase()
              .includes(
                searchText
              ) ||
            profile?.email
              ?.toLowerCase()
              .includes(
                searchText
              ) ||
            deposit.transaction_id
              ?.toLowerCase()
              .includes(
                searchText
              );

          const matchesStatus =
            statusFilter ===
              "all" ||
            deposit.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      deposits,
      search,
      statusFilter,
    ]);

  /* =======================================================
     STATS
  ======================================================= */

  const pendingCount =
    deposits.filter(
      (item) =>
        item.status ===
        "pending"
    ).length;

  const pendingAmount =
    deposits
      .filter(
        (item) =>
          item.status ===
          "pending"
      )
      .reduce(
        (sum, item) =>
          sum + item.amount,
        0
      );

  const approvedAmount =
    deposits
      .filter(
        (item) =>
          item.status ===
          "approved"
      )
      .reduce(
        (sum, item) =>
          sum + item.amount,
        0
      );

  /* =======================================================
     DATE
  ======================================================= */

  function formatDate(
    date: string
  ) {
    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "Unknown";
    }

    return parsed.toLocaleString();
  }

  /* =======================================================
     STATUS BADGE
  ======================================================= */

  function statusBadge(
    status: DepositStatus
  ) {
    if (
      status ===
      "approved"
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
          <CheckCircle
            size={12}
          />
          Approved
        </span>
      );
    }

    if (
      status ===
      "rejected"
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-red-400">
          <XCircle
            size={12}
          />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-400">
        <Clock size={12} />
        Pending
      </span>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#070b10] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                router.push(
                  "/admin"
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/40 hover:bg-[#151b23] hover:text-white"
              aria-label="Back to admin"
            >
              <ArrowLeft
                size={18}
              />
            </button>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-500">
                EarnNova Team
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight text-white">
                Deposits
              </h1>

              <p className="mt-1 text-xs text-slate-500">
                Review and manage customer
                deposit requests.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setSuccessMessage("");
              setErrorMessage("");
              void loadDeposits();
            }}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
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
        </header>

        {/* =================================================
            MESSAGES
        ================================================= */}

        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
            <span>
              {successMessage}
            </span>

            <button
              onClick={() =>
                setSuccessMessage("")
              }
              className="text-emerald-400 transition hover:text-white"
              aria-label="Close message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* =================================================
            STATS
        ================================================= */}

        <section className="mb-6 grid gap-4 sm:grid-cols-3">

          <StatCard
            title="Pending Deposits"
            value={String(
              pendingCount
            )}
            icon={
              <Clock size={20} />
            }
            type="warning"
          />

          <StatCard
            title="Pending Amount"
            value={`$${pendingAmount.toFixed(
              2
            )}`}
            icon={
              <DollarSign
                size={20}
              />
            }
            type="blue"
          />

          <StatCard
            title="Approved Amount"
            value={`$${approvedAmount.toFixed(
              2
            )}`}
            icon={
              <CheckCircle
                size={20}
              />
            }
            type="success"
          />

        </section>

        {/* =================================================
            FILTERS
        ================================================= */}

        <section className="mb-5 rounded-2xl border border-slate-800 bg-[#11151b] p-4">

          <div className="flex flex-col gap-3 lg:flex-row">

            <div className="relative flex-1">

              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search user, email, transaction ID..."
                className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
              />

            </div>

            <div className="grid grid-cols-4 gap-2 lg:w-[420px]">

              {(
                [
                  [
                    "all",
                    "All",
                  ],
                  [
                    "pending",
                    "Pending",
                  ],
                  [
                    "approved",
                    "Approved",
                  ],
                  [
                    "rejected",
                    "Rejected",
                  ],
                ] as const
              ).map(
                ([
                  value,
                  label,
                ]) => (
                  <button
                    key={value}
                    onClick={() =>
                      setStatusFilter(
                        value
                      )
                    }
                    className={`rounded-xl px-3 py-3 text-xs font-bold transition ${
                      statusFilter ===
                      value
                        ? "bg-blue-600 text-white"
                        : "border border-slate-800 bg-[#0b0f14] text-slate-500 hover:bg-[#151b23] hover:text-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}

            </div>

          </div>
        </section>

        {/* =================================================
            TABLE
        ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#11151b]">

          <div className="border-b border-slate-800 px-5 py-4">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-black text-white">
                  Deposit Requests
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  {filteredDeposits.length}{" "}
                  request
                  {filteredDeposits.length ===
                  1
                    ? ""
                    : "s"}
                </p>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                <ShieldCheck
                  size={18}
                  className="text-blue-500"
                />
              </div>

            </div>
          </div>

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center">
              <div className="text-center">

                <RefreshCw
                  size={25}
                  className="mx-auto animate-spin text-blue-500"
                />

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Loading deposits...
                </p>

              </div>
            </div>
          ) : filteredDeposits.length ===
            0 ? (
            /* EMPTY */
            <div className="flex min-h-[320px] flex-col items-center justify-center px-5 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-[#0b0f14] text-slate-600">
                <DollarSign
                  size={25}
                />
              </div>

              <h3 className="mt-4 font-bold text-white">
                No deposit requests
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Deposit requests will
                appear here.
              </p>

            </div>
          ) : (
            /* TABLE */
            <div className="overflow-x-auto">

              <table className="w-full min-w-[950px]">

                <thead>
                  <tr className="border-b border-slate-800 bg-[#0b0f14] text-left">

                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      User
                    </th>

                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Amount
                    </th>

                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Method
                    </th>

                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Transaction
                    </th>

                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Status
                    </th>

                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Date
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {filteredDeposits.map(
                    (deposit) => (
                      <tr
                        key={
                          deposit.id
                        }
                        className="border-b border-slate-800/70 transition hover:bg-[#151b23]"
                      >

                        {/* USER */}

                        <td className="px-5 py-4">

                          <div>
                            <p className="text-sm font-bold text-white">
                              {deposit
                                .profile
                                ?.full_name ||
                                "Unknown User"}
                            </p>

                            <p className="mt-1 max-w-[220px] truncate text-[10px] text-slate-600">
                              {deposit
                                .profile
                                ?.email ||
                                deposit.user_id}
                            </p>
                          </div>

                        </td>

                        {/* AMOUNT */}

                        <td className="px-5 py-4">

                          <p className="text-sm font-black text-white">
                            $
                            {deposit.amount.toFixed(
                              2
                            )}
                          </p>

                        </td>

                        {/* METHOD */}

                        <td className="px-5 py-4">

                          <span className="inline-flex rounded-lg border border-slate-800 bg-[#0b0f14] px-2.5 py-1.5 text-[10px] font-bold text-slate-400">
                            {
                              deposit.method
                            }
                          </span>

                        </td>

                        {/* TRANSACTION */}

                        <td className="px-5 py-4">

                          <p className="max-w-[160px] truncate text-xs text-slate-500">
                            {deposit
                              .transaction_id ||
                              "Not provided"}
                          </p>

                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">
                          {statusBadge(
                            deposit.status
                          )}
                        </td>

                        {/* DATE */}

                        <td className="px-5 py-4">

                          <p className="text-[10px] text-slate-500">
                            {formatDate(
                              deposit.created_at
                            )}
                          </p>

                        </td>

                        {/* ACTION */}

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            {/* VIEW */}

                            <button
                              onClick={() =>
                                setSelectedDeposit(
                                  deposit
                                )
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-[#0b0f14] text-slate-500 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400"
                              title="View deposit"
                            >
                              <Eye
                                size={16}
                              />
                            </button>

                            {/* APPROVE */}

                            {deposit.status ===
                              "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    void approveDeposit(
                                      deposit
                                    )
                                  }
                                  disabled={
                                    processing ===
                                    deposit.id
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                                  title="Approve deposit"
                                >
                                  {processing ===
                                  deposit.id ? (
                                    <RefreshCw
                                      size={
                                        16
                                      }
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <CheckCircle
                                      size={
                                        16
                                      }
                                    />
                                  )}
                                </button>

                                {/* REJECT */}

                                <button
                                  onClick={() =>
                                    void rejectDeposit(
                                      deposit
                                    )
                                  }
                                  disabled={
                                    processing ===
                                    deposit.id
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                                  title="Reject deposit"
                                >
                                  {processing ===
                                  deposit.id ? (
                                    <RefreshCw
                                      size={
                                        16
                                      }
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <XCircle
                                      size={
                                        16
                                      }
                                    />
                                  )}
                                </button>
                              </>
                            )}

                          </div>

                        </td>

                      </tr>
                    )
                  )}
                </tbody>

              </table>
            </div>
          )}
        </section>
      </div>

      {/* ===================================================
          DETAILS MODAL
      =================================================== */}

      {selectedDeposit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelectedDeposit(
                null
              );
            }
          }}
        >
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-[#11151b] p-6 shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-start justify-between">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-500">
                  Deposit Details
                </p>

                <h2 className="mt-1 text-2xl font-black text-white">
                  $
                  {selectedDeposit.amount.toFixed(
                    2
                  )}
                </h2>

              </div>

              <button
                onClick={() =>
                  setSelectedDeposit(
                    null
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#0b0f14] text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
                aria-label="Close"
              >
                <X size={18} />
              </button>

            </div>

            {/* DETAILS */}

            <div className="mt-5 space-y-3">

              <DetailRow
                label="User"
                value={
                  selectedDeposit
                    .profile
                    ?.full_name ||
                  "Unknown User"
                }
              />

              <DetailRow
                label="Email"
                value={
                  selectedDeposit
                    .profile
                    ?.email ||
                  "N/A"
                }
              />

              <DetailRow
                label="User ID"
                value={
                  selectedDeposit.user_id
                }
              />

              <DetailRow
                label="Amount"
                value={`$${selectedDeposit.amount.toFixed(
                  2
                )} USD`}
              />

              <DetailRow
                label="Method"
                value={
                  selectedDeposit.method
                }
              />

              <DetailRow
                label="Transaction ID"
                value={
                  selectedDeposit
                    .transaction_id ||
                  "Not provided"
                }
              />

              <DetailRow
                label="Status"
                value={
                  selectedDeposit.status
                }
              />

              <DetailRow
                label="Created"
                value={formatDate(
                  selectedDeposit.created_at
                )}
              />

              {selectedDeposit.admin_note && (
                <DetailRow
                  label="EarnNova Team Note"
                  value={
                    selectedDeposit.admin_note
                  }
                />
              )}

            </div>

            {/* ACTIONS */}

            {selectedDeposit.status ===
              "pending" && (
              <div className="mt-6 grid grid-cols-2 gap-3">

                <button
                  onClick={() =>
                    void rejectDeposit(
                      selectedDeposit
                    )
                  }
                  disabled={
                    processing ===
                    selectedDeposit.id
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {processing ===
                  selectedDeposit.id ? (
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <XCircle
                      size={17}
                    />
                  )}

                  Reject
                </button>

                <button
                  onClick={() =>
                    void approveDeposit(
                      selectedDeposit
                    )
                  }
                  disabled={
                    processing ===
                    selectedDeposit.id
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {processing ===
                  selectedDeposit.id ? (
                    <RefreshCw
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <CheckCircle
                      size={17}
                    />
                  )}

                  Approve
                </button>

              </div>
            )}

          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
  type,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  type:
    | "warning"
    | "blue"
    | "success";
}) {
  const styles = {
    warning: {
      box:
        "border-amber-500/20 bg-amber-500/5",
      icon:
        "border-amber-500/20 bg-amber-500/10 text-amber-400",
    },

    blue: {
      box:
        "border-blue-500/20 bg-blue-500/5",
      icon:
        "border-blue-500/20 bg-blue-500/10 text-blue-400",
    },

    success: {
      box:
        "border-emerald-500/20 bg-emerald-500/5",
      icon:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    },
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${styles[type].box}`}
    >
      <div className="flex items-center justify-between">

        <div>

          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-black text-white">
            {value}
          </p>

        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${styles[type].icon}`}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}

/* =========================================================
   DETAIL ROW
========================================================= */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-3">

      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 break-all text-xs font-semibold text-slate-300">
        {value}
      </p>

    </div>
  );
}