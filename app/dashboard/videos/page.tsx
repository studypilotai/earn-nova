"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Loader2,
  PlayCircle,
  Sparkles,
  Video,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type VideoTask = {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  video_url: string | null;
  status: string;
  created_at: string;
};

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("AUTH ERROR:", userError);
        setErrorMessage("Unable to verify your account.");
        return;
      }

      if (!user) {
        window.location.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("videos")
        .select(`
          id,
          title,
          description,
          reward,
          video_url,
          status,
          created_at
        `)
        .eq("status", "active")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("VIDEOS ERROR:", error);

        setErrorMessage(
          error.message || "Unable to load videos."
        );

        return;
      }

      const formattedVideos: VideoTask[] = (data ?? []).map(
        (video) => ({
          id: String(video.id),
          title: video.title ?? "Untitled Video",
          description: video.description ?? null,
          reward: Number(video.reward ?? 0),
          video_url: video.video_url ?? null,
          status: video.status ?? "active",
          created_at: video.created_at,
        })
      );

      setVideos(formattedVideos);
    } catch (error) {
      console.error("VIDEOS PAGE ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading videos."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVideos();
  }, [loadVideos]);

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

        {/* PAGE INTRO */}
        <section className="mb-5 rounded-[20px] border border-blue-500/10 bg-blue-500/[0.04] p-5">
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
                Watch available videos and earn
                rewards for completing them.
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
              Loading videos...
            </p>
          </div>
        )}

        {/* ERROR */}
        {!loading && errorMessage && (
          <div className="rounded-[20px] border border-red-500/20 bg-[#11151b] p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-xl font-black text-red-400">
              !
            </div>

            <h3 className="mt-4 text-base font-bold">
              Unable to Load Videos
            </h3>

            <p className="mt-2 break-words text-xs leading-5 text-slate-500">
              {errorMessage}
            </p>

            <button
              type="button"
              onClick={() => void loadVideos()}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-500"
            >
              Try Again
            </button>
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          !errorMessage &&
          videos.length === 0 && (
            <div className="rounded-[20px] border border-slate-800 bg-[#11151b] p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500">
                <Video size={25} />
              </div>

              <h3 className="mt-4 text-base font-bold">
                No Videos Available
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                There are no active videos right now.
                Please check again later.
              </p>
            </div>
          )}

        {/* VIDEO ROWS */}
        {!loading &&
          !errorMessage &&
          videos.length > 0 && (
            <section className="space-y-2">
              {videos.map((video) => (
                <a
                  key={video.id}
                  href={`/dashboard/videos/${video.id}`}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#11151b] p-3.5 transition hover:border-blue-500/30 hover:bg-blue-500/[0.03]"
                >
                  {/* VIDEO ICON */}
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <PlayCircle size={21} />

                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-[#11151b]" />
                  </div>

                  {/* INFORMATION */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-bold text-white">
                      {video.title}
                    </h3>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[9px] font-semibold text-green-400">
                        <CheckCircle2 size={10} />
                        Available
                      </span>

                      <span className="text-slate-700">
                        •
                      </span>

                      <span className="flex items-center gap-1 text-[9px] text-slate-600">
                        <Clock3 size={10} />
                        Watch
                      </span>
                    </div>
                  </div>

                  {/* REWARD */}
                  <div className="shrink-0 text-right">
                    <p className="text-[8px] font-bold uppercase tracking-wider text-slate-600">
                      Reward
                    </p>

                    <p className="mt-0.5 text-sm font-black text-green-400">
                      +${video.reward.toFixed(2)}
                    </p>
                  </div>

                  {/* ARROW */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition group-hover:bg-blue-500">
                    <ArrowRight size={16} />
                  </div>
                </a>
              ))}
            </section>
          )}

        {/* INFO */}
        {!loading &&
          !errorMessage &&
          videos.length > 0 && (
            <section className="mt-5 rounded-2xl border border-amber-500/10 bg-amber-500/[0.04] p-4">
              <div className="flex items-start gap-3">
                <Sparkles
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-400"
                />

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400">
                    Important
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Watch the complete video before
                    attempting to claim its reward.
                    Each video can only be completed
                    once.
                  </p>
                </div>
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