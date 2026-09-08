"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowDownToLine,
  Link2,
  ListTodo,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  // =====================================================
  // LOGIN PAGE SHOULD NOT USE ADMIN AUTH GUARD
  // =====================================================

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
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/admin/login");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      error ||
      !profile ||
      profile.role !== "admin"
    ) {
      await supabase.auth.signOut();
      router.replace("/admin/login");
      return;
    }

    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  function navigate(path: string) {
    setMobileSidebarOpen(false);
    router.push(path);
  }

  function isActive(path: string) {
    if (path === "/admin") {
      return pathname === "/admin";
    }

    return pathname.startsWith(path);
  }

  // =====================================================
  // LOGIN PAGE
  // IMPORTANT: NO SIDEBAR / NO AUTH CHECK UI
  // =====================================================

  if (isLoginPage) {
    return <>{children}</>;
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-3 text-slate-600">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
          <span>Loading Admin Panel...</span>
        </div>
      </div>
    );
  }

  // =====================================================
  // ADMIN PANEL
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">

      {/* ================================================= */}
      {/* DESKTOP SIDEBAR                                   */}
      {/* ================================================= */}

      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 border-r border-slate-200 bg-white lg:block">

        {/* Logo */}

        <div className="flex h-20 items-center border-b border-slate-200 px-6">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <ShieldCheck
              size={20}
              className="text-white"
            />
          </div>

          <div className="ml-3">
            <div className="font-bold">
              Earn
              <span className="text-blue-600">
                Nova
              </span>
            </div>

            <div className="text-xs text-slate-500">
              Admin Panel
            </div>
          </div>

        </div>

        {/* Navigation */}

        <nav className="space-y-1 p-4">

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

        {/* Logout */}

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4">

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </aside>

      {/* ================================================= */}
      {/* MOBILE TOP BAR                                    */}
      {/* ================================================= */}

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:hidden">

        <div className="flex items-center">

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <ShieldCheck
              size={18}
              className="text-white"
            />
          </div>

          <div className="ml-2">

            <div className="text-sm font-bold">
              Earn
              <span className="text-blue-600">
                Nova
              </span>
            </div>

            <div className="text-[10px] text-slate-500">
              Admin Panel
            </div>

          </div>

        </div>

        <button
          onClick={() =>
            setMobileSidebarOpen(
              !mobileSidebarOpen
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white"
        >
          {mobileSidebarOpen ? (
            <X size={20} />
          ) : (
            <Menu size={20} />
          )}
        </button>

      </header>

      {/* ================================================= */}
      {/* MOBILE OVERLAY                                    */}
      {/* ================================================= */}

      {mobileSidebarOpen && (
        <div
          onClick={() =>
            setMobileSidebarOpen(false)
          }
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      {/* ================================================= */}
      {/* MOBILE SIDEBAR                                    */}
      {/* ================================================= */}

      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-[280px] max-w-[85vw] transform border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 lg:hidden ${
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* Mobile Header */}

        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">

          <div className="flex items-center">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <ShieldCheck
                size={18}
                className="text-white"
              />
            </div>

            <div className="ml-2">

              <div className="text-sm font-bold">
                Earn
                <span className="text-blue-600">
                  Nova
                </span>
              </div>

              <div className="text-[10px] text-slate-500">
                Admin Panel
              </div>

            </div>

          </div>

          <button
            onClick={() =>
              setMobileSidebarOpen(false)
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-slate-100"
          >
            <X size={19} />
          </button>

        </div>

        {/* Mobile Navigation */}

        <nav className="space-y-1 p-3">

          <MobileSidebarItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active={isActive("/admin")}
            onClick={() =>
              navigate("/admin")
            }
          />

          <MobileSidebarItem
            icon={<Users size={18} />}
            label="Users"
            active={isActive(
              "/admin/users"
            )}
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

        {/* Mobile Logout */}

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-3">

          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </aside>

      {/* ================================================= */}
      {/* PAGE CONTENT                                      */}
      {/* ================================================= */}

      <main className="min-h-screen lg:ml-64">
        {children}
      </main>

    </div>
  );
}

/* ===================================================== */
/* DESKTOP SIDEBAR ITEM                                  */
/* ===================================================== */

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
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* ===================================================== */
/* MOBILE SIDEBAR ITEM                                   */
/* ===================================================== */

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
          : "text-slate-600 hover:bg-slate-50"
      }`}
    >
      <span className="flex items-center gap-3">
        {icon}
        {label}
      </span>

      <ChevronRight size={16} />
    </button>
  );
}