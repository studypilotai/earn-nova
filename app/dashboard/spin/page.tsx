"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SpinResult = {
  success: boolean;
  reward: number;
  spin_type: "free" | "paid";
  fee: number;
  spins_used: number;
  spins_remaining: number;
};

const wheelRewards = [
  "$0.00",
  "$0.02",
  "$0.05",
  "$0.10",
  "$0.20",
  "$0.50",
  "$0.05",
  "$0.02",
];

const rewardInfo = [
  {
    amount: "$0.00",
    chance: "40%",
  },
  {
    amount: "$0.02",
    chance: "25%",
  },
  {
    amount: "$0.05",
    chance: "18%",
  },
  {
    amount: "$0.10",
    chance: "10%",
  },
  {
    amount: "$0.20",
    chance: "5%",
  },
  {
    amount: "$0.50",
    chance: "2%",
  },
];

export default function SpinPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);

  const [rotation, setRotation] = useState(0);

  const [spinsUsed, setSpinsUsed] = useState(0);

  const [result, setResult] =
    useState<SpinResult | null>(null);

  const [error, setError] = useState("");

  const [wallet, setWallet] = useState<number | null>(
    null
  );

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/login");
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("wallet")
          .eq("id", user.id)
          .maybeSingle();

      if (
        profileError &&
        profileError.code !== "PGRST116"
      ) {
        console.error(profileError);
      }

      if (mounted) {
        setWallet(
          profile?.wallet !== null &&
            profile?.wallet !== undefined
            ? Number(profile.wallet)
            : null
        );

        setLoading(false);
      }
    };

    loadUser();

    return () => {
      mounted = false;
    };
  }, [router]);

  const handleSpin = async () => {
    if (spinning) return;

    if (spinsUsed >= 5) {
      setError(
        "You have reached today's spin limit."
      );
      return;
    }

    setError("");
    setResult(null);
    setSpinning(true);

    /*
     * IMPORTANT:
     *
     * This random number is ONLY for the visual wheel.
     *
     * It does NOT determine the reward.
     *
     * Actual reward is generated inside the protected
     * Supabase RPC.
     */

    const visualRotation =
      rotation +
      360 * 7 +
      Math.floor(Math.random() * 360);

    setRotation(visualRotation);

    try {
      /*
       * Wait for the wheel animation.
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 4200)
      );

      /*
       * Secure server-side spin.
       */

      const { data, error: rpcError } =
        await supabase.rpc("spin_and_win");

      if (rpcError) {
        throw rpcError;
      }

      if (!data?.success) {
        throw new Error(
          "Spin could not be completed."
        );
      }

      const spinResult =
        data as SpinResult;

      setResult(spinResult);

      setSpinsUsed(
        Number(spinResult.spins_used)
      );

      /*
       * Refresh wallet display from database.
       */

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } =
          await supabase
            .from("profiles")
            .select("wallet")
            .eq("id", user.id)
            .maybeSingle();

        if (profile) {
          setWallet(Number(profile.wallet));
        }
      }
    } catch (err: any) {
      console.error(
        "Spin error:",
        err
      );

      let message =
        "Unable to complete spin. Please try again.";

      const rawMessage =
        String(err?.message || "");

      if (
        rawMessage
          .toLowerCase()
          .includes("daily spin limit")
      ) {
        message =
          "You have reached today's spin limit.";
      } else if (
        rawMessage
          .toLowerCase()
          .includes("insufficient")
      ) {
        message =
          "You do not have enough wallet balance for an extra spin.";
      } else if (
        rawMessage
          .toLowerCase()
          .includes("authentication")
      ) {
        message =
          "Your session has expired. Please login again.";
      } else if (
        rawMessage
          .toLowerCase()
          .includes("profile")
      ) {
        message =
          "Your account profile could not be found.";
      }

      setError(message);
    } finally {
      setSpinning(false);
    }
  };

  const spinsRemaining = Math.max(
    0,
    5 - spinsUsed
  );

  const freeSpinAvailable =
    spinsUsed === 0;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />

          <p className="text-sm text-slate-400">
            Loading Spin & Win...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-8 flex items-center justify-between gap-4">

          <button
            onClick={() =>
              router.push("/dashboard")
            }
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-slate-700 hover:bg-slate-800"
          >
            <span className="text-lg">
              ←
            </span>

            Dashboard
          </button>

          <div className="flex items-center gap-3">

            {/* WALLET */}

            {wallet !== null && (
              <div className="hidden rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-right sm:block">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Wallet
                </p>

                <p className="font-bold text-emerald-400">
                  ${wallet.toFixed(2)}
                </p>
              </div>
            )}

            {/* SPINS */}

            <div className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Spins Left
              </p>

              <p className="font-bold text-blue-400">
                {spinsRemaining}/5
              </p>
            </div>

          </div>
        </div>


        {/* ================================================= */}
        {/* TITLE */}
        {/* ================================================= */}

        <div className="mb-10 text-center">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-bold tracking-wide text-blue-400">
            🎁 DAILY REWARD
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Spin & Win
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400">
            Spin once every day for free and get a
            chance to earn extra rewards.
          </p>

        </div>


        {/* ================================================= */}
        {/* MAIN GRID */}
        {/* ================================================= */}

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">


          {/* ================================================= */}
          {/* WHEEL */}
          {/* ================================================= */}

          <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl sm:p-8">

            <div className="flex flex-col items-center">

              <div className="relative">

                {/* POINTER */}

                <div className="absolute left-1/2 top-[-15px] z-30 -translate-x-1/2">
                  <div
                    className="h-0 w-0"
                    style={{
                      borderLeft:
                        "16px solid transparent",
                      borderRight:
                        "16px solid transparent",
                      borderTop:
                        "32px solid white",
                    }}
                  />
                </div>


                {/* WHEEL */}

                <div
                  className="relative h-[290px] w-[290px] rounded-full border-[10px] border-slate-800 shadow-[0_0_80px_rgba(37,99,235,0.20)] sm:h-[370px] sm:w-[370px]"
                  style={{
                    transform:
                      `rotate(${rotation}deg)`,

                    transition: spinning
                      ? "transform 4200ms cubic-bezier(0.12,0.8,0.18,1)"
                      : "none",

                    background:
                      "conic-gradient(#2563eb 0deg 45deg,#0f172a 45deg 90deg,#2563eb 90deg 135deg,#0f172a 135deg,#2563eb 180deg 225deg,#0f172a 225deg 270deg,#2563eb 270deg 315deg,#0f172a 315deg 360deg)",
                  }}
                >

                  {/* WHEEL LABELS */}

                  {wheelRewards.map(
                    (reward, index) => {

                      const angle =
                        index * 45 + 22.5;

                      return (
                        <div
                          key={index}
                          className="absolute left-1/2 top-1/2 w-20 -translate-x-1/2 -translate-y-1/2 text-center text-xs font-black text-white sm:w-24 sm:text-sm"
                          style={{
                            transform: `
                              translate(-50%, -50%)
                              rotate(${angle}deg)
                              translateY(-105px)
                              rotate(-${angle}deg)
                            `,
                          }}
                        >
                          {reward}
                        </div>
                      );
                    }
                  )}


                  {/* CENTER */}

                  <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-slate-700 bg-slate-950 shadow-2xl sm:h-24 sm:w-24">

                    <div className="m-auto text-3xl sm:text-4xl">
                      🎁
                    </div>

                  </div>

                </div>

              </div>


              {/* ================================================= */}
              {/* SPIN BUTTON */}
              {/* ================================================= */}

              <button
                onClick={handleSpin}
                disabled={
                  spinning ||
                  spinsRemaining <= 0
                }
                className="mt-10 w-full max-w-md rounded-2xl bg-blue-600 px-6 py-4 text-base font-black shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
              >

                {spinning ? (
                  <span className="flex items-center justify-center gap-3">

                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                    SPINNING...

                  </span>
                ) : spinsRemaining <= 0 ? (
                  "DAILY LIMIT REACHED"
                ) : freeSpinAvailable ? (
                  "🎁 SPIN FOR FREE"
                ) : (
                  "🎡 SPIN — $0.30"
                )}

              </button>


              <p className="mt-3 text-center text-xs text-slate-500">

                {spinning
                  ? "Please wait for the result..."
                  : freeSpinAvailable
                  ? "Your first spin today is free."
                  : "This extra spin will cost $0.30."}

              </p>


              {/* ERROR */}

              {error && (
                <div className="mt-5 w-full max-w-md rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-center text-sm text-red-400">
                  {error}
                </div>
              )}


              {/* RESULT */}

              {result && !spinning && (
                <div className="mt-7 w-full max-w-md rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">

                  <div className="text-5xl">
                    {result.reward > 0
                      ? "🎉"
                      : "🙂"}
                  </div>

                  <p className="mt-4 text-sm text-slate-400">
                    You won
                  </p>

                  <p className="mt-1 text-4xl font-black text-emerald-400">
                    $
                    {Number(
                      result.reward
                    ).toFixed(2)}
                  </p>

                  {result.fee > 0 && (
                    <p className="mt-3 text-xs text-slate-500">
                      Spin fee: $
                      {Number(
                        result.fee
                      ).toFixed(2)}
                    </p>
                  )}

                  <div className="mt-5 border-t border-slate-800 pt-4">

                    <p className="text-xs text-slate-500">
                      Spins remaining today
                    </p>

                    <p className="mt-1 text-lg font-bold text-blue-400">
                      {result.spins_remaining}
                    </p>

                  </div>

                </div>
              )}

            </div>
          </section>


          {/* ================================================= */}
          {/* SIDE PANEL */}
          {/* ================================================= */}

          <div className="space-y-5">


            {/* DAILY FREE SPIN */}

            <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6">

              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-2xl">
                  🎁
                </div>

                <div>

                  <p className="font-bold">
                    Daily Free Spin
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    One free spin every day
                  </p>

                </div>

              </div>


              <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-4">

                <span className="text-sm text-slate-400">
                  Status
                </span>

                <span
                  className={
                    freeSpinAvailable
                      ? "font-bold text-emerald-400"
                      : "font-bold text-slate-500"
                  }
                >
                  {freeSpinAvailable
                    ? "AVAILABLE"
                    : "USED"}
                </span>

              </div>

            </div>


            {/* EXTRA SPINS */}

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">

              <h2 className="text-lg font-bold">
                Extra Spins
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                After using your free spin, you can
                continue spinning using your wallet
                balance.
              </p>


              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-xs text-slate-500">
                      Cost per extra spin
                    </p>

                    <p className="mt-1 text-2xl font-black">
                      $0.30
                    </p>
                  </div>

                  <div className="rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-400">
                    PAID
                  </div>

                </div>

              </div>


              <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-xs text-slate-500">
                      Daily limit
                    </p>

                    <p className="mt-1 text-2xl font-black">
                      5 Spins
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500">
                      Used
                    </p>

                    <p className="mt-1 font-bold text-blue-400">
                      {spinsUsed}/5
                    </p>
                  </div>

                </div>

              </div>

            </div>


            {/* REWARDS */}

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">

              <h2 className="text-lg font-bold">
                Possible Rewards
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Rewards are selected randomly by the
                secure server.
              </p>


              <div className="mt-5 grid grid-cols-2 gap-3">

                {rewardInfo.map(
                  ({ amount, chance }) => (
                    <div
                      key={amount}
                      className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                    >

                      <p className="font-bold text-blue-400">
                        {amount}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-600">
                        {chance} chance
                      </p>

                    </div>
                  )
                )}

              </div>

            </div>


            {/* SECURITY */}

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">

              <div className="flex items-start gap-3">

                <div className="text-emerald-400">
                  🔒
                </div>

                <div>

                  <h2 className="font-bold">
                    Secure Spin
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Spin limits, wallet charges and
                    rewards are processed securely on
                    the server.
                  </p>

                </div>

              </div>

            </div>


            {/* HOW IT WORKS */}

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">

              <h2 className="text-lg font-bold">
                How It Works
              </h2>

              <div className="mt-5 space-y-4">

                <div className="flex gap-3">
                  <span>🎁</span>

                  <p className="text-sm leading-5 text-slate-400">
                    Get one free spin every day.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span>💰</span>

                  <p className="text-sm leading-5 text-slate-400">
                    Extra spins cost $0.30.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span>🔒</span>

                  <p className="text-sm leading-5 text-slate-400">
                    Maximum 5 spins are allowed
                    per day.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span>🏆</span>

                  <p className="text-sm leading-5 text-slate-400">
                    Maximum reward per spin is
                    $0.50.
                  </p>
                </div>

              </div>

            </div>

          </div>
        </div>

      </div>
    </main>
  );
}