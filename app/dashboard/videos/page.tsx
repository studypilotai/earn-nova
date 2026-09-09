"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AvailableVideo = {
  id: number;
};

export default function VideosPage() {
  const [video, setVideo] = useState<AvailableVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadAvailableVideo = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.replace("/login");
        return;
      }

      /*
       * Get videos already completed by this user.
       * The actual reward remains hidden.
       */
      const { data: completedVideos, error: completedError } =
        await supabase
          .from("video_completions")
          .select("video_id")
          .eq("user_id", user.id);

      if (completedError) {
        console.error("COMPLETED VIDEOS ERROR:", completedError);
        setErrorMessage("Unable to check your completed videos.");
        return;
      }

      const completedIds = new Set(
        (completedVideos ?? []).map((item) => Number(item.video_id))
      );

      /*
       * Load active videos only.
       *
       * IMPORTANT:
       * We intentionally do NOT select:
       * title
       * description
       * reward
       * video_url
       *
       * These remain hidden from the user-facing page.
       */
      const { data: activeVideos, error: videosError } = await supabase
        .from("videos")
        .select("id")
        .eq("status", "active");

      if (videosError) {
        console.error("VIDEOS ERROR:", videosError);
        setErrorMessage("Unable to load available videos.");
        return;
      }

      const eligibleVideos = (activeVideos ?? []).filter(
        (item) => !completedIds.has(Number(item.id))
      );

      if (eligibleVideos.length === 0) {
        setVideo(null);
        return;
      }

      /*
       * Random selection.
       * Later this can be replaced by a server-side algorithm.
       */
      const randomIndex = Math.floor(
        Math.random() * eligibleVideos.length
      );

      const selectedVideo = eligibleVideos[randomIndex];

      setVideo({
        id: Number(selectedVideo.id),
      });
    } catch (error) {
      console.error("VIDEOS PAGE ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAvailableVideo();
  }, [loadAvailableVideo]);

  const startVideo = async () => {
    if (!video || starting) return;

    setStarting(true);
    setErrorMessage("");

    try {
      /*
       * For security, the real video URL should ideally be returned
       * from a protected server/API route after validating:
       * - logged-in user
       * - active membership
       * - daily limit
       * - video eligibility
       *
       * This frontend does NOT expose the reward.
       */

      const { data, error } = await supabase
        .from("videos")
        .select("video_url")
        .eq("id", video.id)
        .eq("status", "active")
        .single();

      if (error || !data?.video_url) {
        setErrorMessage("This video is currently unavailable.");
        return;
      }

      /*
       * Store a temporary session marker.
       * Final reward validation must happen server-side.
       */
      sessionStorage.setItem(
        "earnNovaVideoSession",
        JSON.stringify({
          videoId: video.id,
          startedAt: Date.now(),
        })
      );

      window.location.href = data.video_url;
    } catch (error) {
      console.error("START VIDEO ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to start video."
      );
    } finally {
      setStarting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070b10] px-3 py-4 text-white sm:px-5 sm:py-7">
      <div className="mx-auto w-full max-w-[570px]">

        {/* HEADER */}
        <header className="mb-5 flex items-center gap-3">
          <a
            href="/dashboard"
            aria-label="Back to Dashboard"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-white"
          >
            <ArrowLeft size={20} />
          </a>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg">
            <span className="text-lg font-black italic text-slate-950">
              E<span className="text-blue-600">N</span>
            </span>
          </div>

          <div>
            <h1 className="text-lg font-extrabold">
              Earn<span className="text-blue-500">Nova</span>
            </h1>

            <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600">
              Watch Videos
            </p>
          </div>
        </header>

        {/* INTRO */}
        <section className="mb-4 rounded-[20px] border border-blue-500/10 bg-blue-500/[0.04] p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <PlayCircle size={25} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400">
                Earn More
              </p>

              <h2 className="mt-1 text-xl font-black">
                Watch & Earn
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Complete the available video activity
                according to your membership limits.
              </p>
            </div>
          </div>
        </section>

        {/* CONDITIONS */}
        <section className="mb-4 rounded-[20px] border border-slate-800 bg-[#11151b] p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <ShieldCheck size={20} />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">
                Before You Start
              </h3>

              <p className="text-[10px] text-slate-600">
                Please follow the conditions
              </p>
            </div>
          </div>

          <div className="space-y-2.5">

            <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#0c1016] p-3">
              <CheckCircle2
                size={16}
                className="mt-0.5 shrink-0 text-green-400"
              />

              <p className="text-[11px] leading-5 text-slate-400">
                Complete the required watch session before
                returning to EarnNova.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#0c1016] p-3">
              <Clock3
                size={16}
                className="mt-0.5 shrink-0 text-blue-400"
              />

              <p className="text-[11px] leading-5 text-slate-400">
                Returning before the required timer/session
                is completed will not qualify the activity.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#0c1016] p-3">
              <Video
                size={16}
                className="mt-0.5 shrink-0 text-purple-400"
              />

              <p className="text-[11px] leading-5 text-slate-400">
                Each activity can only be completed once.
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#0c1016] p-3">
              <Sparkles
                size={16}
                className="mt-0.5 shrink-0 text-amber-400"
              />

              <p className="text-[11px] leading-5 text-slate-400">
                Your daily activity limit depends on your
                active membership plan.
              </p>
            </div>

          </div>
        </section>

        {/* LOADING */}
        {loading && (
          <div className="rounded-[20px] border border-slate-800 bg-[#11151b] p-8 text-center">
            <Loader2
              size={29}
              className="mx-auto animate-spin text-blue-500"
            />

            <p className="mt-3 text-sm font-semibold text-slate-400">
              Finding an available activity...
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && errorMessage && (
          <div className="rounded-[20px] border border-red-500/20 bg-[#11151b] p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-lg font-black text-red-400">
              !
            </div>

            <h3 className="mt-4 text-base font-bold">
              Activity Unavailable
            </h3>

            <p className="mt-2 break-words text-xs leading-5 text-slate-500">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => void loadAvailableVideo()}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-500"
            >
              Try Again
            </button>
          </div>
        )}

        {/* NO VIDEO */}
        {!loading &&
          !errorMessage &&
          !video && (
            <div className="rounded-[20px] border border-slate-800 bg-[#11151b] p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500">
                <Video size={25} />
              </div>

              <h3 className="mt-4 text-base font-bold">
                No Activity Available
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                You have completed the currently available
                activities. Please check again later.
              </p>
            </div>
          )}

        {/* WATCH CARD */}
        {!loading &&
          !errorMessage &&
          video && (
            <section className="rounded-[20px] border border-blue-500/20 bg-[#11151b] p-5 shadow-[0_0_40px_rgba(37,99,235,0.06)]">

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                  <PlayCircle size={25} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400">
                    Available
                  </p>

                  <h3 className="mt-1 text-base font-black">
                    New Video Activity
                  </h3>
                </div>

                <div className="ml-auto h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
              </div>

              {/* CONDITIONS WITH BUTTON */}
              <div className="mt-5 rounded-2xl border border-slate-800 bg-[#0c1016] p-4">

                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                    Conditions
                  </p>

                  <ul className="mt-3 space-y-2">
                    <li className="flex gap-2 text-[11px] leading-5 text-slate-400">
                      <span className="text-blue-400">•</span>
                      Complete the required timer/session.
                    </li>

                    <li className="flex gap-2 text-[11px] leading-5 text-slate-400">
                      <span className="text-blue-400">•</span>
                      Do not leave before completion.
                    </li>

                    <li className="flex gap-2 text-[11px] leading-5 text-slate-400">
                      <span className="text-blue-400">•</span>
                      One activity can only be completed once.
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => void startVideo()}
                  disabled={starting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {starting ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Starting...
                    </>
                  ) : (
                    <>
                      <PlayCircle size={17} />
                      Watch Now
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[9px] leading-4 text-slate-600">
                  Activity details and reward values are handled
                  automatically by EarnNova.
                </p>
              </div>
            </section>
          )}

        {/* FOOTER */}
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