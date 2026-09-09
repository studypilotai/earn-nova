"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Deposit = {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  transaction_id: string | null;
  payment_proof: string | null;
  status: "pending" | "approved" | "rejected";
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

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDeposit, setSelectedDeposit] =
    useState<Deposit | null>(null);

  useEffect(() => {
    loadDeposits();
  }, []);

  async function loadDeposits() {
    setLoading(true);

    try {
      // --------------------------------------------------
      // 1. LOAD DEPOSITS
      // --------------------------------------------------

      const {
        data: depositData,
        error: depositsError,
      } = await supabase
        .from("deposits")
        .select(`
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
        `)
        .order("created_at", {
          ascending: false,
        });

      if (depositsError) {
        console.error(
          "DEPOSITS ERROR:",
          depositsError
        );

        alert(depositsError.message);
        return;
      }

      const rawDeposits = depositData || [];

      // --------------------------------------------------
      // 2. GET UNIQUE USER IDS
      // --------------------------------------------------

      const userIds = [
        ...new Set(
          rawDeposits.map(
            (deposit) => deposit.user_id
          )
        ),
      ];

      // --------------------------------------------------
      // 3. LOAD PROFILES SEPARATELY
      // --------------------------------------------------

      let profiles: Profile[] = [];

      if (userIds.length > 0) {
        const {
          data: profileData,
          error: profilesError,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            full_name,
            email
          `)
          .in("id", userIds);

        if (profilesError) {
          console.error(
            "PROFILES ERROR:",
            profilesError
          );

          // Deposits should still load even if
          // profile lookup fails.
          profiles = [];
        } else {
          profiles = profileData || [];
        }
      }

      // --------------------------------------------------
      // 4. CREATE PROFILE MAP
      // --------------------------------------------------

      const profileMap = new Map<
        string,
        {
          full_name: string | null;
          email: string | null;
        }
      >(
        profiles.map((profile) => [
          profile.id,
          {
            full_name: profile.full_name,
            email: profile.email,
          },
        ])
      );

      // --------------------------------------------------
      // 5. ATTACH PROFILE TO EACH DEPOSIT
      // --------------------------------------------------

      const formatted: Deposit[] =
        rawDeposits.map((item) => ({
          ...item,
          amount: Number(item.amount || 0),
          profile:
            profileMap.get(item.user_id) || null,
        }));

      setDeposits(formatted);
    } catch (error) {
      console.error(
        "LOAD DEPOSITS ERROR:",
        error
      );

      alert(
        "Unable to load deposit requests."
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // APPROVE DEPOSIT
  // --------------------------------------------------

  async function approveDeposit(
    deposit: Deposit
  ) {
    if (processing) return;

    const confirmed = window.confirm(
      `Approve $${deposit.amount.toFixed(
        2
      )} deposit for ${
        deposit.profile?.full_name ||
        deposit.profile?.email ||
        "this user"
      }?`
    );

    if (!confirmed) return;

    setProcessing(deposit.id);

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "admin_approve_deposit",
        {
          p_deposit_id: deposit.id,
          p_admin_note:
            "Deposit approved by admin.",
        }
      );

      if (error) {
        console.error(
          "APPROVE ERROR:",
          error
        );

        alert(error.message);
        return;
      }

      console.log(
        "APPROVED:",
        data
      );

      setSelectedDeposit(null);

      await loadDeposits();

      alert(
        "Deposit approved successfully."
      );
    } catch (error) {
      console.error(
        "APPROVE DEPOSIT ERROR:",
        error
      );

      alert(
        "Unable to approve deposit."
      );
    } finally {
      setProcessing(null);
    }
  }

  // --------------------------------------------------
  // REJECT DEPOSIT
  // --------------------------------------------------

  async function rejectDeposit(
    deposit: Deposit
  ) {
    if (processing) return;

    const note = window.prompt(
      "Enter rejection reason:"
    );

    if (note === null) return;

    setProcessing(deposit.id);

    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        "admin_reject_deposit",
        {
          p_deposit_id: deposit.id,
          p_admin_note:
            note.trim() ||
            "Deposit rejected by admin.",
        }
      );

      if (error) {
        console.error(
          "REJECT ERROR:",
          error
        );

        alert(error.message);
        return;
      }

      console.log(
        "REJECTED:",
        data
      );

      setSelectedDeposit(null);

      await loadDeposits();

      alert(
        "Deposit rejected."
      );
    } catch (error) {
      console.error(
        "REJECT DEPOSIT ERROR:",
        error
      );

      alert(
        "Unable to reject deposit."
      );
    } finally {
      setProcessing(null);
    }
  }

  // --------------------------------------------------
  // SEARCH + FILTER
  // --------------------------------------------------

  const filteredDeposits =
    deposits.filter((deposit) => {
      const profile =
        deposit.profile;

      const searchText =
        search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        deposit.id
          .toLowerCase()
          .includes(searchText) ||
        deposit.user_id
          .toLowerCase()
          .includes(searchText) ||
        deposit.method
          .toLowerCase()
          .includes(searchText) ||
        profile?.full_name
          ?.toLowerCase()
          .includes(searchText) ||
        profile?.email
          ?.toLowerCase()
          .includes(searchText) ||
        deposit.transaction_id
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        deposit.status ===
          statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  // --------------------------------------------------
  // STATS
  // --------------------------------------------------

  const pendingCount =
    deposits.filter(
      (item) =>
        item.status === "pending"
    ).length;

  const approvedAmount =
    deposits
      .filter(
        (item) =>
          item.status === "approved"
      )
      .reduce(
        (sum, item) =>
          sum + item.amount,
        0
      );

  const pendingAmount =
    deposits
      .filter(
        (item) =>
          item.status === "pending"
      )
      .reduce(
        (sum, item) =>
          sum + item.amount,
        0
      );

  // --------------------------------------------------
  // DATE
  // --------------------------------------------------

  function formatDate(
    date: string
  ) {
    return new Date(
      date
    ).toLocaleString();
  }

  // --------------------------------------------------
  // STATUS BADGE
  // --------------------------------------------------

  function statusBadge(
    status: Deposit["status"]
  ) {
    if (status === "approved") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-400">
          <CheckCircle size={12} />
          Approved
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-red-400">
          <XCircle size={12} />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-400">
        <Clock size={12} />
        Pending
      </span>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-6 text-[#111827] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">

            <a
              href="/admin"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
            </a>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                EarnNova Admin
              </p>

              <h1 className="mt-1 text-2xl font-black">
                Deposits
              </h1>
            </div>
          </div>

          <button
            onClick={loadDeposits}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
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

        {/* STATS */}

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

        {/* FILTERS */}

        <section className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="flex flex-col gap-3 lg:flex-row">

            <div className="relative flex-1">

              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search user, email, transaction ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-4 gap-2 lg:w-[420px]">

              {[
                ["all", "All"],
                ["pending", "Pending"],
                [
                  "approved",
                  "Approved",
                ],
                [
                  "rejected",
                  "Rejected",
                ],
              ].map(
                ([value, label]) => (
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
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {/* TABLE */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="border-b border-slate-200 px-5 py-4">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-black">
                  Deposit Requests
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  {
                    filteredDeposits.length
                  }{" "}
                  request
                  {filteredDeposits.length ===
                  1
                    ? ""
                    : "s"}
                </p>
              </div>

              <ShieldCheck
                size={20}
                className="text-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">

              <div className="text-center">

                <RefreshCw
                  size={25}
                  className="mx-auto animate-spin text-blue-600"
                />

                <p className="mt-3 text-sm font-semibold text-slate-400">
                  Loading deposits...
                </p>

              </div>
            </div>
          ) : filteredDeposits.length ===
            0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <DollarSign
                  size={25}
                />
              </div>

              <h3 className="mt-4 font-bold">
                No deposit requests
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Deposit requests will
                appear here.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[900px]">

                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left">

                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      User
                    </th>

                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Amount
                    </th>

                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Method
                    </th>

                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Transaction
                    </th>

                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Date
                    </th>

                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>
                  {filteredDeposits.map(
                    (deposit) => (
                      <tr
                        key={deposit.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >

                        {/* USER */}

                        <td className="px-5 py-4">

                          <div>

                            <p className="text-sm font-bold text-slate-800">
                              {deposit
                                .profile
                                ?.full_name ||
                                "Unknown User"}
                            </p>

                            <p className="mt-1 text-[10px] text-slate-400">
                              {deposit
                                .profile
                                ?.email ||
                                deposit.user_id}
                            </p>

                          </div>

                        </td>

                        {/* AMOUNT */}

                        <td className="px-5 py-4">

                          <p className="text-sm font-black text-slate-800">
                            $
                            {deposit.amount.toFixed(
                              2
                            )}
                          </p>

                        </td>

                        {/* METHOD */}

                        <td className="px-5 py-4">

                          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[10px] font-bold text-slate-600">
                            {
                              deposit.method
                            }
                          </span>

                        </td>

                        {/* TRANSACTION */}

                        <td className="px-5 py-4">

                          <p className="max-w-[150px] truncate text-xs text-slate-500">
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
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                              title="View"
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
                                    approveDeposit(
                                      deposit
                                    )
                                  }
                                  disabled={
                                    processing ===
                                    deposit.id
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                  title="Approve"
                                >
                                  <CheckCircle
                                    size={
                                      16
                                    }
                                  />
                                </button>

                                {/* REJECT */}

                                <button
                                  onClick={() =>
                                    rejectDeposit(
                                      deposit
                                    )
                                  }
                                  disabled={
                                    processing ===
                                    deposit.id
                                  }
                                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white transition hover:bg-red-700 disabled:opacity-50"
                                  title="Reject"
                                >
                                  <XCircle
                                    size={
                                      16
                                    }
                                  />
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

      {/* DETAILS MODAL */}

      {selectedDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">

          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                  Deposit Details
                </p>

                <h2 className="mt-1 text-xl font-black">
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
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <XCircle
                  size={18}
                />
              </button>

            </div>

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
                  label="Admin Note"
                  value={
                    selectedDeposit.admin_note
                  }
                />
              )}

            </div>

            {selectedDeposit.status ===
              "pending" && (
              <div className="mt-6 grid grid-cols-2 gap-3">

                <button
                  onClick={() =>
                    rejectDeposit(
                      selectedDeposit
                    )
                  }
                  disabled={
                    processing ===
                    selectedDeposit.id
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle
                    size={17}
                  />
                  Reject
                </button>

                <button
                  onClick={() =>
                    approveDeposit(
                      selectedDeposit
                    )
                  }
                  disabled={
                    processing ===
                    selectedDeposit.id
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle
                    size={17}
                  />
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

// --------------------------------------------------
// STAT CARD
// --------------------------------------------------

function StatCard({
  title,
  value,
  icon,
  type,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  type:
    | "warning"
    | "blue"
    | "success";
}) {
  const styles = {
    warning: {
      box: "bg-amber-50 border-amber-100",
      icon: "bg-amber-100 text-amber-600",
    },

    blue: {
      box: "bg-blue-50 border-blue-100",
      icon: "bg-blue-100 text-blue-600",
    },

    success: {
      box: "bg-emerald-50 border-emerald-100",
      icon: "bg-emerald-100 text-emerald-600",
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

          <p className="mt-2 text-2xl font-black text-slate-900">
            {value}
          </p>

        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[type].icon}`}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}

// --------------------------------------------------
// DETAIL ROW
// --------------------------------------------------

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">

      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-all text-xs font-semibold text-slate-700">
        {value}
      </p>

    </div>
  );
}