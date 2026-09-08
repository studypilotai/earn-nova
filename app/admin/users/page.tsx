"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Search,
  Users,
  ShieldCheck,
  ShieldBan,
  RefreshCw,
  Eye,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

export default function AdminUsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");

  async function loadUsers() {
    try {
      setLoading(true);
      setErrorMessage("");

      // Check logged-in admin
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/admin/login");
        return;
      }

      // Verify admin role
      const { data: adminProfile, error: adminError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (adminError || adminProfile?.role !== "admin") {
        router.replace("/dashboard");
        return;
      }

      // Load ALL customer profiles
      const { data, error } = await supabase
        .from("profiles")
        .select(`
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
        `)
        .eq("role", "customer")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Users load error:", error);
        setErrorMessage(error.message);
        setUsers([]);
        return;
      }

      setUsers((data as User[]) || []);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return users;

    return users.filter((user) => {
      return (
        user.full_name?.toLowerCase().includes(keyword) ||
        user.email?.toLowerCase().includes(keyword) ||
        user.id.toLowerCase().includes(keyword)
      );
    });
  }, [users, search]);

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => user.is_blocked !== true
  ).length;

  const blockedUsers = users.filter(
    (user) => user.is_blocked === true
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin")}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm transition hover:bg-slate-50"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Users
              </h1>
              <p className="text-sm text-slate-500">
                Manage EarnNova customer accounts
              </p>
            </div>
          </div>

          <button
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Users size={20} />
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Total Users
            </p>

            <p className="mt-1 text-2xl font-bold">
              {totalUsers}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <ShieldCheck size={20} />
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Active Users
            </p>

            <p className="mt-1 text-2xl font-bold">
              {activeUsers}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <ShieldBan size={20} />
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Blocked Users
            </p>

            <p className="mt-1 text-2xl font-bold">
              {blockedUsers}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or user ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <p className="font-semibold">
              Unable to load users
            </p>

            <p className="mt-1">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <RefreshCw
              size={28}
              className="mx-auto animate-spin text-blue-600"
            />

            <p className="mt-3 text-sm text-slate-500">
              Loading users...
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <Users
              size={38}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-lg font-semibold">
              No users found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "No customer matches your search."
                : "There are currently no customer accounts."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                  {/* User */}
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                      {(user.full_name?.charAt(0) || "U").toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">
                        {user.full_name || "Unnamed User"}
                      </h3>

                      <p className="truncate text-sm text-slate-500">
                        {user.email || "No email"}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        ID: {user.id}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4 lg:min-w-[500px]">
                    <div>
                      <p className="text-xs text-slate-400">
                        Wallet
                      </p>
                      <p className="mt-1 font-semibold">
                        ${(Number(user.wallet) || 0).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Earned
                      </p>
                      <p className="mt-1 font-semibold">
                        ${(Number(user.total_earned) || 0).toFixed(2)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Referrals
                      </p>
                      <p className="mt-1 font-semibold">
                        {user.total_referrals || 0}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Membership
                      </p>
                      <p className="mt-1 font-semibold">
                        {user.membership || "Free"}
                      </p>
                    </div>
                  </div>

                  {/* Status + View */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        user.is_blocked
                          ? "bg-red-50 text-red-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {user.is_blocked ? "Blocked" : "Active"}
                    </span>

                    <button
                      onClick={() =>
                        router.push(`/admin/users/${user.id}`)
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}