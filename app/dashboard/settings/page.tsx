"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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

const supabase = createClient();

type MessageType = "success" | "error" | "";

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

  const [profileMessage, setProfileMessage] =
    useState("");

  const [profileMessageType, setProfileMessageType] =
    useState<MessageType>("");

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordMessageType, setPasswordMessageType] =
    useState<MessageType>("");

  useEffect(() => {
    loadSettings();
  }, []);

  /*
   * =========================================================
   * LOAD SETTINGS
   * =========================================================
   */

  async function loadSettings() {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      /*
       * Load profile.
       */
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "PROFILE LOAD ERROR:",
          profileError
        );

        /*
         * Fallback to Auth metadata for name.
         *
         * Phone is left blank if the profile query fails.
         */
        setFullName(
          user.user_metadata?.full_name || ""
        );

        setPhone("");

        setLoading(false);
        return;
      }

      setFullName(
        profileData?.full_name ||
          user.user_metadata?.full_name ||
          ""
      );

      setPhone(profileData?.phone || "");
    } catch (error) {
      console.error(
        "SETTINGS LOAD ERROR:",
        error
      );

      setProfileMessage(
        "Unable to load your settings."
      );
      setProfileMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  /*
   * =========================================================
   * SAVE PROFILE
   * =========================================================
   */

  async function saveProfile() {
    if (savingProfile) return;

    setProfileMessage("");
    setProfileMessageType("");

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setProfileMessage(
        "Please enter your full name."
      );
      setProfileMessageType("error");
      return;
    }

    if (cleanName.length < 2) {
      setProfileMessage(
        "Name must contain at least 2 characters."
      );
      setProfileMessageType("error");
      return;
    }

    if (cleanPhone.length > 30) {
      setProfileMessage(
        "Phone or account number is too long."
      );
      setProfileMessageType("error");
      return;
    }

    setSavingProfile(true);

    try {
      /*
       * =====================================================
       * UPDATE PROFILE
       * =====================================================
       */

      const { error: profileError } =
        await supabase
          .from("profiles")
          .update({
            full_name: cleanName,
            phone: cleanPhone || null,
          })
          .eq("id", userId);

      if (profileError) {
        console.error(
          "PROFILE UPDATE ERROR:",
          profileError
        );

        setProfileMessage(
          "Unable to save profile. Please try again."
        );
        setProfileMessageType("error");
        return;
      }

      /*
       * =====================================================
       * UPDATE AUTH METADATA
       *
       * Keeps the display name synchronized with Supabase
       * Auth metadata.
       * =====================================================
       */

      const { error: authError } =
        await supabase.auth.updateUser({
          data: {
            full_name: cleanName,
          },
        });

      if (authError) {
        /*
         * Profile was already saved successfully.
         * Do not tell user that the whole operation failed.
         */
        console.error(
          "AUTH METADATA UPDATE ERROR:",
          authError
        );
      }

      /*
       * Keep local UI name synchronized.
       */
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "earnNovaUserName",
          cleanName
        );
      }

      setProfileMessage(
        "Profile updated successfully."
      );
      setProfileMessageType("success");
    } catch (error) {
      console.error(
        "SAVE PROFILE ERROR:",
        error
      );

      setProfileMessage(
        "Something went wrong while saving your profile."
      );
      setProfileMessageType("error");
    } finally {
      setSavingProfile(false);
    }
  }

  /*
   * =========================================================
   * CHANGE PASSWORD
   * =========================================================
   */

  async function changePassword() {
    if (changingPassword) return;

    setPasswordMessage("");
    setPasswordMessageType("");

    if (!newPassword) {
      setPasswordMessage(
        "Please enter your new password."
      );
      setPasswordMessageType("error");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage(
        "Password must be at least 8 characters."
      );
      setPasswordMessageType("error");
      return;
    }

    if (newPassword.length > 72) {
      setPasswordMessage(
        "Password must not exceed 72 characters."
      );
      setPasswordMessageType("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage(
        "Passwords do not match."
      );
      setPasswordMessageType("error");
      return;
    }

    setChangingPassword(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (error) {
        console.error(
          "PASSWORD UPDATE ERROR:",
          error
        );

        setPasswordMessage(
          error.message ||
            "Unable to change password."
        );
        setPasswordMessageType("error");
        return;
      }

      setNewPassword("");
      setConfirmPassword("");

      setShowPassword(false);
      setShowConfirmPassword(false);

      setPasswordMessage(
        "Password changed successfully."
      );
      setPasswordMessageType("success");
    } catch (error) {
      console.error(
        "CHANGE PASSWORD ERROR:",
        error
      );

      setPasswordMessage(
        "Something went wrong while changing your password."
      );
      setPasswordMessageType("error");
    } finally {
      setChangingPassword(false);
    }
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b10] px-3 py-4 text-white sm:px-5 sm:py-7">
        <div className="mx-auto w-full max-w-[570px]">

          <header className="mb-5 flex items-center gap-3">
            <a
              href="/dashboard"
              aria-label="Back to Dashboard"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/40 hover:text-white"
            >
              <ArrowLeft size={20} />
            </a>

            <LogoMark />

            <div>
              <h1 className="text-[20px] font-black tracking-tight">
                Earn<span className="text-blue-500">
                  Nova
                </span>
              </h1>

              <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-slate-600">
                Earn • Grow • Repeat
              </p>
            </div>
          </header>

          <div className="rounded-[20px] border border-slate-800 bg-[#11151b] p-10 text-center">
            <RefreshCw
              size={26}
              className="mx-auto animate-spin text-blue-500"
            />

            <p className="mt-3 text-sm font-semibold text-slate-400">
              Loading settings...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * MAIN PAGE
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-[#070b10] px-3 py-4 text-white sm:px-5 sm:py-7">
      <div className="mx-auto w-full max-w-[570px]">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            aria-label="Back to Dashboard"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/40 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>

          <LogoMark />

          <div className="min-w-0 flex-1">
            <h1 className="text-[20px] font-black tracking-tight">
              Earn<span className="text-blue-500">
                Nova
              </span>
            </h1>

            <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-slate-600">
              Earn • Grow • Repeat
            </p>
          </div>
        </header>

        {/* =================================================
            PAGE INTRO
        ================================================= */}

        <section className="mb-4 rounded-[20px] border border-blue-500/10 bg-blue-500/[0.04] p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400">
            Account Settings
          </p>

          <h2 className="mt-1 text-xl font-black">
            Manage Your Account
          </h2>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Update your personal information and
            keep your EarnNova account secure.
          </p>
        </section>

        {/* =================================================
            PROFILE SETTINGS
        ================================================= */}

        <section className="mb-4 rounded-[20px] border border-slate-800 bg-[#11151b] p-4 sm:p-5">

          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <User size={21} />
            </div>

            <div>
              <h2 className="text-sm font-bold">
                Profile Information
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-600">
                Update your personal information.
              </p>
            </div>
          </div>

          {/* PROFILE MESSAGE */}

          {profileMessage && (
            <div
              className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-xs ${
                profileMessageType ===
                "success"
                  ? "border-green-500/20 bg-green-500/10 text-green-300"
                  : "border-red-500/20 bg-red-500/10 text-red-300"
              }`}
            >
              {profileMessageType ===
              "success" ? (
                <CheckCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />
              ) : (
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />
              )}

              <p>{profileMessage}</p>
            </div>
          )}

          {/* FULL NAME */}

          <div>
            <label className="mb-2 block text-[11px] font-semibold text-slate-300">
              Full Name
            </label>

            <div className="relative">
              <User
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value
                  )
                }
                placeholder="Your full name"
                autoComplete="name"
                maxLength={100}
                className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* PHONE */}

          <div className="mt-5">
            <label className="mb-2 block text-[11px] font-semibold text-slate-300">
              Phone / Account Number
            </label>

            <div className="relative">
              <Phone
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                type="text"
                value={phone}
                onChange={(event) =>
                  setPhone(
                    event.target.value
                  )
                }
                placeholder="+92 300 1234567"
                autoComplete="tel"
                maxLength={30}
                className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>

            <p className="mt-2 text-[10px] leading-4 text-slate-600">
              You can use your phone number or
              preferred contact/account number.
            </p>
          </div>

          {/* SAVE */}

          <button
            type="button"
            onClick={saveProfile}
            disabled={savingProfile}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-xs font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingProfile ? (
              <>
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                Save Changes
              </>
            )}
          </button>
        </section>

        {/* =================================================
            PASSWORD
        ================================================= */}

        <section className="rounded-[20px] border border-slate-800 bg-[#11151b] p-4 sm:p-5">

          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Lock size={21} />
            </div>

            <div>
              <h2 className="text-sm font-bold">
                Change Password
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-600">
                Keep your EarnNova account secure.
              </p>
            </div>
          </div>

          {/* PASSWORD MESSAGE */}

          {passwordMessage && (
            <div
              className={`mb-5 flex items-start gap-3 rounded-xl border p-4 text-xs ${
                passwordMessageType ===
                "success"
                  ? "border-green-500/20 bg-green-500/10 text-green-300"
                  : "border-red-500/20 bg-red-500/10 text-red-300"
              }`}
            >
              {passwordMessageType ===
              "success" ? (
                <CheckCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />
              ) : (
                <AlertCircle
                  size={17}
                  className="mt-0.5 shrink-0"
                />
              )}

              <p>{passwordMessage}</p>
            </div>
          )}

          {/* PASSWORD INFO */}

          <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-500/10 bg-blue-500/[0.04] p-4">
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0 text-blue-400"
            />

            <p className="text-[10px] leading-5 text-slate-500">
              Use a strong password with at least
              8 characters. Never share your password
              with anyone.
            </p>
          </div>

          {/* NEW PASSWORD */}

          <div>
            <label className="mb-2 block text-[11px] font-semibold text-slate-300">
              New Password
            </label>

            <div className="relative">
              <Lock
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                placeholder="Enter new password"
                autoComplete="new-password"
                maxLength={72}
                className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] py-3 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (value) => !value
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-300"
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
            <label className="mb-2 block text-[11px] font-semibold text-slate-300">
              Confirm New Password
            </label>

            <div className="relative">
              <Lock
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Confirm new password"
                autoComplete="new-password"
                maxLength={72}
                className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] py-3 pl-11 pr-12 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (value) => !value
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide confirmation password"
                    : "Show confirmation password"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 transition hover:text-slate-300"
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
            type="button"
            onClick={changePassword}
            disabled={changingPassword}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-xs font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {changingPassword ? (
              <>
                <RefreshCw
                  size={17}
                  className="animate-spin"
                />
                Changing Password...
              </>
            ) : (
              <>
                <Lock size={17} />
                Change Password
              </>
            )}
          </button>
        </section>

        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="py-7 text-center">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-700">
            EarnNova
          </p>

          <p className="mt-2 text-[10px] text-slate-700">
            Earn • Grow • Repeat
          </p>
        </footer>
      </div>
    </main>
  );
}

/*
 * =========================================================
 * EARNNOVA MASTER LOGO
 * Same logo as customer dashboard.
 * =========================================================
 */

function LogoMark() {
  return (
    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
      <div className="absolute inset-0 rounded-[15px] bg-blue-600/20 blur-md" />

      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[15px] border border-blue-400/20 bg-gradient-to-br from-white via-slate-100 to-blue-50 shadow-xl">
        <div className="absolute -right-3 -top-3 h-7 w-7 rounded-full bg-blue-500/20 blur-md" />

        <div className="relative flex items-center justify-center">
          <span className="text-[21px] font-black italic tracking-[-0.15em] text-slate-950">
            E
          </span>

          <span className="-ml-0.5 text-[21px] font-black italic tracking-[-0.15em] text-blue-600">
            N
          </span>
        </div>

        <div className="absolute bottom-1.5 left-2 h-[2px] w-5 rounded-full bg-blue-500" />
      </div>
    </div>
  );
}