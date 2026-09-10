"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Eye,
  Link2,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Target,
  Trash2,
  TrendingUp,
  Video,
  Wallet,
  XCircle,
} from "lucide-react";

const supabase = createClient();

/* =========================================================
   TYPES
   ========================================================= */

type VideoItem = {
  id: number;
  video_url: string;
  target_views: number;
  total_budget: number;
  profit_percent: number;
  customer_pool: number;
  customer_reward: number;
  earnnova_profit: number;
  views: number;
  status: string;
  created_at: string;
};

/* =========================================================
   CURRENT EARNNOVA RULE
   =========================================================
   Tasks and videos are separate systems.

   Current customer limit:
   - Tasks: 10/day
   - Videos: 50/day

   Admin does NOT need plan-specific video limits here.
   ========================================================= */

const DAILY_VIDEO_LIMIT = 50;

/* =========================================================
   TASK
   ========================================================= */

export default function AdminVideosPage() {
  const router = useRouter();

  /* =======================================================
     FORM
     ======================================================= */

  const [videoUrl, setVideoUrl] = useState("");
  const [targetViews, setTargetViews] = useState("100");
  const [totalBudget, setTotalBudget] = useState("10");
  const [profitPercent, setProfitPercent] = useState("30");

  /* =======================================================
     DATA
     ======================================================= */

  const [videos, setVideos] = useState<VideoItem[]>([]);

  /* =======================================================
     STATES
     ======================================================= */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  /* =======================================================
     AUTO CALCULATIONS
     ======================================================= */

  const calculations = useMemo(() => {
    const budget = Number(totalBudget) || 0;
    const target = Number(targetViews) || 0;
    const profit = Number(profitPercent) || 0;

    const earnnovaProfit = budget * (profit / 100);

    const customerPool = Math.max(
      0,
      budget - earnnovaProfit
    );

    const customerReward =
      target > 0
        ? customerPool / target
        : 0;

    return {
      budget,
      target,
      profit,
      earnnovaProfit,
      customerPool,
      customerReward,
    };
  }, [
    totalBudget,
    targetViews,
    profitPercent,
  ]);

  /* =======================================================
     ADMIN CHECK
     ======================================================= */

  const checkAdmin = useCallback(async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.replace("/admin/login");
      return false;
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
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
      return false;
    }

    return true;
  }, [router]);

  /* =======================================================
     LOAD VIDEOS
     ======================================================= */

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const allowed = await checkAdmin();

      if (!allowed) return;

      const {
        data,
        error,
      } = await supabase
        .from("videos")
        .select(
          `
            id,
            video_url,
            target_views,
            total_budget,
            profit_percent,
            customer_pool,
            customer_reward,
            earnnova_profit,
            views,
            status,
            created_at
          `
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "VIDEOS LOAD ERROR:",
          error
        );

        setVideos([]);
        setErrorMessage(error.message);
        return;
      }

      const normalized: VideoItem[] =
        (data ?? []).map((item) => ({
          id: Number(item.id),
          video_url: item.video_url ?? "",
          target_views: Number(
            item.target_views ?? 0
          ),
          total_budget: Number(
            item.total_budget ?? 0
          ),
          profit_percent: Number(
            item.profit_percent ?? 0
          ),
          customer_pool: Number(
            item.customer_pool ?? 0
          ),
          customer_reward: Number(
            item.customer_reward ?? 0
          ),
          earnnova_profit: Number(
            item.earnnova_profit ?? 0
          ),
          views: Number(item.views ?? 0),
          status: item.status ?? "inactive",
          created_at: item.created_at ?? "",
        }));

      setVideos(normalized);
    } catch (error) {
      console.error(
        "LOAD VIDEOS ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load video campaigns."
      );
    } finally {
      setLoading(false);
    }
  }, [checkAdmin]);

  useEffect(() => {
    void loadVideos();
  }, [loadVideos]);

  /* =======================================================
     YOUTUBE URL VALIDATION
     ======================================================= */

  function isValidYouTubeUrl(
    url: string
  ): boolean {
    try {
      const parsed = new URL(url.trim());

      const host = parsed.hostname
        .toLowerCase()
        .replace(/^www\./, "");

      if (
        host !== "youtube.com" &&
        host !== "m.youtube.com" &&
        host !== "youtu.be"
      ) {
        return false;
      }

      if (host === "youtu.be") {
        return parsed.pathname.length > 1;
      }

      if (
        parsed.pathname === "/watch"
      ) {
        return Boolean(
          parsed.searchParams.get("v")
        );
      }

      if (
        parsed.pathname.startsWith(
          "/shorts/"
        )
      ) {
        return parsed.pathname.length > 8;
      }

      if (
        parsed.pathname.startsWith(
          "/embed/"
        )
      ) {
        return parsed.pathname.length > 7;
      }

      return false;
    } catch {
      return false;
    }
  }

  /* =======================================================
     ADD VIDEO
     ======================================================= */

  async function addVideo(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) return;

    setMessage("");
    setErrorMessage("");

    const cleanUrl = videoUrl.trim();

    const target = Number(
      targetViews
    );

    const budget = Number(
      totalBudget
    );

    const profit = Number(
      profitPercent
    );

    /* -----------------------------------------------------
       VALIDATION
       ----------------------------------------------------- */

    if (!cleanUrl) {
      setErrorMessage(
        "YouTube video link required hai."
      );
      return;
    }

    if (!isValidYouTubeUrl(cleanUrl)) {
      setErrorMessage(
        "Valid YouTube video link enter karo."
      );
      return;
    }

    if (
      !Number.isInteger(target) ||
      target <= 0
    ) {
      setErrorMessage(
        "Target customers 1 ya us se zyada hona chahiye."
      );
      return;
    }

    if (
      !Number.isFinite(budget) ||
      budget <= 0
    ) {
      setErrorMessage(
        "Campaign budget $0 se zyada hona chahiye."
      );
      return;
    }

    if (
      !Number.isFinite(profit) ||
      profit < 0 ||
      profit >= 100
    ) {
      setErrorMessage(
        "Profit percentage 0 se 99 ke darmiyan hona chahiye."
      );
      return;
    }

    const earnnovaProfit =
      budget * (profit / 100);

    const customerPool =
      budget - earnnovaProfit;

    const customerReward =
      customerPool / target;

    if (
      !Number.isFinite(
        customerReward
      ) ||
      customerReward <= 0
    ) {
      setErrorMessage(
        "Customer reward calculate nahi ho saka."
      );
      return;
    }

    /* -----------------------------------------------------
       ADMIN VERIFY
       ----------------------------------------------------- */

    setSaving(true);

    try {
      const allowed =
        await checkAdmin();

      if (!allowed) return;

      /* ---------------------------------------------------
         INSERT
         --------------------------------------------------- */

      const { error } =
        await supabase
          .from("videos")
          .insert({
            video_url: cleanUrl,

            target_views: target,

            total_budget: Number(
              budget.toFixed(2)
            ),

            profit_percent: Number(
              profit.toFixed(2)
            ),

            customer_pool: Number(
              customerPool.toFixed(2)
            ),

            customer_reward: Number(
              customerReward.toFixed(6)
            ),

            earnnova_profit: Number(
              earnnovaProfit.toFixed(2)
            ),

            views: 0,

            status: "active",
          });

      if (error) {
        console.error(
          "ADD VIDEO ERROR:",
          error
        );

        setErrorMessage(
          error.message
        );

        return;
      }

      setVideoUrl("");
      setTargetViews("100");
      setTotalBudget("10");
      setProfitPercent("30");

      setMessage(
        "Video campaign successfully add ho gayi."
      );

      await loadVideos();
    } catch (error) {
      console.error(
        "ADD VIDEO ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to add video campaign."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     TOGGLE VIDEO
     ======================================================= */

  async function toggleVideo(
    video: VideoItem
  ) {
    if (actionId !== null) return;

    setMessage("");
    setErrorMessage("");

    if (
      video.status === "completed"
    ) {
      setErrorMessage(
        "Completed campaign ko dobara activate nahi kiya ja sakta."
      );
      return;
    }

    const allowed =
      await checkAdmin();

    if (!allowed) return;

    const newStatus =
      video.status === "active"
        ? "inactive"
        : "active";

    setActionId(video.id);

    try {
      const { error } =
        await supabase
          .from("videos")
          .update({
            status: newStatus,
          })
          .eq("id", video.id);

      if (error) {
        console.error(
          "STATUS ERROR:",
          error
        );

        setErrorMessage(
          error.message
        );

        return;
      }

      setMessage(
        newStatus === "active"
          ? "Video campaign activated."
          : "Video campaign deactivated."
      );

      await loadVideos();
    } catch (error) {
      console.error(
        "TOGGLE ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update video campaign."
      );
    } finally {
      setActionId(null);
    }
  }

  /* =======================================================
     DELETE VIDEO
     ======================================================= */

  async function deleteVideo(
    id: number
  ) {
    if (actionId !== null) return;

    const video =
      videos.find(
        (item) => item.id === id
      );

    if (!video) return;

    const confirmed =
      window.confirm(
        `Campaign #${id} permanently delete karni hai?\n\nThis action cannot be undone.`
      );

    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");

    const allowed =
      await checkAdmin();

    if (!allowed) return;

    setActionId(id);

    try {
      const { error } =
        await supabase
          .from("videos")
          .delete()
          .eq("id", id);

      if (error) {
        console.error(
          "DELETE ERROR:",
          error
        );

        setErrorMessage(
          error.message
        );

        return;
      }

      setMessage(
        "Video campaign delete ho gayi."
      );

      await loadVideos();
    } catch (error) {
      console.error(
        "DELETE ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete video campaign."
      );
    } finally {
      setActionId(null);
    }
  }

  /* =======================================================
     STATS
     ======================================================= */

  const totalVideos =
    videos.length;

  const activeVideos =
    videos.filter(
      (video) =>
        video.status === "active"
    ).length;

  const completedVideos =
    videos.filter(
      (video) =>
        video.status === "completed"
    ).length;

  const totalViews =
    videos.reduce(
      (sum, video) =>
        sum + video.views,
      0
    );

  const totalCampaignBudget =
    videos.reduce(
      (sum, video) =>
        sum + video.total_budget,
      0
    );

  const totalProfit =
    videos.reduce(
      (sum, video) =>
        sum + video.earnnova_profit,
      0
    );

  /* =======================================================
     UI
     ======================================================= */

  return (
    <main className="min-h-screen bg-[#070b10] px-3 py-5 text-white sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
            ================================================= */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                router.push("/admin")
              }
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-blue-500 hover:text-white"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <div className="flex items-center gap-2">

                <Video
                  size={22}
                  className="text-blue-500"
                />

                <h1 className="text-2xl font-bold sm:text-3xl">
                  Video Campaigns
                </h1>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Manage video campaigns,
                customer rewards and
                EarnNova profit.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              void loadVideos()
            }
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

        </div>

        {/* =================================================
            EARNNOVA VIDEO RULE
            ================================================= */}

        <section className="mb-6 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">

          <div className="flex items-start gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Video size={19} />
            </div>

            <div>
              <h2 className="font-bold text-white">
                Video Earning Rule
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                Tasks aur videos separate earning systems hain.
                Customer side par maximum{" "}
                <span className="font-bold text-blue-400">
                  {DAILY_VIDEO_LIMIT} videos per day
                </span>{" "}
                allowed hain. Daily limit server-side enforce honi chahiye.
              </p>
            </div>

          </div>

        </section>

        {/* =================================================
            ADD CAMPAIGN
            ================================================= */}

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl sm:p-6">

          <div className="mb-6">

            <div className="flex items-center gap-2">

              <Plus
                size={20}
                className="text-blue-500"
              />

              <h2 className="text-xl font-bold">
                Add Video Campaign
              </h2>

            </div>

            <p className="mt-1 text-sm text-slate-500">
              Campaign budget aur
              EarnNova profit ke basis
              par customer reward
              automatically calculate hoga.
            </p>

          </div>

          <form
            onSubmit={addVideo}
            className="space-y-5"
          >

            {/* VIDEO URL */}

            <div>

              <label className="mb-2 block text-sm font-medium text-slate-300">
                YouTube Video Link
              </label>

              <div className="relative">

                <Link2
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) =>
                    setVideoUrl(
                      e.target.value
                    )
                  }
                  placeholder="https://youtube.com/watch?v=..."
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3.5 pl-11 pr-4 text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                />

              </div>

            </div>

            {/* NUMBERS */}

            <div className="grid gap-4 md:grid-cols-3">

              {/* TARGET */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Target Customers
                </label>

                <div className="relative">

                  <Target
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={targetViews}
                    onChange={(e) =>
                      setTargetViews(
                        e.target.value
                      )
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3.5 pl-11 pr-4 text-white outline-none focus:border-blue-500"
                  />

                </div>

                <p className="mt-1.5 text-xs text-slate-600">
                  Kitne unique customers
                  ko campaign serve karni hai.
                </p>

              </div>

              {/* BUDGET */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Total Campaign Budget
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                    $
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={totalBudget}
                    onChange={(e) =>
                      setTotalBudget(
                        e.target.value
                      )
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3.5 pl-9 pr-4 text-white outline-none focus:border-blue-500"
                  />

                </div>

                <p className="mt-1.5 text-xs text-slate-600">
                  Customer rewards +
                  EarnNova profit isi
                  budget se niklega.
                </p>

              </div>

              {/* PROFIT */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  EarnNova Profit
                </label>

                <div className="relative">

                  <TrendingUp
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="number"
                    min="0"
                    max="99.99"
                    step="0.01"
                    value={profitPercent}
                    onChange={(e) =>
                      setProfitPercent(
                        e.target.value
                      )
                    }
                    disabled={saving}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3.5 pl-11 pr-12 text-white outline-none focus:border-blue-500"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                    %
                  </span>

                </div>

                <p className="mt-1.5 text-xs text-slate-600">
                  Example: $100 budget,
                  30% = $30 EarnNova
                  profit.
                </p>

              </div>

            </div>

            {/* CALCULATION */}

            <div className="grid gap-3 sm:grid-cols-3">

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

                <p className="text-xs font-medium text-slate-500">
                  Customer Pool
                </p>

                <p className="mt-1 text-xl font-bold text-blue-400">
                  $
                  {calculations.customerPool.toFixed(
                    2
                  )}
                </p>

              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">

                <p className="text-xs font-medium text-slate-500">
                  Per Customer Reward
                </p>

                <p className="mt-1 text-xl font-bold text-emerald-400">
                  $
                  {calculations.customerReward.toFixed(
                    6
                  )}
                </p>

              </div>

              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">

                <p className="text-xs font-medium text-slate-500">
                  EarnNova Profit
                </p>

                <p className="mt-1 text-xl font-bold text-purple-400">
                  $
                  {calculations.earnnovaProfit.toFixed(
                    2
                  )}
                </p>

              </div>

            </div>

            {/* SUBMIT */}

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {saving ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />

                  Creating Campaign...
                </>
              ) : (
                <>
                  <Plus size={19} />

                  Add Video Campaign
                </>
              )}

            </button>

          </form>

        </section>

        {/* =================================================
            MESSAGES
            ================================================= */}

        {message && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">

            <CheckCircle2
              size={19}
              className="mt-0.5 shrink-0"
            />

            <span>{message}</span>

          </div>
        )}

        {errorMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">

            <XCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <span>{errorMessage}</span>

          </div>
        )}

        {/* =================================================
            STATS
            ================================================= */}

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

          <StatCard
            icon={<Video size={20} />}
            label="Total Campaigns"
            value={String(
              totalVideos
            )}
          />

          <StatCard
            icon={<Power size={20} />}
            label="Active"
            value={String(
              activeVideos
            )}
          />

          <StatCard
            icon={
              <CheckCircle2
                size={20}
              />
            }
            label="Completed"
            value={String(
              completedVideos
            )}
          />

          <StatCard
            icon={<Eye size={20} />}
            label="Total Views"
            value={totalViews.toLocaleString()}
          />

          <StatCard
            icon={<Wallet size={20} />}
            label="Total Profit"
            value={`$${totalProfit.toFixed(
              2
            )}`}
          />

        </div>

        {/* =================================================
            CAMPAIGN BUDGET SUMMARY
            ================================================= */}

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">

          <div className="flex items-center justify-between gap-3">

            <div>

              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Campaign Budget
              </p>

              <p className="mt-1 text-2xl font-black text-white">
                $
                {totalCampaignBudget.toFixed(
                  2
                )}
              </p>

            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Wallet size={20} />
            </div>

          </div>

        </div>

        {/* =================================================
            VIDEO LIBRARY
            ================================================= */}

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl">

          <div className="flex flex-col gap-2 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-xl font-bold">
                Video Campaign Library
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Har campaign ka budget,
                reward aur viewer progress.
              </p>

            </div>

            <div className="text-sm text-slate-500">
              {videos.length} campaign
              {videos.length === 1
                ? ""
                : "s"}
            </div>

          </div>

          {/* LOADING */}

          {loading ? (
            <div className="flex min-h-[250px] items-center justify-center">

              <div className="text-center">

                <Loader2
                  size={28}
                  className="mx-auto animate-spin text-blue-500"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Loading campaigns...
                </p>

              </div>

            </div>

          ) : videos.length === 0 ? (

            /* EMPTY */

            <div className="flex min-h-[280px] flex-col items-center justify-center px-5 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">

                <Video
                  size={28}
                  className="text-slate-500"
                />

              </div>

              <h3 className="mt-4 text-lg font-semibold">
                No video campaigns
              </h3>

              <p className="mt-1 max-w-md text-sm text-slate-500">
                Upar se apni first
                YouTube video campaign
                create karo.
              </p>

            </div>

          ) : (

            /* LIST */

            <div className="divide-y divide-slate-800">

              {videos.map(
                (video) => {

                  const progress =
                    video.target_views >
                    0
                      ? Math.min(
                          100,
                          (video.views /
                            video.target_views) *
                            100
                        )
                      : 0;

                  const remaining =
                    Math.max(
                      0,
                      video.target_views -
                        video.views
                    );

                  const busy =
                    actionId ===
                    video.id;

                  return (
                    <div
                      key={video.id}
                      className="p-5 transition hover:bg-slate-950/40 sm:p-6"
                    >

                      {/* TOP */}

                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-400">
                              Campaign #
                              {video.id}
                            </span>

                            {video.status ===
                              "active" && (
                              <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                                Active
                              </span>
                            )}

                            {video.status ===
                              "completed" && (
                              <span className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400">
                                Completed
                              </span>
                            )}

                            {video.status ===
                              "inactive" && (
                              <span className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400">
                                Inactive
                              </span>
                            )}

                          </div>

                          {/* LINK */}

                          <div className="mt-3 flex items-center gap-2">

                            <Link2
                              size={17}
                              className="shrink-0 text-red-500"
                            />

                            <a
                              href={
                                video.video_url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate text-sm text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              {
                                video.video_url
                              }
                            </a>

                          </div>

                        </div>

                        {/* ACTIONS */}

                        <div className="flex shrink-0 flex-wrap gap-2">

                          <a
                            href={
                              video.video_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:text-white"
                          >
                            <ExternalLink
                              size={16}
                            />

                            Open
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              void toggleVideo(
                                video
                              )
                            }
                            disabled={
                              busy ||
                              video.status ===
                                "completed"
                            }
                            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >

                            {busy ? (
                              <Loader2
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Power
                                size={16}
                              />
                            )}

                            {video.status ===
                            "active"
                              ? "Pause"
                              : "Activate"}

                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void deleteVideo(
                                video.id
                              )
                            }
                            disabled={busy}
                            className="flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                          >

                            {busy ? (
                              <Loader2
                                size={17}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2
                                size={17}
                              />
                            )}

                          </button>

                        </div>

                      </div>

                      {/* PROGRESS */}

                      <div className="mt-6">

                        <div className="mb-2 flex items-center justify-between gap-3">

                          <div className="flex items-center gap-2 text-sm font-medium text-slate-300">

                            <Eye
                              size={17}
                              className="text-blue-400"
                            />

                            {video.views.toLocaleString()}
                            {" / "}
                            {video.target_views.toLocaleString()}
                            {" unique viewers"}

                          </div>

                          <span className="text-sm font-bold text-blue-400">
                            {progress.toFixed(
                              1
                            )}
                            %
                          </span>

                        </div>

                        <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">

                          <div
                            className="h-full rounded-full bg-blue-600 transition-all"
                            style={{
                              width: `${progress}%`,
                            }}
                          />

                        </div>

                        <p className="mt-2 text-xs text-slate-600">
                          {remaining.toLocaleString()}{" "}
                          viewers remaining
                        </p>

                      </div>

                      {/* FINANCIAL INFO */}

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">

                        <InfoBox
                          label="Total Budget"
                          value={`$${video.total_budget.toFixed(
                            2
                          )}`}
                        />

                        <InfoBox
                          label="Customer Pool"
                          value={`$${video.customer_pool.toFixed(
                            2
                          )}`}
                        />

                        <InfoBox
                          label="Per Customer"
                          value={`$${video.customer_reward.toFixed(
                            6
                          )}`}
                        />

                        <InfoBox
                          label="Profit"
                          value={`$${video.earnnova_profit.toFixed(
                            2
                          )}`}
                        />

                        <InfoBox
                          label="Profit %"
                          value={`${video.profit_percent.toFixed(
                            2
                          )}%`}
                        />

                      </div>

                      {/* DATE */}

                      {video.created_at && (
                        <p className="mt-4 text-xs text-slate-600">
                          Created{" "}
                          {new Date(
                            video.created_at
                          ).toLocaleString()}
                        </p>
                      )}

                    </div>
                  );
                }
              )}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}

/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">

      <div className="flex items-center justify-between">

        <div className="text-slate-500">
          {icon}
        </div>

      </div>

      <p className="mt-4 text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-bold text-white">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
   INFO BOX
   ========================================================= */

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">

      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-200">
        {value}
      </p>

    </div>
  );
}