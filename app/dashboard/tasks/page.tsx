"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
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
        .eq("status", "active")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error("TASK ERROR:", error);

        setErrorMessage(
          error.message || "Unable to load tasks."
        );

        return;
      }

      setTasks(
        (data || []).map((task) => ({
          ...task,
          reward: Number(task.reward ?? 0),
        }))
      );
    } catch (error) {
      console.error("TASK PAGE ERROR:", error);

      setErrorMessage(
        "Something went wrong while loading tasks."
      );
    } finally {
      setLoading(false);
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

  return (
    <main className="min-h-screen bg-[#070b10] px-3 py-4 text-white sm:px-5 sm:py-7">
      <div className="mx-auto w-full max-w-[570px]">

        {/* HEADER */}
        <header className="mb-5 flex items-center gap-3">

          {/* BACK ARROW */}
          <a
            href="/dashboard"
            aria-label="Back to Dashboard"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/40 hover:bg-blue-500/5 hover:text-white"
          >
            <ArrowLeft size={20} />
          </a>

          {/* LOGO */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-lg">
            <span className="text-lg font-black italic text-slate-950">
              E<span className="text-blue-600">N</span>
            </span>
          </div>

          {/* TITLE */}
          <div>
            <h1 className="text-lg font-extrabold">
              Earn<span className="text-blue-500">Nova</span>
            </h1>

            <p className="text-[9px] uppercase tracking-[0.18em] text-slate-600">
              Tasks
            </p>
          </div>
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
            Complete available tasks and earn rewards.
          </p>
        </section>

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
              !
            </div>

            <h3 className="mt-4 text-base font-bold">
              Unable to Load Tasks
            </h3>

            <p className="mt-2 text-xs leading-5 text-slate-500">
              {errorMessage}
            </p>

            <button
              onClick={loadTasks}
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white transition hover:bg-blue-500"
            >
              Try Again
            </button>
          </div>
        )}

        {/* NO TASKS */}
        {!loading &&
          !errorMessage &&
          tasks.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/60 text-slate-500">
                <BriefcaseBusiness size={25} />
              </div>

              <h3 className="mt-4 text-base font-bold">
                No Tasks Available
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                There are no active tasks right now.
              </p>
            </div>
          )}

        {/* ================================================= */}
        {/* TASK ROWS */}
        {/* ================================================= */}

        {!loading &&
          !errorMessage &&
          tasks.length > 0 && (
            <section className="space-y-2">

              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="group flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#11151b] p-3.5 transition hover:border-blue-500/30 hover:bg-blue-500/[0.03]"
                >

                  {/* TASK ICON */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Sparkles size={20} />
                  </div>

                  {/* TASK INFORMATION */}
                  <div className="min-w-0 flex-1">

                    <h3 className="truncate text-sm font-bold text-white">
                      {task.title}
                    </h3>

                    <div className="mt-1 flex items-center gap-2">

                      <span className="flex items-center gap-1 text-[9px] font-semibold text-green-400">
                        <CheckCircle2 size={10} />
                        Active
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

        {/* INFO */}
        {!loading &&
          !errorMessage &&
          tasks.length > 0 && (
            <div className="mt-5 rounded-2xl border border-amber-500/10 bg-amber-500/[0.04] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400">
                Important
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Complete tasks honestly. Rewards are
                credited after completion is verified.
              </p>
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