"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  Plus,
  Power,
  RefreshCw,
  Trash2,
  Video,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type VideoItem = {
  id: number;
  video_url: string | null;
  status: string;
  created_at: string;
};

export default function AdminVideosPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [videoUrl, setVideoUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadVideos = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        window.location.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("videos")
        .select("id, video_url, status, created_at")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("VIDEOS ERROR:", error);
        setErrorMessage(error.message);
        return;
      }

      setVideos(
        (data ?? []).map((item) => ({
          id: Number(item.id),
          video_url: item.video_url ?? null,
          status: item.status ?? "inactive",
          created_at: item.created_at,
        }))
      );
    } catch (error) {
      console.error("LOAD VIDEOS ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load videos."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVideos();
  }, [loadVideos]);

  const isValidYouTubeUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();

      return (
        host === "youtube.com" ||
        host === "www.youtube.com" ||
        host === "m.youtube.com" ||
        host === "youtu.be" ||
        host === "www.youtu.be"
      );
    } catch {
      return false;
    }
  };

  const addVideo = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    const cleanUrl = videoUrl.trim();

    if (!cleanUrl) {
      setErrorMessage("YouTube video link is required.");
      return;
    }

    if (!isValidYouTubeUrl(cleanUrl)) {
      setErrorMessage("Please enter a valid YouTube link.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        window.location.replace("/login");
        return;
      }

      /*
       * Only the URL is supplied by admin.
       *
       * Everything else is controlled automatically:
       * - reward
       * - title
       * - timer
       * - selection
       * - user limits
       * - completion
       */

      const { error } = await supabase
        .from("videos")
        .insert({
          video_url: cleanUrl,
          status: "active",
        });

      if (error) {
        console.error("ADD VIDEO ERROR:", error);
        setErrorMessage(error.message);
        return;
      }

      setVideoUrl("");
      setMessage("Video added successfully.");

      await loadVideos();
    } catch (error) {
      console.error("ADD VIDEO ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to add video."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleVideo = async (
    id: number,
    currentStatus: string
  ) => {
    setMessage("");
    setErrorMessage("");

    const newStatus =
      currentStatus === "active"
        ? "inactive"
        : "active";

    try {
      const { error } = await supabase
        .from("videos")
        .update({
          status: newStatus,
        })
        .eq("id", id);

      if (error) {
        console.error("STATUS ERROR:", error);
        setErrorMessage(error.message);
        return;
      }

      setMessage(
        newStatus === "active"
          ? "Video activated."
          : "Video deactivated."
      );

      await loadVideos();
    } catch (error) {
      console.error("TOGGLE ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update video."
      );
    }
  };

  const deleteVideo = async (id: number) => {
    const confirmed = window.confirm(
      "Delete this video?"
    );

    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("DELETE ERROR:", error);
        setErrorMessage(error.message);
        return;
      }

      setMessage("Video deleted successfully.");

      await loadVideos();
    } catch (error) {
      console.error("DELETE ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete video."
      );
    }
  };

  const activeVideos = videos.filter(
    (video) => video.status === "active"
  ).length;

  return (
    <main className="min-h-screen bg-[#070b10] px-3 py-5 text-white sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">

        {/* HEADER */}
        <header className="mb-6 flex items-center gap-3">

          <a
            href="/admin"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/40 hover:text-white"
          >
            <ArrowLeft size={19} />
          </a>

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20">
            <Video size={20} />
          </div>

          <div>
            <h1 className="text-lg font-black">
              Video Management
            </h1>

            <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600">
              EarnNova Admin
            </p>
          </div>

        </header>

        {/* ADD VIDEO */}
        <section className="mb-5 rounded-[20px] border border-blue-500/15 bg-[#11151b] p-5">

          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Link2 size={19} />
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-400">
                Add Video
              </p>

              <h2 className="mt-1 text-base font-black">
                YouTube Video Link
              </h2>

              <p className="mt-1 text-[10px] leading-5 text-slate-600">
                Paste the YouTube link. Everything else is
                handled automatically.
              </p>
            </div>
          </div>

          <form
            onSubmit={addVideo}
            className="flex flex-col gap-3 sm:flex-row"
          >

            <div className="relative flex-1">
              <Link2
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"
              />

              <input
                type="url"
                required
                value={videoUrl}
                onChange={(event) =>
                  setVideoUrl(event.target.value)
                }
                placeholder="Paste YouTube video link..."
                className="h-12 w-full rounded-xl border border-slate-800 bg-[#0b0f14] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-blue-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-xs font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                  Adding...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Add Video
                </>
              )}
            </button>

          </form>

          {/* AUTOMATIC SYSTEM INFO */}
          <div className="mt-4 grid gap-2 sm:grid-cols-3">

            <div className="rounded-xl border border-slate-800 bg-[#0c1016] p-3">
              <p className="text-[9px] font-bold text-slate-600">
                REWARD
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                Automatically controlled
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0c1016] p-3">
              <p className="text-[9px] font-bold text-slate-600">
                TIMER
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                Automatically controlled
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0c1016] p-3">
              <p className="text-[9px] font-bold text-slate-600">
                SELECTION
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                Automatic algorithm
              </p>
            </div>

          </div>
        </section>

        {/* MESSAGES */}
        {message && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/[0.04] px-4 py-3 text-xs font-semibold text-green-400">
            <CheckCircle2 size={15} />
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.04] px-4 py-3 text-xs font-semibold text-red-400">
            {errorMessage}
          </div>
        )}

        {/* STATS */}
        <div className="mb-5 grid grid-cols-2 gap-3">

          <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
              Total Videos
            </p>

            <p className="mt-2 text-2xl font-black">
              {videos.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
              Active Videos
            </p>

            <p className="mt-2 text-2xl font-black text-green-400">
              {activeVideos}
            </p>
          </div>

        </div>

        {/* VIDEO LIBRARY */}
        <section className="overflow-hidden rounded-[20px] border border-slate-800 bg-[#11151b]">

          <div className="flex items-center justify-between border-b border-slate-800 p-4">

            <div>
              <h2 className="text-sm font-black">
                Video Library
              </h2>

              <p className="mt-1 text-[9px] text-slate-600">
                Only video links are managed here
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadVideos()}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#0c1016] text-slate-500 transition hover:text-white"
            >
              <RefreshCw
                size={15}
                className={
                  loading ? "animate-spin" : ""
                }
              />
            </button>

          </div>

          {/* LOADING */}
          {loading && (
            <div className="p-10 text-center">
              <Loader2
                size={26}
                className="mx-auto animate-spin text-blue-500"
              />

              <p className="mt-3 text-xs text-slate-600">
                Loading videos...
              </p>
            </div>
          )}

          {/* EMPTY */}
          {!loading && videos.length === 0 && (
            <div className="p-10 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500">
                <Video size={24} />
              </div>

              <h3 className="mt-4 text-sm font-bold">
                No Videos Added
              </h3>

              <p className="mt-2 text-xs text-slate-600">
                Paste a YouTube link above to add a video.
              </p>

            </div>
          )}

          {/* LIST */}
          {!loading && videos.length > 0 && (
            <div className="divide-y divide-slate-800">

              {videos.map((video, index) => {
                const active =
                  video.status === "active";

                return (
                  <div
                    key={video.id}
                    className="flex items-center gap-3 p-4 transition hover:bg-blue-500/[0.02]"
                  >

                    {/* NUMBER */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-xs font-black text-blue-400">
                      {index + 1}
                    </div>

                    {/* LINK */}
                    <div className="min-w-0 flex-1">

                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-600">
                        YouTube Link
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {video.video_url}
                      </p>

                      <div className="mt-2 flex items-center gap-2">

                        <span
                          className={`flex items-center gap-1 text-[8px] font-bold ${
                            active
                              ? "text-green-400"
                              : "text-slate-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              active
                                ? "bg-green-400"
                                : "bg-slate-600"
                            }`}
                          />

                          {active
                            ? "ACTIVE"
                            : "INACTIVE"}
                        </span>

                        <span className="text-[8px] text-slate-700">
                          ID: {video.id}
                        </span>

                      </div>
                    </div>

                    {/* OPEN */}
                    {video.video_url && (
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#0c1016] text-slate-500 transition hover:border-blue-500/30 hover:text-blue-400"
                        aria-label="Open video"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}

                    {/* ACTIVE / INACTIVE */}
                    <button
                      type="button"
                      onClick={() =>
                        void toggleVideo(
                          video.id,
                          video.status
                        )
                      }
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                        active
                          ? "border-green-500/20 bg-green-500/5 text-green-400 hover:bg-green-500/10"
                          : "border-slate-800 bg-[#0c1016] text-slate-600 hover:text-white"
                      }`}
                      aria-label="Toggle video"
                    >
                      <Power size={15} />
                    </button>

                    {/* DELETE */}
                    <button
                      type="button"
                      onClick={() =>
                        void deleteVideo(video.id)
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/10 bg-red-500/[0.03] text-red-400 transition hover:bg-red-500/10"
                      aria-label="Delete video"
                    >
                      <Trash2 size={15} />
                    </button>

                  </div>
                );
              })}

            </div>
          )}

        </section>

        {/* FOOTER */}
        <footer className="py-7 text-center">
          <p className="text-[9px] uppercase tracking-[0.18em] text-slate-700">
            EarnNova Admin
          </p>
        </footer>

      </div>
    </main>
  );
}