"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ExternalLink,
  Loader2,
  Sparkles,
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

export default function TaskDetailsPage() {
  const params = useParams();

  const taskId =
    typeof params.id === "string"
      ? params.id
      : "";

  const [task, setTask] = useState<Task | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] =
    useState(false);

  const [completed, setCompleted] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId]);

  async function loadTask() {
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

      const { data, error } = await supabase
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
        .eq("id", taskId)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        console.error(
          "TASK DETAILS ERROR:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to load this task."
        );

        return;
      }

      if (!data) {
        setErrorMessage(
          "This task is no longer available."
        );

        return;
      }

      setTask({
        ...data,
        reward: Number(data.reward ?? 0),
      });

      // Check whether already completed
      const { data: completion } =
        await supabase
          .from("task_completions")
          .select("id")
          .eq("user_id", user.id)
          .eq("task_id", taskId)
          .maybeSingle();

      if (completion) {
        setCompleted(true);
      }
    } catch (error) {
      console.error(
        "TASK DETAILS PAGE ERROR:",
        error
      );

      setErrorMessage(
        "Something went wrong while loading the task."
      );
    } finally {
      setLoading(false);
    }
  }

  function openTask() {
    if (!task?.task_url) {
      return;
    }

    window.open(
      task.task_url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function completeTask() {
    if (!task || completing || completed) {
      return;
    }

    setCompleting(true);
    setMessage("");
    setErrorMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.replace("/login");
        return;
      }

      const { data, error } =
        await supabase.rpc(
          "complete_task",
          {
            p_task_id: task.id,
          }
        );

      if (error) {
        console.error(
          "COMPLETE TASK ERROR:",
          error
        );

        setErrorMessage(
          error.message ||
            "Unable to complete this task."
        );

        return;
      }

      if (!data?.success) {
        setErrorMessage(
          data?.message ||
            "Unable to complete this task."
        );

        if (
          data?.message
            ?.toLowerCase()
            .includes("already")
        ) {
          setCompleted(true);
        }

        return;
      }

      setCompleted(true);

      setMessage(
        `Task completed! You earned $${Number(
          data.reward ?? task.reward
        ).toFixed(2)}.`
      );
    } catch (error) {
      console.error(
        "COMPLETE TASK ERROR:",
        error
      );

      setErrorMessage(
        "Something went wrong while completing the task."
      );
    } finally {
      setCompleting(false);
    }
  }

  /* LOADING */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b10] px-5 text-white">
        <div className="text-center">
          <Loader2
            size={30}
            className="mx-auto animate-spin text-blue-500"
          />

          <p className="mt-3 text-sm font-semibold text-slate-400">
            Loading task...
          </p>
        </div>
      </main>
    );
  }

  /* ERROR */

  if (errorMessage && !task) {
    return (
      <main className="min-h-screen bg-[#070b10] px-3 py-4 text-white sm:px-5 sm:py-7">
        <div className="mx-auto w-full max-w-[570px]">

          <header className="mb-6">
            <a
              href="/dashboard/tasks"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/40 hover:text-white"
            >
              <ArrowLeft size={20} />
            </a>
          </header>

          <div className="rounded-[20px] border border-red-500/20 bg-[#11151b] p-7 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400">
              !
            </div>

            <h1 className="mt-4 text-lg font-black">
              Task Unavailable
            </h1>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {errorMessage}
            </p>

            <a
              href="/dashboard/tasks"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-500"
            >
              <ArrowLeft size={15} />
              Back to Tasks
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (!task) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#070b10] px-3 py-4 text-white sm:px-5 sm:py-7">
      <div className="mx-auto w-full max-w-[570px]">

        {/* HEADER */}

        <header className="mb-5 flex items-center gap-3">

          <a
            href="/dashboard/tasks"
            aria-label="Back to Tasks"
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
              Task Details
            </p>
          </div>
        </header>

        {/* TASK CARD */}

        <section className="rounded-[22px] border border-slate-800 bg-[#11151b] p-5 shadow-2xl sm:p-6">

          {/* ICON + STATUS */}

          <div className="flex items-start justify-between gap-4">

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Sparkles size={27} />
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-green-400" />

              <span className="text-[9px] font-bold uppercase text-green-400">
                Active
              </span>
            </div>
          </div>

          {/* TITLE */}

          <h2 className="mt-5 text-2xl font-black leading-tight">
            {task.title}
          </h2>

          {/* REWARD */}

          <div className="mt-5 rounded-2xl border border-green-500/10 bg-green-500/[0.04] p-4">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  Task Reward
                </p>

                <p className="mt-1 text-2xl font-black text-green-400">
                  +${task.reward.toFixed(2)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
                <CircleDollarSign size={22} />
              </div>
            </div>
          </div>

          {/* DESCRIPTION */}

          <div className="mt-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Task Instructions
            </p>

            <div className="mt-3 rounded-2xl border border-slate-800 bg-[#0b1015] p-4">
              <p className="text-sm leading-6 text-slate-400">
                {task.description ||
                  "Complete this task according to the instructions provided."}
              </p>
            </div>
          </div>

          {/* ERROR */}

          {errorMessage && (
            <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3">
              <p className="text-xs leading-5 text-red-400">
                {errorMessage}
              </p>
            </div>
          )}

          {/* SUCCESS */}

          {message && (
            <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/[0.04] p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2
                  size={21}
                  className="shrink-0 text-green-400"
                />

                <p className="text-xs font-semibold text-green-400">
                  {message}
                </p>
              </div>
            </div>
          )}

          {/* ACTIONS */}

          <div className="mt-6 space-y-3">

            {/* OPEN TASK */}

            {!completed && (
              <button
                onClick={openTask}
                disabled={!task.task_url}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition ${
                  task.task_url
                    ? "bg-blue-600 text-white hover:bg-blue-500"
                    : "cursor-not-allowed bg-slate-800 text-slate-600"
                }`}
              >
                <ExternalLink size={17} />

                {task.task_url
                  ? "Open Task"
                  : "Task Link Unavailable"}
              </button>
            )}

            {/* COMPLETE */}

            <button
              onClick={completeTask}
              disabled={
                completing || completed
              }
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold transition ${
                completed
                  ? "cursor-default border border-green-500/20 bg-green-500/10 text-green-400"
                  : "bg-slate-800 text-white hover:bg-slate-700"
              }`}
            >
              {completing ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Verifying...
                </>
              ) : completed ? (
                <>
                  <CheckCircle2 size={17} />
                  Task Completed
                </>
              ) : (
                <>
                  Complete Task
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>
        </section>

        {/* SECURITY INFO */}

        <section className="mt-5 rounded-2xl border border-amber-500/10 bg-amber-500/[0.04] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400">
            Important
          </p>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            Complete the task before claiming your
            reward. Each task can only be completed
            once.
          </p>
        </section>

        {/* BACK */}

        <a
          href="/dashboard/tasks"
          className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#11151b] px-4 py-3 text-xs font-bold text-slate-400 transition hover:border-blue-500/30 hover:text-white"
        >
          <ArrowLeft size={15} />
          Back to Tasks
        </a>

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