"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  User,
  Phone,
  Lock,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] =
    useState(false);

  const [userId, setUserId] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [profileSuccess, setProfileSuccess] =
    useState(false);

  const [passwordSuccess, setPasswordSuccess] =
    useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error(error);

      /*
       * If phone column does not exist yet,
       * name will still be loaded from auth metadata.
       */
      setFullName(
        user.user_metadata?.full_name || ""
      );

      setLoading(false);
      return;
    }

    setFullName(data?.full_name || "");
    setPhone(data?.phone || "");

    setLoading(false);
  }

  async function saveProfile() {
    if (savingProfile) return;

    setProfileSuccess(false);

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      alert("Please enter your full name.");
      return;
    }

    if (cleanName.length < 2) {
      alert("Name must contain at least 2 characters.");
      return;
    }

    setSavingProfile(true);

    /*
     * Update profile
     */
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: cleanName,
        phone: cleanPhone || null,
      })
      .eq("id", userId);

    if (profileError) {
      console.error(profileError);
      alert(profileError.message);
      setSavingProfile(false);
      return;
    }

    /*
     * Also update Supabase Auth metadata
     * so the name stays synchronized.
     */
    const { error: authError } =
      await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
        },
      });

    if (authError) {
      console.error(
        "Auth metadata update error:",
        authError
      );
    }

    setProfileSuccess(true);
    setSavingProfile(false);

    setTimeout(() => {
      setProfileSuccess(false);
    }, 4000);
  }

  async function changePassword() {
    if (changingPassword) return;

    setPasswordSuccess(false);

    if (!newPassword) {
      alert("Please enter your new password.");
      return;
    }

    if (newPassword.length < 8) {
      alert(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setChangingPassword(true);

    const { error } =
      await supabase.auth.updateUser({
        password: newPassword,
      });

    if (error) {
      console.error(error);
      alert(error.message);
      setChangingPassword(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");

    setPasswordSuccess(true);
    setChangingPassword(false);

    setTimeout(() => {
      setPasswordSuccess(false);
    }, 4000);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex items-center gap-3 text-slate-400">
          <RefreshCw
            size={18}
            className="animate-spin"
          />
          Loading settings...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-2xl">

        {/* HEADER */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() =>
              router.push("/dashboard")
            }
            className="rounded-xl border border-slate-800 bg-slate-900 p-2.5 transition hover:bg-slate-800"
          >
            <ArrowLeft size={20} />
          </button>

          <div>
            <h1 className="text-2xl font-bold">
              Settings
            </h1>

            <p className="text-sm text-slate-400">
              Manage your account information and
              password.
            </p>
          </div>
        </div>

        {/* PROFILE SETTINGS */}
        <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400">
              <User size={21} />
            </div>

            <div>
              <h2 className="font-bold">
                Profile Information
              </h2>

              <p className="text-sm text-slate-500">
                Update your personal information.
              </p>
            </div>
          </div>

          {/* SUCCESS */}
          {profileSuccess && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
              <CheckCircle size={18} />
              Profile updated successfully.
            </div>
          )}

          {/* FULL NAME */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Full Name
            </label>

            <div className="relative">
              <User
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                placeholder="Your full name"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>
          </div>

          {/* PHONE */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Phone / Account Number
            </label>

            <div className="relative">
              <Phone
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="+92 300 1234567"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-4 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              This can be your phone or preferred
              contact/account number.
            </p>
          </div>

          {/* SAVE */}
          <button
            onClick={saveProfile}
            disabled={savingProfile}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingProfile ? (
              <>
                <RefreshCw
                  size={18}
                  className="animate-spin"
                />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </button>
        </section>

        {/* PASSWORD */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-600/10 text-purple-400">
              <Lock size={21} />
            </div>

            <div>
              <h2 className="font-bold">
                Change Password
              </h2>

              <p className="text-sm text-slate-500">
                Keep your Earn Nova account secure.
              </p>
            </div>
          </div>

          {/* SUCCESS */}
          {passwordSuccess && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-300">
              <CheckCircle size={18} />
              Password changed successfully.
            </div>
          )}

          {/* PASSWORD INFO */}
          <div className="mb-5 flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-blue-400"
            />

            <p className="text-xs leading-5 text-slate-400">
              Your new password must contain at least
              8 characters.
            </p>
          </div>

          {/* NEW PASSWORD */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              New Password
            </label>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                placeholder="Enter new password"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-12 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Confirm New Password
            </label>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Confirm new password"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3 pl-11 pr-12 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {/* CHANGE PASSWORD */}
          <button
            onClick={changePassword}
            disabled={changingPassword}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {changingPassword ? (
              <>
                <RefreshCw
                  size={18}
                  className="animate-spin"
                />
                Changing Password...
              </>
            ) : (
              <>
                <Lock size={18} />
                Change Password
              </>
            )}
          </button>
        </section>

      </div>
    </main>
  );
}