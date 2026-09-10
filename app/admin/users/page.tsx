"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  ArrowLeft,
  Search,
  Users,
  ShieldCheck,
  ShieldBan,
  RefreshCw,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";

/* =========================================================
   SUPABASE
========================================================= */

const supabase = createClient();

/* =========================================================
   TYPES
========================================================= */

type User = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  wallet: number | null;
  pending_balance: number | null;
  total_earned: number | null;
  total_referrals: number | null;
  membership: string | null;
  is_blocked: boolean | null;
  block_reason: string | null;
  created_at: string | null;
};

/* =========================================================
   PAGE
========================================================= */

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] =
    useState<User[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [showBlockModal, setShowBlockModal] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState<User | null>(null);

  const [blockReason, setBlockReason] =
    useState("");

  /* =======================================================
     CHECK ADMIN
  ======================================================= */

  const checkAdmin =
    useCallback(async () => {
      const {
        data: {
          user,
        },
        error: authError,
      } =
        await supabase.auth.getUser();

      if (
        authError ||
        !user
      ) {
        router.replace(
          "/admin/login"
        );

        return false;
      }

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
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
        profile?.role !==
          "admin"
      ) {
        router.replace(
          "/dashboard"
        );

        return false;
      }

      return true;
    }, [router]);

  /* =======================================================
     LOAD USERS
  ======================================================= */

  const loadUsers =
    useCallback(async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const allowed =
          await checkAdmin();

        if (!allowed) {
          return;
        }

        const {
          data,
          error,
        } =
          await supabase
            .from("profiles")
            .select(
              `
                id,
                full_name,
                email,
                role,
                wallet,
                pending_balance,
                total_earned,
                total_referrals,
                membership,
                is_blocked,
                block_reason,
                created_at
              `
            )
            .eq(
              "role",
              "customer"
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

        if (error) {
          console.error(
            "Users load error:",
            error
          );

          throw new Error(
            error.message
          );
        }

        setUsers(
          (data as User[]) ??
            []
        );
      } catch (error) {
        console.error(
          "LOAD USERS ERROR:",
          error
        );

        setUsers([]);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load users."
        );
      } finally {
        setLoading(false);
      }
    }, [checkAdmin]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  /* =======================================================
     OPEN BLOCK MODAL
  ======================================================= */

  function openBlockModal(
    user: User
  ) {
    setSelectedUser(
      user
    );

    setBlockReason(
      user.block_reason ??
        ""
    );

    setMessage("");
    setErrorMessage("");

    setShowBlockModal(
      true
    );
  }

  /* =======================================================
     CLOSE BLOCK MODAL
  ======================================================= */

  function closeBlockModal() {
    if (processingId) {
      return;
    }

    setShowBlockModal(
      false
    );

    setSelectedUser(
      null
    );

    setBlockReason("");
  }

  /* =======================================================
     BLOCK USER
  ======================================================= */

  async function blockUser() {
    if (
      !selectedUser ||
      processingId
    ) {
      return;
    }

    const cleanReason =
      blockReason.trim();

    if (!cleanReason) {
      setErrorMessage(
        "Please enter a reason for blocking this user."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Block "${selectedUser.full_name || selectedUser.email || "this user"}"?\n\nThis user will not be allowed to use EarnNova earning features.`
      );

    if (!confirmed) {
      return;
    }

    setProcessingId(
      selectedUser.id
    );

    setErrorMessage("");
    setMessage("");

    try {
      const allowed =
        await checkAdmin();

      if (!allowed) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from("profiles")
          .update({
            is_blocked:
              true,
            block_reason:
              cleanReason,
          })
          .eq(
            "id",
            selectedUser.id
          )
          .eq(
            "role",
            "customer"
          );

      if (error) {
        throw new Error(
          error.message
        );
      }

      setUsers(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              selectedUser.id
                ? {
                    ...item,
                    is_blocked:
                      true,
                    block_reason:
                      cleanReason,
                  }
                : item
          )
      );

      setMessage(
        "User blocked successfully."
      );

      closeBlockModal();
    } catch (error) {
      console.error(
        "BLOCK USER ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to block user."
      );
    } finally {
      setProcessingId(
        null
      );
    }
  }

  /* =======================================================
     UNBLOCK USER
  ======================================================= */

  async function unblockUser(
    user: User
  ) {
    if (
      processingId
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Unblock "${user.full_name || user.email || "this user"}"?\n\nThis will restore the user's account access.`
      );

    if (!confirmed) {
      return;
    }

    setProcessingId(
      user.id
    );

    setErrorMessage("");
    setMessage("");

    try {
      const allowed =
        await checkAdmin();

      if (!allowed) {
        return;
      }

      const {
        error,
      } =
        await supabase
          .from("profiles")
          .update({
            is_blocked:
              false,
            block_reason:
              null,
          })
          .eq(
            "id",
            user.id
          )
          .eq(
            "role",
            "customer"
          );

      if (error) {
        throw new Error(
          error.message
        );
      }

      setUsers(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              user.id
                ? {
                    ...item,
                    is_blocked:
                      false,
                    block_reason:
                      null,
                  }
                : item
          )
      );

      setMessage(
        "User unblocked successfully."
      );
    } catch (error) {
      console.error(
        "UNBLOCK USER ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to unblock user."
      );
    } finally {
      setProcessingId(
        null
      );
    }
  }

  /* =======================================================
     FILTER USERS
  ======================================================= */

  const filteredUsers =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return users;
      }

      return users.filter(
        (user) =>
          user.full_name
            ?.toLowerCase()
            .includes(
              keyword
            ) ||
          user.email
            ?.toLowerCase()
            .includes(
              keyword
            ) ||
          user.id
            .toLowerCase()
            .includes(
              keyword
            )
      );
    }, [
      users,
      search,
    ]);

  /* =======================================================
     STATS
  ======================================================= */

  const totalUsers =
    users.length;

  const activeUsers =
    users.filter(
      (user) =>
        user.is_blocked !==
        true
    ).length;

  const blockedUsers =
    users.filter(
      (user) =>
        user.is_blocked ===
        true
    ).length;

  /* =======================================================
     DATE FORMAT
  ======================================================= */

  function formatDate(
    value: string | null
  ) {
    if (!value) {
      return "Unknown";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "Unknown";
    }

    return date.toLocaleDateString();
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#070b10] text-slate-100">

      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                router.push(
                  "/admin"
                )
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/30 hover:bg-[#151b23] hover:text-white"
              aria-label="Back to admin"
            >
              <ArrowLeft
                size={19}
              />
            </button>

            <div>

              <div className="flex items-center gap-2">

                <h1 className="text-2xl font-black tracking-tight text-white">
                  Users
                </h1>

                <span className="hidden rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-400 sm:inline-flex">
                  EarnNova Team
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Manage EarnNova customer accounts
              </p>

            </div>

          </div>

          <button
            onClick={() => {
              setMessage("");
              setErrorMessage("");
              void loadUsers();
            }}
            disabled={
              loading
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#11151b] px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-[#151b23] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <StatCard
            title="Total Users"
            value={String(
              totalUsers
            )}
            icon={
              <Users size={20} />
            }
            type="blue"
          />

          <StatCard
            title="Active Users"
            value={String(
              activeUsers
            )}
            icon={
              <ShieldCheck
                size={20}
              />
            }
            type="success"
          />

          <StatCard
            title="Blocked Users"
            value={String(
              blockedUsers
            )}
            icon={
              <ShieldBan
                size={20}
              />
            }
            type="danger"
          />

        </div>

        {/* =================================================
            MESSAGES
        ================================================= */}

        {message && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
            <CheckCircle
              size={17}
            />
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold leading-6 text-red-300">
            <XCircle
              size={17}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p>
                Unable to complete action
              </p>

              <p className="mt-1 text-xs font-medium text-red-400">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="mb-5 rounded-2xl border border-slate-800 bg-[#11151b] p-4">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <input
              type="text"
              value={
                search
              }
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search by name, email or user ID..."
              className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />

          </div>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading ? (

          <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-10 text-center">

            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-blue-500"
            />

            <p className="mt-3 text-sm font-semibold text-slate-500">
              Loading users...
            </p>

          </div>

        ) : filteredUsers.length ===
          0 ? (

          <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-10 text-center">

            <Users
              size={38}
              className="mx-auto text-slate-700"
            />

            <h2 className="mt-4 text-lg font-black text-white">
              No users found
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {search
                ? "No customer matches your search."
                : "There are currently no customer accounts."}
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {filteredUsers.map(
              (user) => {

                const blocked =
                  user.is_blocked ===
                  true;

                const processing =
                  processingId ===
                  user.id;

                return (
                  <div
                    key={
                      user.id
                    }
                    className={`rounded-2xl border bg-[#11151b] p-5 transition ${
                      blocked
                        ? "border-red-500/20"
                        : "border-slate-800 hover:border-slate-700"
                    }`}
                  >

                    <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                      {/* USER */}

                      <div className="flex min-w-0 items-center gap-4">

                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-black ${
                            blocked
                              ? "border border-red-500/20 bg-red-500/10 text-red-400"
                              : "border border-blue-500/20 bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {(
                            user.full_name?.charAt(
                              0
                            ) ||
                            "U"
                          ).toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="truncate font-black text-white">
                              {user.full_name ||
                                "Unnamed User"}
                            </h3>

                            <span
                              className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${
                                blocked
                                  ? "border-red-500/20 bg-red-500/10 text-red-400"
                                  : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                              }`}
                            >
                              {blocked
                                ? "Blocked"
                                : "Active"}
                            </span>

                          </div>

                          <p className="truncate text-sm text-slate-500">
                            {user.email ||
                              "No email"}
                          </p>

                          <p className="mt-1 truncate text-[10px] text-slate-700">
                            ID:{" "}
                            {
                              user.id
                            }
                          </p>

                          {blocked &&
                            user.block_reason && (
                              <p className="mt-2 max-w-md text-xs leading-5 text-red-400">
                                Reason:{" "}
                                {
                                  user.block_reason
                                }
                              </p>
                            )}

                        </div>

                      </div>

                      {/* STATS */}

                      <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4 xl:min-w-[500px]">

                        <UserStat
                          label="Wallet"
                          value={`$${(
                            Number(
                              user.wallet
                            ) ||
                            0
                          ).toFixed(
                            2
                          )}`}
                        />

                        <UserStat
                          label="Earned"
                          value={`$${(
                            Number(
                              user.total_earned
                            ) ||
                            0
                          ).toFixed(
                            2
                          )}`}
                        />

                        <UserStat
                          label="Referrals"
                          value={String(
                            user.total_referrals ||
                              0
                          )}
                        />

                        <UserStat
                          label="Membership"
                          value={
                            user.membership ||
                            "Free"
                          }
                        />

                      </div>

                      {/* ACTIONS */}

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="mr-1 text-[10px] text-slate-700">
                          Joined{" "}
                          {formatDate(
                            user.created_at
                          )}
                        </span>

                        <button
                          onClick={() =>
                            router.push(
                              `/admin/users/${user.id}`
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:border-slate-700 hover:bg-[#151b23] hover:text-white"
                        >
                          <Eye
                            size={16}
                          />
                          View
                        </button>

                        {blocked ? (

                          <button
                            onClick={() =>
                              void unblockUser(
                                user
                              )
                            }
                            disabled={
                              processing
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-400 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {processing ? (
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

                            {processing
                              ? "Working..."
                              : "Unblock"}
                          </button>

                        ) : (

                          <button
                            onClick={() =>
                              openBlockModal(
                                user
                              )
                            }
                            disabled={
                              processing
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Ban
                              size={
                                16
                              }
                            />

                            Block
                          </button>

                        )}

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

      {/* ===================================================
          BLOCK MODAL
      =================================================== */}

      {showBlockModal &&
        selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">

            <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#11151b] shadow-2xl">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-800 p-5">

                <div>

                  <div className="flex items-center gap-2">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                      <Ban
                        size={
                          18
                        }
                      />
                    </div>

                    <h2 className="font-black text-white">
                      Block User
                    </h2>

                  </div>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    This will mark the customer account as blocked.
                  </p>

                </div>

                <button
                  onClick={
                    closeBlockModal
                  }
                  disabled={
                    !!processingId
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#0b0f14] text-slate-500 transition hover:text-white disabled:opacity-50"
                >
                  <X
                    size={18}
                  />
                </button>

              </div>

              {/* BODY */}

              <div className="space-y-4 p-5">

                <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4">

                  <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                    Customer
                  </p>

                  <p className="mt-1 font-bold text-white">
                    {selectedUser.full_name ||
                      "Unnamed User"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedUser.email ||
                      "No email"}
                  </p>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Block Reason
                  </label>

                  <textarea
                    value={
                      blockReason
                    }
                    onChange={(e) =>
                      setBlockReason(
                        e.target
                          .value
                      )
                    }
                    rows={4}
                    disabled={
                      !!processingId
                    }
                    placeholder="e.g. Suspicious activity, abuse of earning system..."
                    className="w-full resize-none rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-red-500/50 disabled:opacity-50"
                  />

                  <p className="mt-1.5 text-[10px] text-slate-600">
                    This reason will be saved with the user's blocked status.
                  </p>

                </div>

                {errorMessage && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-semibold text-red-300">
                    {errorMessage}
                  </div>
                )}

              </div>

              {/* FOOTER */}

              <div className="flex gap-3 border-t border-slate-800 p-5">

                <button
                  onClick={
                    closeBlockModal
                  }
                  disabled={
                    !!processingId
                  }
                  className="flex-1 rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3 text-sm font-bold text-slate-400 transition hover:bg-[#151b23] hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={() =>
                    void blockUser()
                  }
                  disabled={
                    !!processingId
                  }
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processingId
                    ? "Blocking..."
                    : "Block User"}
                </button>

              </div>

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
  icon: React.ReactNode;
  type:
    | "blue"
    | "success"
    | "danger";
}) {
  const styles = {
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

    danger: {
      box:
        "border-red-500/20 bg-red-500/5",
      icon:
        "border-red-500/20 bg-red-500/10 text-red-400",
    },
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${styles[type].box}`}
    >

      <div className="flex items-center justify-between">

        <div>

          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
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
   USER STAT
========================================================= */

function UserStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-700">
        {label}
      </p>

      <p className="mt-1 truncate font-bold text-slate-200">
        {value}
      </p>

    </div>
  );
}