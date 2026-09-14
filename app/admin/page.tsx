"use client";

import {
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import {
  Users,
  WalletCards,
  Download,
  Link2,
  ListChecks,
  Plus,
  RefreshCw,
  Wallet,
  Video,
  ChevronRight,
} from "lucide-react";

const supabase = createClient();

/* =========================================================
   TYPES
========================================================= */

type Task = {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  task_url: string | null;
  status: string;
};

type ProfileWallet = {
  wallet: number | string | null;
};

type ProfileReferral = {
  total_referrals: number | string | null;
};

type StatCardProps = {
  title: string;
  value: string;
  icon: ReactNode;
};

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

export default function AdminDashboard() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [totalUsers, setTotalUsers] =
    useState(0);

  const [totalWallet, setTotalWallet] =
    useState(0);

  const [pendingWithdrawals, setPendingWithdrawals] =
    useState(0);

  const [totalReferrals, setTotalReferrals] =
    useState(0);

  const [tasks, setTasks] =
    useState<Task[]>([]);

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = useCallback(
    async () => {
      try {
        setRefreshing(true);

        /* =====================================================
           AUTH USER
        ===================================================== */

        const {
          data: { user },
          error: authError,
        } =
          await supabase.auth.getUser();

        if (authError || !user) {
          router.replace(
            "/admin/login"
          );
          return;
        }

        /* =====================================================
           ADMIN ROLE CHECK
        ===================================================== */

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (
          profileError ||
          !profile ||
          profile.role !== "admin"
        ) {
          await supabase.auth.signOut();

          clearLocalStorage();

          router.replace(
            "/admin/login"
          );

          return;
        }

        /* =====================================================
           LOAD DASHBOARD DATA
        ===================================================== */

        const [
          usersResult,
          profilesResult,
          withdrawalsResult,
          referralsResult,
          tasksResult,
        ] = await Promise.all([
          /* ---------------------------------------------------
             TOTAL CUSTOMERS
          --------------------------------------------------- */

          supabase
            .from("profiles")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("role", "customer"),

          /* ---------------------------------------------------
             CUSTOMER WALLETS
          --------------------------------------------------- */

          supabase
            .from("profiles")
            .select("wallet")
            .eq("role", "customer"),

          /* ---------------------------------------------------
             PENDING WITHDRAWALS
          --------------------------------------------------- */

          supabase
            .from("withdrawals")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("status", "pending"),

          /* ---------------------------------------------------
             TOTAL REFERRALS
          --------------------------------------------------- */

          supabase
            .from("profiles")
            .select(
              "total_referrals"
            )
            .eq("role", "customer"),

          /* ---------------------------------------------------
             TASKS
          --------------------------------------------------- */

          supabase
            .from("tasks")
            .select(
              `
                id,
                title,
                description,
                reward,
                task_url,
                status
              `
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            ),
        ]);

        /* =====================================================
           ERROR LOGGING
        ===================================================== */

        if (usersResult.error) {
          console.error(
            "Users error:",
            usersResult.error
          );
        }

        if (profilesResult.error) {
          console.error(
            "Wallet profiles error:",
            profilesResult.error
          );
        }

        if (withdrawalsResult.error) {
          console.error(
            "Withdrawals error:",
            withdrawalsResult.error
          );
        }

        if (referralsResult.error) {
          console.error(
            "Referrals error:",
            referralsResult.error
          );
        }

        if (tasksResult.error) {
          console.error(
            "Tasks error:",
            tasksResult.error
          );
        }

        /* =====================================================
           TOTAL WALLET
        ===================================================== */

        const walletProfiles =
          (profilesResult.data ||
            []) as ProfileWallet[];

        const walletTotal =
          walletProfiles.reduce(
            (
              sum: number,
              profile: ProfileWallet
            ) =>
              sum +
              Number(
                profile.wallet || 0
              ),
            0
          );

        /* =====================================================
           TOTAL REFERRALS
        ===================================================== */

        const referralProfiles =
          (referralsResult.data ||
            []) as ProfileReferral[];

        const referralTotal =
          referralProfiles.reduce(
            (
              sum: number,
              profile: ProfileReferral
            ) =>
              sum +
              Number(
                profile.total_referrals ||
                  0
              ),
            0
          );

        /* =====================================================
           UPDATE STATE
        ===================================================== */

        setTotalUsers(
          usersResult.count || 0
        );

        setTotalWallet(
          walletTotal
        );

        setPendingWithdrawals(
          withdrawalsResult.count ||
            0
        );

        setTotalReferrals(
          referralTotal
        );

        setTasks(
          (tasksResult.data ||
            []) as Task[]
        );
      } catch (error) {
        console.error(
          "Admin dashboard error:",
          error
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  /* =========================================================
     CLEAR LOCAL STORAGE
  ========================================================= */

  function clearLocalStorage() {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    localStorage.removeItem(
      "earnNovaLoggedIn"
    );

    localStorage.removeItem(
      "earnNovaUserEmail"
    );

    localStorage.removeItem(
      "earnNovaUserName"
    );

    localStorage.removeItem(
      "earnNovaUserId"
    );

    localStorage.removeItem(
      "earnNovaSelectedPlan"
    );

    localStorage.removeItem(
      "earnNovaActivation"
    );

    localStorage.removeItem(
      "earnNovaReferralCode"
    );

    localStorage.removeItem(
      "earnNovaRemember"
    );
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-medium text-slate-500 shadow-sm">
          <RefreshCw
            size={18}
            className="animate-spin text-blue-600"
          />

          Loading dashboard...
        </div>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-100">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <header className="border-b border-slate-200 bg-white">
        <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              EarnNova Team Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your EarnNova platform
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/add-balance"
                )
              }
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Wallet size={18} />

              Add Balance
            </button>

            <button
              type="button"
              onClick={() =>
                void loadDashboard()
              }
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

          </div>
        </div>
      </header>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <main className="p-4 sm:p-6 lg:p-8">

        {/* ===================================================
            STATS
        ==================================================== */}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Users"
            value={totalUsers.toString()}
            icon={
              <Users size={24} />
            }
          />

          <StatCard
            title="Total Wallet"
            value={`$${totalWallet.toFixed(
              2
            )}`}
            icon={
              <WalletCards
                size={24}
              />
            }
          />

          <StatCard
            title="Pending Withdrawals"
            value={pendingWithdrawals.toString()}
            icon={
              <Download size={24} />
            }
          />

          <StatCard
            title="Total Referrals"
            value={totalReferrals.toString()}
            icon={
              <Link2 size={24} />
            }
          />

        </div>

        {/* ===================================================
            QUICK ACTIONS ROW 1
        ==================================================== */}

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">

          <QuickAction
            href="/admin/add-balance"
            icon={
              <Wallet size={22} />
            }
            title="Add Balance"
            description="Add funds to any user wallet"
          />

          <QuickAction
            href="/admin/deposits"
            icon={
              <WalletCards
                size={22}
              />
            }
            title="Deposits"
            description="Manage deposit requests"
          />

          <QuickAction
            href="/admin/videos"
            icon={
              <Video size={22} />
            }
            title="Videos"
            description="Manage earning videos"
          />

        </div>

        {/* ===================================================
            QUICK ACTIONS ROW 2
        ==================================================== */}

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">

          <QuickAction
            href="/admin/tasks"
            icon={
              <ListChecks
                size={22}
              />
            }
            title="Tasks"
            description="Create and manage tasks"
          />

          <QuickAction
            href="/admin/withdrawals"
            icon={
              <Download
                size={22}
              />
            }
            title="Withdrawals"
            description="Review withdrawal requests"
          />

          <QuickAction
            href="/admin/users"
            icon={
              <Users size={22} />
            }
            title="Users"
            description="Manage platform users"
          />

        </div>

        {/* ===================================================
            TASK MANAGEMENT
        ==================================================== */}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* HEADER */}

          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Tasks Management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Create and manage earning
                tasks for users.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/tasks"
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={18} />

              Add Task
            </button>

          </div>

          {/* NO TASKS */}

          {tasks.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
                <ListChecks
                  size={30}
                  className="text-slate-500"
                />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                No tasks yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Add your first earning task.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/admin/tasks"
                  )
                }
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={18} />

                Add First Task
              </button>

            </div>
          ) : (

            /* =================================================
               TASK LIST
            ================================================= */

            <div className="divide-y divide-slate-200">

              {tasks
                .slice(0, 5)
                .map((task: Task) => (

                  <div
                    key={task.id}
                    className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >

                    <div className="min-w-0">

                      <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                          <ListChecks
                            size={20}
                            className="text-blue-600"
                          />
                        </div>

                        <div className="min-w-0">

                          <h3 className="truncate font-semibold text-slate-900">
                            {task.title}
                          </h3>

                          <p className="truncate text-sm text-slate-500">
                            {task.description ||
                              "No description"}
                          </p>

                        </div>

                      </div>

                    </div>

                    <div className="flex items-center justify-between gap-4 sm:justify-end">

                      {/* ADMIN CAN SEE REWARD */}

                      <span className="font-bold text-green-600">
                        +$
                        {Number(
                          task.reward || 0
                        ).toFixed(2)}
                      </span>

                      {/* STATUS */}

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          task.status ===
                          "active"
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {task.status}
                      </span>

                    </div>

                  </div>

                ))}

              {/* VIEW ALL */}

              {tasks.length > 5 && (
                <div className="border-t border-slate-200 p-4 text-center">

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        "/admin/tasks"
                      )
                    }
                    className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-500"
                  >
                    View all tasks

                    <ChevronRight
                      size={15}
                    />
                  </button>

                </div>
              )}

            </div>
          )}

        </div>

      </main>
    </div>
  );
}

/* =========================================================
   QUICK ACTION
========================================================= */

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        window.location.assign(
          href
        )
      }
      className="group w-full rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-center gap-4">

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
          {icon}
        </div>

        <div className="min-w-0">

          <h3 className="font-bold text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>

        </div>

      </div>
    </button>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

      <div className="flex items-center justify-between gap-4">

        <div className="min-w-0">

          <p className="truncate text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-2xl font-bold text-slate-900">
            {value}
          </p>

        </div>

        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          {icon}
        </div>

      </div>

    </div>
  );
}