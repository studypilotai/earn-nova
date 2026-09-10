"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

type Task = {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  task_url: string | null;
  status: string;
  created_at: string;
};

/*
 * EarnNova current rule:
 * Maximum 10 tasks per day.
 *
 * Task reward is intentionally NOT shown to customers.
 * The actual reward remains server-side.
 */
const DAILY_TASK_LIMIT = 10;

export default function TasksPage() {
  const router = useRouter();
  const supabase = createClient();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks(showRefresh = false) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setErrorMessage("");

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
       * LOAD ACTIVE TASKS
       *
       * Reward is loaded because it belongs to the task record,
       * but it is NEVER rendered to the customer.
       */
      const { data: taskData, error: taskError } =
        await supabase
          .from("tasks")
          .select(
            `
              id,
              title,
              description,
              reward,
              task_url,
              status,
              created_at
            `
          )
          .eq("status", "active")
          .order("created_at", {
            ascending: false,
          });

      if (taskError) {
        console.error("TASK ERROR:", taskError);

        setErrorMessage(
          taskError.message ||
            "Unable to load tasks."
        );

        return;
      }

      setTasks(
        (taskData || []).map((task) => ({
          ...task,
          reward: Number(task.reward ?? 0),
        }))
      );

      /*
       * TODAY START
       */

      const startOfDay = new Date();

      startOfDay.setHours(
        0,
        0,
        0,
        0
      );

      /*
       * LOAD TODAY'S COMPLETED TASKS
       *
       * This is only for UI filtering.
       * Server-side duplicate protection should also exist.
       */
      const {
        data: completionData,
        error: completionError,
      } = await supabase
        .from("task_completions")
        .select("task_id")
        .eq("user_id", user.id)
        .gte(
          "completed_at",
          startOfDay.toISOString()
        );

      if (completionError) {
        console.error(
          "COMPLETION ERROR:",
          completionError
        );
      }

      setCompletedTaskIds(
        (completionData || []).map((item) =>
          String(item.task_id)
        )
      );
    } catch (error) {
      console.error(
        "TASK PAGE ERROR:",
        error
      );

      setErrorMessage(
        "Something went wrong while loading tasks."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /*
   * OPEN TASK
   *
   * Opening a task does NOT complete it.
   */
  function openTask(task: Task) {
    if (!task.task_url) {
      return;
    }

    window.open(
      task.task_url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /*
   * AVAILABLE TASKS
   */

  const availableTasks = tasks.filter(
    (task) =>
      !completedTaskIds.includes(
        String(task.id)
      )
  );

  const completedToday =
    completedTaskIds.length;

  const remainingToday = Math.max(
    DAILY_TASK_LIMIT - completedToday,
    0
  );

  /*
   * Only show enough tasks to respect
   * today's 10-task limit.
   */
  const visibleTasks =
    availableTasks.slice(
      0,
      remainingToday
    );

  return (
    <main className="min-h-screen bg-[#070b10] px-3 py-4 text-white sm:px-5 sm:py-7">
      <div className="mx-auto w-full max-w-[620px]">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <header className="mb-6 flex items-center gap-3">

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
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
            <ArrowLeft size={20} />
          </button>

          {/* MASTER EARNNOVA LOGO */}

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
              Earn<span className="text-blue-500">Nova</span>
            </h1>

            <p className="text-[9px] font-medium uppercase tracking-[0.24em] text-slate-600">
              Earn • Grow • Repeat
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadTasks(true)
            }
            disabled={refreshing}
            aria-label="Refresh tasks"
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
              disabled:opacity-50
            "
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
          </button>
        </header>

        {/* =====================================================
            PAGE TITLE
        ====================================================== */}

        <section className="mb-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <BriefcaseBusiness size={21} />
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400">
                Earn More
              </p>

              <h2 className="mt-1 text-xl font-black">
                Available Tasks
              </h2>
            </div>

          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Complete available tasks and earn rewards
            after successful verification.
          </p>
        </section>

        {/* =====================================================
            DAILY LIMIT
        ====================================================== */}

        {!loading &&
          !errorMessage && (
            <section className="mb-4 rounded-2xl border border-blue-500/15 bg-blue-500/[0.04] p-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <ShieldCheck size={19} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">
                    Daily Task Limit
                  </p>

                  <p className="mt-0.5 text-sm font-black text-white">
                    {DAILY_TASK_LIMIT} Tasks
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                    Today
                  </p>

                  <p className="mt-0.5 text-sm font-black text-blue-400">
                    {completedToday}/
                    {DAILY_TASK_LIMIT}
                  </p>
                </div>

              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{
                    width: `${Math.min(
                      (completedToday /
                        Math.max(
                          DAILY_TASK_LIMIT,
                          1
                        )) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-[9px] text-slate-600">
                  Tasks completed today
                </span>

                <span className="text-[9px] font-bold text-slate-500">
                  {remainingToday} remaining
                </span>
              </div>

            </section>
          )}

        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-8 text-center">

            <Loader2
              size={27}
              className="mx-auto animate-spin text-blue-500"
            />

            <p className="mt-3 text-sm font-semibold text-slate-400">
              Loading tasks...
            </p>

          </div>
        )}

        {/* =====================================================
            ERROR
        ====================================================== */}

        {!loading &&
          errorMessage && (
            <div className="rounded-2xl border border-red-500/20 bg-[#11151b] p-6 text-center">

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
                <XCircle size={23} />
              </div>

              <h3 className="mt-4 text-base font-bold">
                Unable to Load Tasks
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {errorMessage}
              </p>

              <button
                type="button"
                onClick={() =>
                  loadTasks()
                }
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-500"
              >
                Try Again
              </button>

            </div>
          )}

        {/* =====================================================
            DAILY LIMIT REACHED
        ====================================================== */}

        {!loading &&
          !errorMessage &&
          remainingToday <= 0 && (
            <div className="rounded-2xl border border-amber-500/15 bg-[#11151b] p-7 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
                <Clock3 size={25} />
              </div>

              <h3 className="mt-4 text-base font-bold">
                Daily Limit Reached
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                You have completed your{" "}
                {DAILY_TASK_LIMIT} tasks for today.
                More tasks will be available after
                the daily reset.
              </p>

            </div>
          )}

        {/* =====================================================
            NO TASKS
        ====================================================== */}

        {!loading &&
          !errorMessage &&
          remainingToday > 0 &&
          visibleTasks.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-8 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500">
                <BriefcaseBusiness size={25} />
              </div>

              <h3 className="mt-4 text-base font-bold">
                No Tasks Available
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                There are no new eligible tasks right
                now. Please check again later.
              </p>

            </div>
          )}

        {/* =====================================================
            TASK LIST
        ====================================================== */}

        {!loading &&
          !errorMessage &&
          remainingToday > 0 &&
          visibleTasks.length > 0 && (
            <section className="space-y-2">

              {visibleTasks.map((task) => (
                <div
                  key={task.id}
                  className="
                    group
                    flex
                    items-center
                    gap-3
                    rounded-2xl
                    border
                    border-slate-800
                    bg-[#11151b]
                    p-3.5
                    transition
                    hover:border-blue-500/30
                    hover:bg-blue-500/[0.03]
                  "
                >

                  {/* TASK ICON */}

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Sparkles size={20} />
                  </div>

                  {/* TASK INFO */}

                  <div className="min-w-0 flex-1">

                    <h3 className="truncate text-sm font-bold text-white">
                      {task.title}
                    </h3>

                    <div className="mt-1 flex items-center gap-2">

                      <span className="flex shrink-0 items-center gap-1 text-[9px] font-semibold text-green-400">
                        <CheckCircle2 size={10} />
                        Available
                      </span>

                      {task.description && (
                        <>
                          <span className="text-slate-700">
                            •
                          </span>

                          <p className="truncate text-[9px] text-slate-600">
                            {task.description}
                          </p>
                        </>
                      )}

                    </div>

                  </div>

                  {/* START BUTTON */}

                  <button
                    type="button"
                    onClick={() =>
                      openTask(task)
                    }
                    disabled={!task.task_url}
                    aria-label={`Start ${task.title}`}
                    className={`
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      transition
                      ${
                        task.task_url
                          ? "bg-blue-600 text-white hover:bg-blue-500"
                          : "cursor-not-allowed bg-slate-800 text-slate-600"
                      }
                    `}
                  >
                    <ArrowRight size={16} />
                  </button>

                </div>
              ))}

            </section>
          )}

        {/* =====================================================
            SECURITY INFO
        ====================================================== */}

        {!loading &&
          !errorMessage &&
          visibleTasks.length > 0 && (
            <div className="mt-5 rounded-2xl border border-amber-500/10 bg-amber-500/[0.04] p-4">

              <div className="flex items-start gap-3">

                <ShieldCheck
                  size={17}
                  className="mt-0.5 shrink-0 text-amber-400"
                />

                <div>

                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400">
                    Important
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Opening a task does not automatically
                    complete it. Task completion is verified
                    before any reward is credited to your
                    wallet.
                  </p>

                </div>

              </div>

            </div>
          )}

        {/* =====================================================
            FOOTER
        ====================================================== */}

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