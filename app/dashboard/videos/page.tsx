"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Video,
  XCircle,
} from "lucide-react";

/* =========================================================
   TYPES
========================================================= */

type AvailableVideo = {
  id: number;
};

type WatchSession = {
  sessionId: number;
  videoId: number;
  videoUrl: string;
};

/* =========================================================
   SETTINGS
========================================================= */

/*
 * EarnNova video system:
 *
 * Videos are separate from tasks.
 * Maximum 50 video activities per day.
 */
const DAILY_VIDEO_LIMIT = 50;

/*
 * Customer must keep the video session open
 * for this amount of time.
 */
const WATCH_SECONDS = 30;

/* =========================================================
   PAGE
========================================================= */

export default function VideosPage() {
  const router = useRouter();
  const supabase = createClient();

  const [video, setVideo] =
    useState<AvailableVideo | null>(null);

  const [session, setSession] =
    useState<WatchSession | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [starting, setStarting] =
    useState(false);

  const [completing, setCompleting] =
    useState(false);

  const [secondsLeft, setSecondsLeft] =
    useState(WATCH_SECONDS);

  const [completedToday, setCompletedToday] =
    useState(0);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  /* =======================================================
     LOAD AVAILABLE VIDEO
  ======================================================= */

  const loadAvailableVideo =
    useCallback(async () => {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        /*
         * AUTH
         */

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        /*
         * CHECK TODAY'S COMPLETED VIDEOS
         */

        const startOfDay =
          new Date();

        startOfDay.setHours(
          0,
          0,
          0,
          0
        );

        const {
          data: completed,
          error: completedError,
        } = await supabase
          .from("video_views")
          .select(
            "video_id, completed_at"
          )
          .eq(
            "user_id",
            user.id
          )
          .gte(
            "completed_at",
            startOfDay.toISOString()
          );

        if (completedError) {
          console.error(
            "VIDEO VIEWS ERROR:",
            completedError
          );

          setErrorMessage(
            "Unable to check completed activities."
          );

          return;
        }

        const completedList =
          completed ?? [];

        setCompletedToday(
          completedList.length
        );

        /*
         * DAILY VIDEO LIMIT
         */

        if (
          completedList.length >=
          DAILY_VIDEO_LIMIT
        ) {
          setVideo(null);
          return;
        }

        /*
         * LOAD ONLY ACTIVE VIDEO IDs.
         *
         * We intentionally do NOT fetch:
         *
         * - reward
         * - budget
         * - profit
         * - target
         * - video URL
         *
         * The actual video URL is returned
         * through the secure RPC session.
         */

        const {
          data,
          error,
        } = await supabase
          .from("videos")
          .select("id")
          .eq(
            "status",
            "active"
          )
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (error) {
          console.error(
            "AVAILABLE VIDEOS ERROR:",
            error
          );

          setErrorMessage(
            "Unable to load available videos."
          );

          return;
        }

        if (
          !data ||
          data.length === 0
        ) {
          setVideo(null);
          return;
        }

        /*
         * REMOVE ALREADY COMPLETED VIDEOS
         */

        const completedIds =
          new Set(
            completedList.map(
              (item) =>
                Number(
                  item.video_id
                )
            )
          );

        const eligible =
          data.filter(
            (item) =>
              !completedIds.has(
                Number(item.id)
              )
          );

        if (
          eligible.length === 0
        ) {
          setVideo(null);
          return;
        }

        /*
         * RANDOM VIDEO SELECTION
         *
         * The customer does not see the
         * campaign ID or reward.
         */

        const randomIndex =
          Math.floor(
            Math.random() *
              eligible.length
          );

        setVideo({
          id: Number(
            eligible[
              randomIndex
            ].id
          ),
        });
      } catch (error) {
        console.error(
          "VIDEOS PAGE ERROR:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }, [router, supabase]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadAvailableVideo();
  }, [loadAvailableVideo]);

  /* =======================================================
     TIMER
  ======================================================= */

  useEffect(() => {
    if (!session) {
      return;
    }

    if (
      secondsLeft <= 0
    ) {
      return;
    }

    const timer =
      window.setInterval(() => {
        setSecondsLeft(
          (current) =>
            Math.max(
              0,
              current - 1
            )
        );
      }, 1000);

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    session,
    secondsLeft,
  ]);

  /* =======================================================
     START VIDEO
  ======================================================= */

  const startVideo =
    async () => {
      if (
        !video ||
        starting
      ) {
        return;
      }

      setStarting(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        /*
         * SECURITY:
         *
         * We do NOT fetch video_url directly
         * from the videos table.
         *
         * The RPC creates a server-side session.
         */

        const {
          data,
          error,
        } = await supabase.rpc(
          "start_video_campaign",
          {
            p_video_id:
              video.id,
          }
        );

        if (error) {
          console.error(
            "START VIDEO RPC ERROR:",
            error
          );

          setErrorMessage(
            error.message ||
              "Unable to start video."
          );

          return;
        }

        if (
          !data ||
          !data.video_url ||
          !data.session_id
        ) {
          setErrorMessage(
            "Video session start nahi ho saka."
          );

          return;
        }

        const newSession: WatchSession =
          {
            sessionId:
              Number(
                data.session_id
              ),

            videoId:
              Number(
                data.video_id ??
                  video.id
              ),

            videoUrl:
              String(
                data.video_url
              ),
          };

        setSession(
          newSession
        );

        setSecondsLeft(
          WATCH_SECONDS
        );

        /*
         * Store ONLY session ID and video ID.
         *
         * Reward is never stored.
         */

        sessionStorage.setItem(
          "earnNovaVideoSession",
          JSON.stringify({
            sessionId:
              newSession.sessionId,

            videoId:
              newSession.videoId,
          })
        );

        /*
         * Open the assigned video.
         */

        const opened =
          window.open(
            newSession.videoUrl,
            "_blank",
            "noopener,noreferrer"
          );

        /*
         * Some browsers block popup
         * if it is not considered user initiated.
         */

        if (!opened) {
          setErrorMessage(
            "Video open nahi ho saka. Please Watch Now dobara press karein."
          );
        }
      } catch (error) {
        console.error(
          "START VIDEO ERROR:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to start video."
        );
      } finally {
        setStarting(false);
      }
    };

  /* =======================================================
     COMPLETE VIDEO
  ======================================================= */

  const completeVideo =
    async () => {
      if (
        !session ||
        completing ||
        secondsLeft > 0
      ) {
        return;
      }

      setCompleting(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        /*
         * Reward is calculated entirely
         * inside the secure RPC.
         *
         * Browser cannot choose reward.
         */

        const {
          data,
          error,
        } = await supabase.rpc(
          "complete_video_campaign",
          {
            p_session_id:
              session.sessionId,
          }
        );

        if (error) {
          console.error(
            "COMPLETE VIDEO ERROR:",
            error
          );

          setErrorMessage(
            error.message ||
              "Unable to complete video."
          );

          return;
        }

        if (
          !data ||
          !data.success
        ) {
          setErrorMessage(
            "Video completion verify nahi ho saki."
          );

          return;
        }

        /*
         * IMPORTANT:
         *
         * Actual reward is NOT displayed.
         */

        setSuccessMessage(
          "Video successfully completed. Your earning has been added to your wallet."
        );

        setCompletedToday(
          (current) =>
            current + 1
        );

        sessionStorage.removeItem(
          "earnNovaVideoSession"
        );

        setSession(null);
        setVideo(null);

        /*
         * Load another available video.
         */

        window.setTimeout(() => {
          void loadAvailableVideo();
        }, 800);
      } catch (error) {
        console.error(
          "COMPLETE VIDEO ERROR:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to complete video."
        );
      } finally {
        setCompleting(false);
      }
    };

  /* =======================================================
     PROGRESS
  ======================================================= */

  const progress =
    session
      ? Math.min(
          100,
          ((WATCH_SECONDS -
            secondsLeft) /
            WATCH_SECONDS) *
            100
        )
      : 0;

  const videosRemaining =
    Math.max(
      DAILY_VIDEO_LIMIT -
        completedToday,
      0
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#070b10] px-3 py-4 text-white sm:px-5 sm:py-7">
      <div className="mx-auto w-full max-w-[570px]">

        {/* =================================================
            HEADER
        ================================================== */}

        <header className="mb-5 flex items-center gap-3">

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard"
              )
            }
            aria-label="Back to Dashboard"
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-slate-800
              bg-[#11151b]
              text-slate-400
              transition
              hover:border-blue-500/40
              hover:bg-blue-500/5
              hover:text-white
            "
          >
            <ArrowLeft
              size={20}
            />
          </button>

          {/* MASTER LOGO */}

          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
            <div className="absolute inset-0 rounded-[12px] bg-blue-600/20 blur-md" />

            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[12px] border border-blue-400/20 bg-gradient-to-br from-white via-slate-100 to-blue-50 shadow-xl">

              <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-blue-500/20 blur-md" />

              <div className="relative flex items-center justify-center">

                <span className="text-[17px] font-black italic tracking-[-0.15em] text-slate-950">
                  E
                </span>

                <span className="-ml-0.5 text-[17px] font-black italic tracking-[-0.15em] text-blue-600">
                  N
                </span>

              </div>

              <div className="absolute bottom-1 left-1.5 h-[2px] w-4 rounded-full bg-blue-500" />

            </div>
          </div>

          <div className="min-w-0">

            <h1 className="text-lg font-black tracking-tight">
              Earn
              <span className="text-blue-500">
                Nova
              </span>
            </h1>

            <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-slate-600">
              Earn • Grow • Repeat
            </p>

          </div>

          {/* REFRESH */}

          <button
            type="button"
            onClick={() =>
              void loadAvailableVideo()
            }
            disabled={
              loading ||
              !!session
            }
            aria-label="Refresh videos"
            className="
              ml-auto
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-slate-800
              bg-[#11151b]
              text-slate-400
              transition
              hover:border-blue-500/40
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
          </button>

        </header>

        {/* =================================================
            INTRO
        ================================================== */}

        <section className="mb-4 rounded-[20px] border border-blue-500/10 bg-blue-500/[0.04] p-5">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <PlayCircle
                size={25}
              />
            </div>

            <div className="min-w-0 flex-1">

              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400">
                Earn More
              </p>

              <h2 className="mt-1 text-xl font-black">
                Watch & Earn
              </h2>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Watch available video activities
                and complete the required session
                to earn.
              </p>

            </div>

            <div className="shrink-0 rounded-xl border border-slate-800 bg-[#11151b] px-3 py-2 text-right">

              <p className="text-[8px] font-bold uppercase tracking-wider text-slate-600">
                Today
              </p>

              <p className="mt-0.5 text-sm font-black text-blue-400">
                {completedToday}/
                {DAILY_VIDEO_LIMIT}
              </p>

            </div>

          </div>

          {/* PROGRESS */}

          <div className="mt-4">

            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">

              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${Math.min(
                    (completedToday /
                      DAILY_VIDEO_LIMIT) *
                      100,
                    100
                  )}%`,
                }}
              />

            </div>

            <div className="mt-2 flex items-center justify-between">

              <span className="text-[9px] text-slate-600">
                Daily video limit
              </span>

              <span className="text-[9px] font-bold text-slate-500">
                {videosRemaining} remaining
              </span>

            </div>

          </div>

        </section>

        {/* =================================================
            CONDITIONS
        ================================================== */}

        <section className="mb-4 rounded-[20px] border border-slate-800 bg-[#11151b] p-5">

          <div className="mb-4 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <ShieldCheck
                size={20}
              />
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

            <Condition
              icon={
                <CheckCircle2
                  size={16}
                />
              }
              iconClass="text-green-400"
              text="Complete the required watch session before claiming the activity."
            />

            <Condition
              icon={
                <Clock3
                  size={16}
                />
              }
              iconClass="text-blue-400"
              text="The required watch time is verified by EarnNova's secure system."
            />

            <Condition
              icon={
                <Video
                  size={16}
                />
              }
              iconClass="text-purple-400"
              text="Each video campaign can only be completed once."
            />

            <Condition
              icon={
                <Sparkles
                  size={16}
                />
              }
              iconClass="text-amber-400"
              text="Video availability is controlled automatically by the system."
            />

          </div>

        </section>

        {/* =================================================
            SUCCESS
        ================================================== */}

        {successMessage && (
          <div className="mb-4 rounded-[20px] border border-green-500/20 bg-green-500/5 p-5">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
                <CheckCircle2
                  size={20}
                />
              </div>

              <div>

                <h3 className="text-sm font-bold text-green-400">
                  Activity Completed
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {successMessage}
                </p>

              </div>

            </div>

          </div>
        )}

        {/* =================================================
            ERROR
        ================================================== */}

        {!loading &&
          errorMessage && (
            <div className="mb-4 rounded-[20px] border border-red-500/20 bg-[#11151b] p-6 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
                <XCircle
                  size={23}
                />
              </div>

              <h3 className="mt-4 text-base font-bold">
                Activity Unavailable
              </h3>

              <p className="mt-2 break-words text-xs leading-5 text-slate-500">
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadAvailableVideo()
                }
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-500"
              >
                Try Again
              </button>

            </div>
          )}

        {/* =================================================
            LOADING
        ================================================== */}

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

        {/* =================================================
            DAILY LIMIT
        ================================================== */}

        {!loading &&
          !errorMessage &&
          completedToday >=
            DAILY_VIDEO_LIMIT &&
          !session && (
            <div className="rounded-[20px] border border-amber-500/15 bg-[#11151b] p-8 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                <Clock3
                  size={25}
                />
              </div>

              <h3 className="mt-4 text-base font-bold">
                Daily Video Limit Reached
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                You have completed your{" "}
                {DAILY_VIDEO_LIMIT} video
                activities for today.
                Please check again after
                the daily reset.
              </p>

            </div>
          )}

        {/* =================================================
            NO VIDEO
        ================================================== */}

        {!loading &&
          !errorMessage &&
          !video &&
          !session &&
          completedToday <
            DAILY_VIDEO_LIMIT && (
            <div className="rounded-[20px] border border-slate-800 bg-[#11151b] p-8 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500">
                <Video
                  size={25}
                />
              </div>

              <h3 className="mt-4 text-base font-bold">
                No Activity Available
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                There are no new video activities
                available right now. Please check
                again later.
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadAvailableVideo()
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-blue-500/40 hover:text-white"
              >
                <RefreshCw
                  size={14}
                />
                Check Again
              </button>

            </div>
          )}

        {/* =================================================
            AVAILABLE VIDEO
        ================================================== */}

        {!loading &&
          !errorMessage &&
          video &&
          !session && (
            <section className="rounded-[20px] border border-blue-500/20 bg-[#11151b] p-5 shadow-[0_0_40px_rgba(37,99,235,0.06)]">

              <div className="flex items-center gap-3">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                  <PlayCircle
                    size={25}
                  />
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

              <div className="mt-5 rounded-2xl border border-slate-800 bg-[#0c1016] p-4">

                <div className="mb-4">

                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                    Activity
                  </p>

                  <ul className="mt-3 space-y-2">

                    <li className="flex gap-2 text-[11px] leading-5 text-slate-400">
                      <span className="text-blue-400">
                        •
                      </span>

                      Watch the assigned video.
                    </li>

                    <li className="flex gap-2 text-[11px] leading-5 text-slate-400">
                      <span className="text-blue-400">
                        •
                      </span>

                      Keep the video session open until the timer completes.
                    </li>

                    <li className="flex gap-2 text-[11px] leading-5 text-slate-400">
                      <span className="text-blue-400">
                        •
                      </span>

                      Complete the activity only after the required time.
                    </li>

                  </ul>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    void startVideo()
                  }
                  disabled={starting}
                  className="
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-blue-600
                    px-5
                    py-3.5
                    text-xs
                    font-black
                    text-white
                    shadow-lg
                    shadow-blue-600/20
                    transition
                    hover:bg-blue-500
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
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
                      <PlayCircle
                        size={17}
                      />

                      Watch Now
                    </>
                  )}

                </button>

                <p className="mt-3 text-center text-[9px] leading-4 text-slate-600">
                  Activity details and reward
                  values are handled automatically
                  by EarnNova.
                </p>

              </div>

            </section>
          )}

        {/* =================================================
            ACTIVE WATCH SESSION
        ================================================== */}

        {session && (
          <section className="rounded-[20px] border border-blue-500/20 bg-[#11151b] p-5 shadow-[0_0_40px_rgba(37,99,235,0.06)]">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                <Eye
                  size={24}
                />
              </div>

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400">
                  Watching
                </p>

                <h3 className="mt-1 text-base font-black">
                  Complete Your Activity
                </h3>

              </div>

            </div>

            {/* TIMER */}

            <div className="mt-6 rounded-2xl border border-slate-800 bg-[#0c1016] p-5 text-center">

              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                Required Watch Time
              </p>

              <p className="mt-3 text-4xl font-black text-white">
                {secondsLeft}s
              </p>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">

                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-1000"
                  style={{
                    width: `${progress}%`,
                  }}
                />

              </div>

              <p className="mt-3 text-[10px] text-slate-600">
                Keep the activity open until
                the timer completes.
              </p>

            </div>

            {/* COMPLETE */}

            <button
              type="button"
              onClick={() =>
                void completeVideo()
              }
              disabled={
                completing ||
                secondsLeft > 0
              }
              className="
                mt-5
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-blue-600
                px-5
                py-3.5
                text-xs
                font-black
                text-white
                shadow-lg
                shadow-blue-600/20
                transition
                hover:bg-blue-500
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >

              {completing ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

                  Verifying...
                </>
              ) : secondsLeft > 0 ? (
                <>
                  <Clock3
                    size={16}
                  />

                  Wait {secondsLeft}s
                </>
              ) : (
                <>
                  <CheckCircle2
                    size={16}
                  />

                  Complete Activity
                </>
              )}

            </button>

            <p className="mt-3 text-center text-[9px] leading-4 text-slate-600">
              Your earning is calculated and
              credited automatically by
              EarnNova.
            </p>

          </section>
        )}

        {/* =================================================
            FOOTER
        ================================================== */}

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

/* =========================================================
   CONDITION COMPONENT
========================================================= */

function Condition({
  icon,
  iconClass,
  text,
}: {
  icon: ReactNode;
  iconClass: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-[#0c1016] p-3">

      <span
        className={`mt-0.5 shrink-0 ${iconClass}`}
      >
        {icon}
      </span>

      <p className="text-[11px] leading-5 text-slate-400">
        {text}
      </p>

    </div>
  );
}