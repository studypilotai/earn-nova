"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const cleanEmail = email.trim();

      if (!cleanEmail || !password) {
        setError("Email aur password dono enter karo.");
        setLoading(false);
        return;
      }

      // Supabase login
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (loginError) {
        console.error("ADMIN LOGIN ERROR:", loginError);
        setError(loginError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Login nahi hua. Dobara try karo.");
        setLoading(false);
        return;
      }

      console.log("ADMIN AUTH USER:", data.user.id);

      // Existing admin profile check
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, email")
        .eq("id", data.user.id)
        .maybeSingle();

      console.log("ADMIN PROFILE:", profile);
      console.log("PROFILE ERROR:", profileError);

      if (profileError) {
        await supabase.auth.signOut();

        setError(
          "Admin profile verify nahi ho saka: " +
            profileError.message
        );

        setLoading(false);
        return;
      }

      if (!profile) {
        await supabase.auth.signOut();

        setError(
          "Is account ki profiles table mein entry nahi mili."
        );

        setLoading(false);
        return;
      }

      if (profile.role !== "admin") {
        await supabase.auth.signOut();

        setError(
          "Yeh account admin account nahi hai."
        );

        setLoading(false);
        return;
      }

      // Login successful
      const redirect =
        searchParams.get("redirect") || "/admin";

      router.replace(redirect);
      router.refresh();

    } catch (err) {
      console.error("ADMIN LOGIN EXCEPTION:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Login ke waqt unexpected error aaya."
      );

      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <ShieldCheck size={30} />
          </div>

          <h1 className="text-4xl font-bold">
            Earn<span className="text-blue-500">Nova</span>
          </h1>

          <p className="mt-2 text-slate-400">
            Admin Control Panel
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">

          <div className="mb-7">
            <h2 className="text-2xl font-bold">
              Admin Login
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Sign in to manage your EarnNova platform.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-4 pl-12 pr-4 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-4 pl-12 pr-4 text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2
                    size={20}
                    className="animate-spin"
                  />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={20} />
                </>
              )}
            </button>

          </form>
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          EarnNova Admin • Secure Access
        </p>

      </div>
    </main>
  );
}