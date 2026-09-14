"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAccount() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          router.replace("/login");
          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "id, role, membership, is_blocked, block_reason"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          router.replace("/login");
          return;
        }

        /* =====================================================
           ADMIN KO CUSTOMER DASHBOARD SE ROKO
        ===================================================== */

        if (profile.role === "admin") {
          router.replace("/admin");
          return;
        }

        /* =====================================================
           BLOCKED ACCOUNT
        ===================================================== */

        if (profile.is_blocked) {
          await supabase.auth.signOut();
          router.replace("/login");
          return;
        }

        /* =====================================================
           IMPORTANT DASHBOARD FLOW

           Customer ka membership active ho ya na ho,
           dashboard accessible rahega.

           Earning/action buttons ka access dashboard page
           aur individual earning pages/RPCs handle karenge.

           Support hamesha accessible rahega.

           Yahan membership ke basis par redirect NAHI hoga.
        ===================================================== */

        if (mounted) {
          setChecking(false);
        }
      } catch (error) {
        console.error(
          "Dashboard protection error:",
          error
        );

        if (mounted) {
          router.replace("/login");
        }
      }
    }

    checkAccount();

    return () => {
      mounted = false;
    };
  }, [router]);

  /* =========================================================
     LOADING
  ========================================================= */

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500/30 border-t-cyan-400" />

          <p className="text-sm text-slate-400">
            Checking your EarnNova account...
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}