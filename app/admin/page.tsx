"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Users,
  WalletCards,
  Download,
  Link2,
  ListChecks,
  Plus,
  RefreshCw,
  Wallet,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Task = {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  task_url: string | null;
  status: string;
};

type StatCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalWallet, setTotalWallet] = useState(0);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [totalReferrals, setTotalReferrals] = useState(0);

  const [tasks, setTasks] = useState<Task[]>([]);

  async function loadDashboard() {
    try {
      setRefreshing(true);

      // ---------------------------------------------
      // CHECK AUTH
      // ---------------------------------------------

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/admin/login";
        return;
      }

      // ---------------------------------------------
      // CHECK ADMIN
      // ---------------------------------------------

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        window.location.href = "/admin/login";
        return;
      }

      if (profile?.role !== "admin") {
        window.location.href = "/dashboard";
        return;
      }

      // ---------------------------------------------
      // TOTAL USERS
      // ---------------------------------------------

      const { count: usersCount, error: usersError } =
        await supabase
          .from("profiles")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("role", "customer");

      if (usersError) {
        console.error("Users error:", usersError);
      }

      // ---------------------------------------------
      // TOTAL WALLET
      // ---------------------------------------------

      const { data: profiles, error: walletError } =
        await supabase
          .from("profiles")
          .select("wallet")
          .eq("role", "customer");

      if (walletError) {
        console.error("Wallet error:", walletError);
      }

      // ---------------------------------------------
      // PENDING WITHDRAWALS
      // ---------------------------------------------

      const {
        count: withdrawalsCount,
        error: withdrawalsError,
      } = await supabase
        .from("withdrawals")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "pending");

      if (withdrawalsError) {
        console.error(
          "Withdrawals error:",
          withdrawalsError
        );
      }

      // ---------------------------------------------
      // REFERRALS
      // ---------------------------------------------

      const {
        data: referralProfiles,
        error: referralError,
      } = await supabase
        .from("profiles")
        .select("total_referrals")
        .eq("role", "customer");

      if (referralError) {
        console.error(
          "Referral error:",
          referralError
        );
      }

      // ---------------------------------------------
      // TASKS
      // ---------------------------------------------

      const { data: taskData, error: taskError } =
        await supabase
          .from("tasks")
          .select(
            "id, title, description, reward, task_url, status"
          )
          .order("created_at", {
            ascending: false,
          });

      if (taskError) {
        console.error("Tasks error:", taskError);
      }

      // ---------------------------------------------
      // SET USERS
      // ---------------------------------------------

      setTotalUsers(usersCount || 0);

      // ---------------------------------------------
      // CALCULATE WALLET
      // ---------------------------------------------

      const walletTotal =
        profiles?.reduce(
          (sum, profile) =>
            sum + Number(profile.wallet || 0),
          0
        ) || 0;

      setTotalWallet(walletTotal);

      // ---------------------------------------------
      // SET WITHDRAWALS
      // ---------------------------------------------

      setPendingWithdrawals(
        withdrawalsCount || 0
      );

      // ---------------------------------------------
      // CALCULATE REFERRALS
      // ---------------------------------------------

      const referralTotal =
        referralProfiles?.reduce(
          (sum, profile) =>
            sum +
            Number(profile.total_referrals || 0),
          0
        ) || 0;

      setTotalReferrals(referralTotal);

      // ---------------------------------------------
      // SET TASKS
      // ---------------------------------------------

      setTasks((taskData || []) as Task[]);
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  // ---------------------------------------------
  // LOADING
  // ---------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 p-6">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="rounded-xl bg-white px-6 py-4 text-sm font-medium text-slate-500 shadow-sm">
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // DASHBOARD
  // ---------------------------------------------

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ==========================================
          HEADER
      ========================================== */}

      <div className="border-b border-slate-200 bg-white">
        <div className="flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">

          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500 sm:text-base">
              Manage your EarnNova platform
            </p>
          </div>

          <div className="flex items-center gap-3">

            {/* ADD BALANCE */}

            <a
              href="/admin/add-balance"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Wallet size={18} />

              <span className="hidden sm:inline">
                Add Balance
              </span>
            </a>

            {/* REFRESH */}

            <button
              onClick={loadDashboard}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* ==========================================
          CONTENT
      ========================================== */}

      <div className="p-5 sm:p-8">

        {/* ========================================
            STATS
        ======================================== */}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Total Users"
            value={totalUsers.toString()}
            icon={<Users size={24} />}
          />

          <StatCard
            title="Total Wallet"
            value={`$${totalWallet.toFixed(2)}`}
            icon={<WalletCards size={24} />}
          />

          <StatCard
            title="Pending Withdrawals"
            value={pendingWithdrawals.toString()}
            icon={<Download size={24} />}
          />

          <StatCard
            title="Total Referrals"
            value={totalReferrals.toString()}
            icon={<Link2 size={24} />}
          />

        </div>

        {/* ========================================
            QUICK ACTIONS
        ======================================== */}

        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">

          <a
            href="/admin/add-balance"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <Wallet size={22} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Add Balance
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Add funds to any user wallet
                </p>
              </div>

            </div>
          </a>

          <a
            href="/admin/deposits"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <WalletCards size={22} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Deposits
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Manage deposit requests
                </p>
              </div>

            </div>
          </a>

          <a
            href="/admin/tasks"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                <ListChecks size={22} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Tasks
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Create and manage tasks
                </p>
              </div>

            </div>
          </a>

        </div>

        {/* ========================================
            TASKS
        ======================================== */}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* TASK HEADER */}

          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                Tasks Management
              </h2>

              <p className="mt-1 text-sm text-slate-500 sm:text-base">
                Create and manage earning tasks for users.
              </p>

            </div>

            <a
              href="/admin/tasks"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={18} />

              Add Task
            </a>

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

              <a
                href="/admin/tasks"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                <Plus size={18} />

                Add First Task
              </a>

            </div>

          ) : (

            <div className="divide-y divide-slate-200">

              {tasks.slice(0, 5).map((task) => (

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

                    <span className="font-bold text-green-600">
                      +$
                      {Number(
                        task.reward || 0
                      ).toFixed(2)}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        task.status === "active"
                          ? "bg-green-50 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {task.status}
                    </span>

                  </div>

                </div>

              ))}

              {tasks.length > 5 && (
                <div className="border-t border-slate-200 p-4 text-center">

                  <a
                    href="/admin/tasks"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-500"
                  >
                    View all tasks →
                  </a>

                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

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