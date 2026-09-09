"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  XCircle,
} from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Task = {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  task_url: string | null;
  status: string;
  created_at: string;
};

type Profile = {
  plan_name: string | null;
  daily_task_limit: number | null;
};

const PLAN_LIMITS: Record<string, number> = {
  Starter: 10,
  Basic: 20,
  Pro: 30,
  Premium: 40,
  VIP: 50,
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

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
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.replace("/login");
        return;
      }

      // Load profile / active plan
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("plan_name, daily_task_limit")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);
      }

      if (profileData) {
        setProfile({
          plan_name: profileData.plan_name,
          daily_task_limit:
            profileData.daily_task_limit ??
            PLAN_LIMITS[profileData.plan_name || "Starter"] ??
            10,
        });
      }

      // Load active tasks
      const { data: taskData, error: taskError } = await supabase
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
        setErrorMessage(taskError.message || "Unable to load tasks.");
        return;
      }

      setTasks(
        (taskData || []).map((task) => ({
          ...task,
          reward: Number(task.reward ?? 0),
        }))
      );

      // Load today's completed tasks.
      // These records are only used for UI filtering.
      // Actual duplicate protection MUST also exist server-side.
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const { data: completionData, error: completionError } =
        await supabase
          .from("task_completions")
          .select("task_id")
          .eq("user_id", user.id)
          .gte("completed_at", startOfDay.toISOString());

      if (completionError) {
        console.error("COMPLETION ERROR:", completionError);
      }

      setCompletedTaskIds(
        (completionData || []).map((item) => String(item.task_id))
      );
    } catch (error) {
      console.error("TASK PAGE ERROR:", error);
      setErrorMessage("Something went wrong while loading tasks.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function openTask(task: Task) {
    if (!task.task_url) return;

    window.open(
      task.task_url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  const planName = profile?.plan_name || "Starter";

  const dailyLimit =
    profile?.daily_task_limit ??
    PLAN_LIMITS[planName] ??
    PLAN_LIMITS.Starter;

  const availableTasks = useMemo(() => {
    return tasks.filter(
      (task) => !completedTaskIds.includes(String(task.id))
    );
  }, [tasks, completedTaskIds]);

  const completedToday = completedTaskIds.length;

  const remainingToday = Math.max(
    dailyLimit - completedToday,
    0
  );

  const visibleTasks = availableTasks.slice(
    0,
    remainingToday
  );

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

          <div className="min-w-0">
            <h1 className="text-lg font-extrabold">
              Earn<span className="text-blue-500">Nova</span>
            </h1>

            <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600">
              Tasks
            </p>
          </div>

          <button
            onClick={() => loadTasks(true)}
            disabled={refreshing}
            aria-label="Refresh tasks"
            className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/40 hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>
        </header>

        {/* PAGE TITLE */}
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
            Complete available tasks and earn rewards after
            successful verification.
          </p>
        </section>

        {/* PLAN / DAILY LIMIT */}
        {!loading && !errorMessage && (
          <section className="mb-4 rounded-2xl border border-blue-500/15 bg-blue-500/[0.04] p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <ShieldCheck size={19} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  Current Plan
                </p>

                <p className="mt-0.5 text-sm font-black text-white">
                  {planName}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  Today
                </p>

                <p className="mt-0.5 text-sm font-black text-blue-400">
                  {completedToday}/{dailyLimit}
                </p>
              </div>

            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{
                  width: `${Math.min(
                    (completedToday / Math.max(dailyLimit, 1)) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between">
              <span className="text-[9px] text-slate-600">
                Daily task limit
              </span>

              <span className="text-[9px] font-bold text-slate-500">
                {remainingToday} remaining
              </span>
            </div>

          </section>
        )}

        {/* LOADING */}
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

        {/* ERROR */}
        {!loading && errorMessage && (
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
              onClick={() => loadTasks()}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-500"
            >
              Try Again
            </button>

          </div>
        )}

        {/* DAILY LIMIT REACHED */}
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
                You have completed your {dailyLimit} task
                limit for today. More tasks will be available
                after the daily reset.
              </p>

            </div>
          )}

        {/* NO TASKS */}
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
                There are no new eligible tasks right now.
                Please check again later.
              </p>

            </div>
          )}

        {/* TASK ROWS */}
        {!loading &&
          !errorMessage &&
          remainingToday > 0 &&
          visibleTasks.length > 0 && (
            <section className="space-y-2">

              {visibleTasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#11151b] p-3.5 transition hover:border-blue-500/30 hover:bg-blue-500/[0.03]"
                >

                  {/* ICON */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Sparkles size={20} />
                  </div>

                  {/* INFO */}
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

                  {/* REWARD */}
                  <div className="shrink-0 text-right">

                    <p className="text-[8px] font-bold uppercase tracking-wider text-slate-600">
                      Reward
                    </p>

                    <p className="mt-0.5 text-sm font-black text-green-400">
                      +${task.reward.toFixed(2)}
                    </p>

                  </div>

                  {/* START */}
                  <button
                    onClick={() => openTask(task)}
                    disabled={!task.task_url}
                    aria-label={`Start ${task.title}`}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                      task.task_url
                        ? "bg-blue-600 text-white hover:bg-blue-500"
                        : "cursor-not-allowed bg-slate-800 text-slate-600"
                    }`}
                  >
                    <ArrowRight size={16} />
                  </button>

                </div>
              ))}

            </section>
          )}

        {/* SECURITY INFO */}
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
                    Complete tasks honestly. Opening a task does
                    not automatically credit the reward. Completion
                    is verified before the reward is added to your
                    wallet.
                  </p>
                </div>

              </div>

            </div>
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