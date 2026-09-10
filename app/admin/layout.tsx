"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  Wallet,
  WalletCards,
  ArrowDownToLine,
  Link2,
  ListTodo,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
  Video,
  Plus,
} from "lucide-react";

const supabase = createClient();

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    checkAdmin();
  }, [isLoginPage]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  async function checkAdmin() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/admin/login");
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
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
        router.replace("/admin/login");
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error("Admin auth error:", error);
      router.replace("/admin/login");
    }
  }

  async function logout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("earnNovaLoggedIn");
      localStorage.removeItem("earnNovaUserEmail");
      localStorage.removeItem("earnNovaUserName");
      localStorage.removeItem("earnNovaUserId");
      localStorage.removeItem("earnNovaSelectedPlan");
      localStorage.removeItem("earnNovaActivation");
      localStorage.removeItem("earnNovaReferralCode");
      localStorage.removeItem("earnNovaRemember");

      router.replace("/admin/login");
      router.refresh();
    }
  }

  function navigate(path: string) {
    setMobileSidebarOpen(false);
    router.push(path);
  }

  function isActive(path: string) {
    if (path === "/admin") {
      return pathname === "/admin";
    }

    return (
      pathname === path ||
      pathname.startsWith(`${path}/`)
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 text-sm font-medium text-slate-600 shadow-sm">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          Loading EarnNova Team Panel...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* =====================================================
          DESKTOP SIDEBAR
      ====================================================== */}

      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 border-r border-slate-200 bg-white lg:block">
        {/* LOGO */}

        <div className="flex h-20 items-center border-b border-slate-200 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
            <ShieldCheck
              size={20}
              className="text-white"
            />
          </div>

          <div className="ml-3">
            <div className="font-bold text-slate-900">
              Earn
              <span className="text-blue-600">
                Nova
              </span>
            </div>

            <div className="text-xs text-slate-500">
              Team Panel
            </div>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav className="space-y-1 overflow-y-auto p-4 pb-24">
          <SidebarItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={isActive("/admin")}
            onClick={() => navigate("/admin")}
          />

          <SidebarItem
            icon={<Users size={18} />}
            label="Users"
            active={isActive("/admin/users")}
            onClick={() =>
              navigate("/admin/users")
            }
          />

          <SidebarItem
            icon={<Wallet size={18} />}
            label="Activations"
            active={isActive(
              "/admin/activations"
            )}
            onClick={() =>
              navigate("/admin/activations")
            }
          />

          <SidebarItem
            icon={<WalletCards size={18} />}
            label="Deposits"
            active={isActive(
              "/admin/deposits"
            )}
            onClick={() =>
              navigate("/admin/deposits")
            }
          />

          <SidebarItem
            icon={
              <ArrowDownToLine size={18} />
            }
            label="Withdrawals"
            active={isActive(
              "/admin/withdrawals"
            )}
            onClick={() =>
              navigate("/admin/withdrawals")
            }
          />

          <SidebarItem
            icon={<Video size={18} />}
            label="Videos"
            active={isActive(
              "/admin/videos"
            )}
            onClick={() =>
              navigate("/admin/videos")
            }
          />

          <SidebarItem
            icon={<ListTodo size={18} />}
            label="Tasks"
            active={isActive(
              "/admin/tasks"
            )}
            onClick={() =>
              navigate("/admin/tasks")
            }
          />

          <SidebarItem
            icon={<Link2 size={18} />}
            label="Referrals"
            active={isActive(
              "/admin/referrals"
            )}
            onClick={() =>
              navigate("/admin/referrals")
            }
          />

          <SidebarItem
            icon={<Plus size={18} />}
            label="Add Balance"
            active={isActive(
              "/admin/add-balance"
            )}
            onClick={() =>
              navigate("/admin/add-balance")
            }
          />

          <SidebarItem
            icon={<Settings size={18} />}
            label="Settings"
            active={isActive(
              "/admin/settings"
            )}
            onClick={() =>
              navigate("/admin/settings")
            }
          />
        </nav>

        {/* LOGOUT */}

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MOBILE TOP BAR
      ====================================================== */}

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:hidden">
        <div className="flex items-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <ShieldCheck
              size={18}
              className="text-white"
            />
          </div>

          <div className="ml-2">
            <div className="text-sm font-bold text-slate-900">
              Earn
              <span className="text-blue-600">
                Nova
              </span>
            </div>

            <div className="text-[10px] text-slate-500">
              Team Panel
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            setMobileSidebarOpen(
              (current) => !current
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white transition hover:bg-slate-50"
          aria-label="Toggle admin menu"
        >
          {mobileSidebarOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>
      </header>

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}

      {mobileSidebarOpen && (
        <div
          onClick={() =>
            setMobileSidebarOpen(false)
          }
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* =====================================================
          MOBILE SIDEBAR
      ====================================================== */}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[280px] max-w-[85vw] transform border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        {/* MOBILE HEADER */}

        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <div className="flex items-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <ShieldCheck
                size={18}
                className="text-white"
              />
            </div>

            <div className="ml-2">
              <div className="text-sm font-bold text-slate-900">
                Earn
                <span className="text-blue-600">
                  Nova
                </span>
              </div>

              <div className="text-[10px] text-slate-500">
                Team Panel
              </div>
            </div>
          </div>

          <button
            onClick={() =>
              setMobileSidebarOpen(false)
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        {/* MOBILE NAV */}

        <nav className="space-y-1 overflow-y-auto p-3 pb-24">
          <MobileSidebarItem
            icon={
              <LayoutDashboard size={18} />
            }
            label="Dashboard"
            active={isActive("/admin")}
            onClick={() => navigate("/admin")}
          />

          <MobileSidebarItem
            icon={<Users size={18} />}
            label="Users"
            active={isActive("/admin/users")}
            onClick={() =>
              navigate("/admin/users")
            }
          />

          <MobileSidebarItem
            icon={<Wallet size={18} />}
            label="Activations"
            active={isActive(
              "/admin/activations"
            )}
            onClick={() =>
              navigate("/admin/activations")
            }
          />

          <MobileSidebarItem
            icon={<WalletCards size={18} />}
            label="Deposits"
            active={isActive(
              "/admin/deposits"
            )}
            onClick={() =>
              navigate("/admin/deposits")
            }
          />

          <MobileSidebarItem
            icon={
              <ArrowDownToLine size={18} />
            }
            label="Withdrawals"
            active={isActive(
              "/admin/withdrawals"
            )}
            onClick={() =>
              navigate("/admin/withdrawals")
            }
          />

          <MobileSidebarItem
            icon={<Video size={18} />}
            label="Videos"
            active={isActive(
              "/admin/videos"
            )}
            onClick={() =>
              navigate("/admin/videos")
            }
          />

          <MobileSidebarItem
            icon={<ListTodo size={18} />}
            label="Tasks"
            active={isActive(
              "/admin/tasks"
            )}
            onClick={() =>
              navigate("/admin/tasks")
            }
          />

          <MobileSidebarItem
            icon={<Link2 size={18} />}
            label="Referrals"
            active={isActive(
              "/admin/referrals"
            )}
            onClick={() =>
              navigate("/admin/referrals")
            }
          />

          <MobileSidebarItem
            icon={<Plus size={18} />}
            label="Add Balance"
            active={isActive(
              "/admin/add-balance"
            )}
            onClick={() =>
              navigate("/admin/add-balance")
            }
          />

          <MobileSidebarItem
            icon={<Settings size={18} />}
            label="Settings"
            active={isActive(
              "/admin/settings"
            )}
            onClick={() =>
              navigate("/admin/settings")
            }
          />
        </nav>

        {/* MOBILE LOGOUT */}

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          PAGE CONTENT
      ====================================================== */}

      <main className="min-h-screen lg:ml-64">
        {children}
      </main>
    </div>
  );
}

/* =========================================================
   DESKTOP SIDEBAR ITEM
========================================================= */

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-blue-50 text-blue-600"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* =========================================================
   MOBILE SIDEBAR ITEM
========================================================= */

function MobileSidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-sm font-medium transition ${
        active
          ? "bg-blue-50 text-blue-600"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </span>

      <ChevronRight size={16} />
    </button>
  );
}