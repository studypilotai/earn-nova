"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

const MAX_SPINS = 5;
const EXTRA_SPIN_FEE = 0.3;

export default function SpinPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinsUsed, setSpinsUsed] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState("");
  const [wallet, setWallet] = useState<number | null>(null);

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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("wallet")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Profile error:", profileError);
      }

      if (mounted) {
        setWallet(
          profile?.wallet !== null && profile?.wallet !== undefined
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
  }, [router, supabase]);

  const getRewardIndex = (reward: number) => {
    const normalizedReward = Number(reward).toFixed(2);

    const index = wheelRewards.findIndex((value) => {
      const numericValue = Number.parseFloat(value.replace("$", ""));
      return numericValue.toFixed(2) === normalizedReward;
    });

    return index >= 0 ? index : 0;
  };

  const refreshWallet = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("wallet")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Wallet refresh error:", profileError);
      return;
    }

    if (profile) {
      setWallet(Number(profile.wallet));
    }
  };

  const handleSpin = async () => {
    if (spinning) return;

    if (spinsUsed >= MAX_SPINS) {
      setError("You have reached today's spin limit.");
      return;
    }

    setError("");
    setResult(null);
    setSpinning(true);

    try {
      const { data, error: rpcError } =
        await supabase.rpc("spin_and_win");

      if (rpcError) {
        throw rpcError;
      }

      if (!data?.success) {
        throw new Error("Spin could not be completed.");
      }

      const spinResult = data as SpinResult;

      const rewardIndex = getRewardIndex(
        Number(spinResult.reward)
      );

      const targetAngle = rewardIndex * 45;

      const currentNormalized =
        ((rotation % 360) + 360) % 360;

      const targetNormalized =
        ((targetAngle % 360) + 360) % 360;

      let extraAngle =
        targetNormalized - currentNormalized;

      if (extraAngle < 0) {
        extraAngle += 360;
      }

      const finalRotation =
        rotation +
        360 * 7 +
        extraAngle;

      setRotation(finalRotation);

      await new Promise((resolve) =>
        setTimeout(resolve, 4200)
      );

      setResult(spinResult);

      setSpinsUsed(
        Number(spinResult.spins_used)
      );

      await refreshWallet();
    } catch (err: unknown) {
      console.error("Spin error:", err);

      let message =
        "Unable to complete spin. Please try again.";

      const rawMessage =
        err instanceof Error
          ? err.message
          : String(err ?? "");

      const lowerMessage =
        rawMessage.toLowerCase();

      if (
        lowerMessage.includes("daily spin limit")
      ) {
        message =
          "You have reached today's spin limit.";
      } else if (
        lowerMessage.includes("insufficient")
      ) {
        message =
          "You do not have enough wallet balance for an extra spin.";
      } else if (
        lowerMessage.includes("authentication")
      ) {
        message =
          "Your session has expired. Please login again.";
      } else if (
        lowerMessage.includes("profile")
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
    MAX_SPINS - spinsUsed
  );

  const freeSpinAvailable = spinsUsed === 0;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b10] text-white">
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
    <main className="min-h-screen bg-[#070b10] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#11151b] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-blue-500/30 hover:bg-slate-800 hover:text-white"
          >
            <span className="text-lg">←</span>
            Dashboard
          </button>

          <div className="flex items-center gap-3">
            {wallet !== null && (
              <div className="hidden rounded-xl border border-slate-800 bg-[#11151b] px-4 py-2 text-right sm:block">
                <p className="text-[10px] uppercase tracking-wider text-slate-500">
                  Wallet
                </p>
                <p className="font-bold text-emerald-400">
                  ${wallet.toFixed(2)}
                </p>
              </div>
            )}

            <div className="rounded-xl border border-slate-800 bg-[#11151b] px-4 py-2 text-right">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Spins Left
              </p>
              <p className="font-bold text-blue-400">
                {spinsRemaining}/{MAX_SPINS}
              </p>
            </div>
          </div>
        </div>

        {/* TITLE */}

        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-bold tracking-wide text-blue-400">
            🎁 DAILY REWARD
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Spin & Win
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-400">
            Spin once every day for free and get a chance
            to earn extra rewards.
          </p>
        </div>

        {/* MAIN GRID */}

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* WHEEL */}

          <section className="rounded-3xl border border-slate-800 bg-[#11151b] p-5 shadow-2xl sm:p-8">
            <div className="flex flex-col items-center">

              {/* WHEEL CONTAINER */}

              <div className="relative flex items-center justify-center">

                {/* POINTER */}

                <div className="absolute left-1/2 top-[-10px] z-50 -translate-x-1/2">
                  <div className="relative">
                    <div className="h-0 w-0 border-l-[15px] border-r-[15px] border-t-[32px] border-l-transparent border-r-transparent border-t-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.8)]" />

                    <div className="absolute left-1/2 top-[-4px] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-blue-400 shadow-lg" />
                  </div>
                </div>

                {/* OUTER RING */}

                <div className="relative h-[310px] w-[310px] rounded-full border-[8px] border-slate-700 bg-slate-950 p-[5px] shadow-[0_0_70px_rgba(37,99,235,0.22)] sm:h-[400px] sm:w-[400px]">

                  {/* ROTATING WHEEL */}

                  <div
                    className="relative h-full w-full overflow-hidden rounded-full"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                      transition: spinning
                        ? "transform 4200ms cubic-bezier(0.12,0.8,0.18,1)"
                        : "none",
                      background: `
                        conic-gradient(
                          from -112.5deg,
                          #2563eb 0deg 45deg,
                          #0f172a 45deg 90deg,
                          #2563eb 90deg 135deg,
                          #0f172a 135deg 180deg,
                          #2563eb 180deg 225deg,
                          #0f172a 225deg 270deg,
                          #2563eb 270deg 315deg,
                          #0f172a 315deg 360deg
                        )
                      `,
                    }}
                  >

                    {/* SLICE DIVIDERS */}

                    {Array.from({ length: 8 }).map(
                      (_, index) => {
                        const angle = index * 45;

                        return (
                          <div
                            key={index}
                            className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-1/2 w-[2px] origin-bottom bg-white/20"
                            style={{
                              transform: `translateX(-50%) rotate(${angle}deg)`,
                            }}
                          />
                        );
                      }
                    )}

                    {/* REWARD LABELS */}

                    {wheelRewards.map(
                      (reward, index) => {
                        const angle =
                          index * 45 - 90;

                        return (
                          <div
                            key={`${reward}-${index}`}
                            className="pointer-events-none absolute left-1/2 top-1/2 z-20 flex h-11 w-[68px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-center text-[12px] font-black tracking-tight text-white shadow-[0_2px_8px_rgba(0,0,0,0.35)] sm:h-14 sm:w-[92px] sm:text-[15px]"
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

                    <div className="absolute left-1/2 top-1/2 z-30 flex h-[84px] w-[84px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[6px] border-slate-700 bg-slate-950 shadow-[0_0_30px_rgba(0,0,0,0.8)] sm:h-[102px] sm:w-[102px]">
                      <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-3xl sm:h-[76px] sm:w-[76px] sm:text-4xl">
                        🎁
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SPIN BUTTON */}

              <button
                onClick={handleSpin}
                disabled={
                  spinning ||
                  spinsRemaining <= 0
                }
                className="mt-10 w-full max-w-md rounded-2xl border border-blue-400/20 bg-blue-600 px-6 py-4 text-base font-black shadow-[0_10px_30px_rgba(37,99,235,0.25)] transition hover:bg-blue-500 hover:shadow-[0_12px_35px_rgba(37,99,235,0.35)] disabled:cursor-not-allowed disabled:opacity-50 sm:text-lg"
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
                  `🎡 SPIN — $${EXTRA_SPIN_FEE.toFixed(2)}`
                )}
              </button>

              <p className="mt-3 text-center text-xs text-slate-500">
                {spinning
                  ? "Please wait for the result..."
                  : freeSpinAvailable
                  ? "Your first spin today is free."
                  : `This extra spin will cost $${EXTRA_SPIN_FEE.toFixed(2)}.`}
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
                    {Number(result.reward) > 0
                      ? "🎉"
                      : "🙂"}
                  </div>

                  <p className="mt-4 text-sm text-slate-400">
                    You won
                  </p>

                  <p className="mt-1 text-4xl font-black text-emerald-400">
                    ${Number(result.reward).toFixed(2)}
                  </p>

                  {Number(result.fee) > 0 && (
                    <p className="mt-3 text-xs text-slate-500">
                      Spin fee: $
                      {Number(result.fee).toFixed(2)}
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

          {/* SIDE PANEL */}

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

            <div className="rounded-3xl border border-slate-800 bg-[#11151b] p-6">
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

            <div className="rounded-3xl border border-slate-800 bg-[#11151b] p-6">
              <h2 className="text-lg font-bold">
                Possible Rewards
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Available rewards on the wheel.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {Array.from(
                  new Set(wheelRewards)
                ).map((amount) => (
                  <div
                    key={amount}
                    className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <p className="text-center font-bold text-blue-400">
                      {amount}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* SECURITY */}

            <div className="rounded-3xl border border-slate-800 bg-[#11151b] p-6">
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

            <div className="rounded-3xl border border-slate-800 bg-[#11151b] p-6">
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
                    Maximum 5 spins are allowed per day.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span>🏆</span>

                  <p className="text-sm leading-5 text-slate-400">
                    Maximum reward per spin is $0.50.
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