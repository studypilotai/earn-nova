"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import {
  ArrowLeft,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  ClipboardList,
  X,
  ExternalLink,
  Info,
} from "lucide-react";

/* =========================================================
   SUPABASE
========================================================= */

const supabase = createClient();

/* =========================================================
   TYPES
========================================================= */

type Task = {
  id: string;
  title: string;
  description: string | null;
  reward: number;
  task_url: string | null;
  status: string | null;
  created_at: string;
};

type RpcLikeResult = {
  success?: boolean;
  message?: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

/*
 * EarnNova current rule:
 *
 * Tasks = 10/day
 * Videos = 50/day
 *
 * These are separate systems.
 */

const DAILY_TASK_LIMIT = 10;
const DAILY_VIDEO_LIMIT = 50;

const TASK_TYPES = [
  "Visit Website",
  "Social Media",
  "Survey",
  "App Install",
  "Other",
];

/* =========================================================
   HELPERS
========================================================= */

function getRpcResult(
  data: unknown
): RpcLikeResult {
  if (Array.isArray(data)) {
    return (
      (data[0] as
        | RpcLikeResult
        | undefined) ?? {}
    );
  }

  if (
    data &&
    typeof data === "object"
  ) {
    return data as RpcLikeResult;
  }

  return {};
}

/* =========================================================
   PAGE
========================================================= */

export default function AdminTasksPage() {
  const router = useRouter();

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [reward, setReward] =
    useState("");

  const [taskType, setTaskType] =
    useState("Visit Website");

  const [taskUrl, setTaskUrl] =
    useState("");

  const [isActive, setIsActive] =
    useState(true);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  /* =======================================================
     ADMIN CHECK
  ======================================================= */

  const checkAdmin =
    useCallback(async () => {
      const {
        data: {
          user,
        },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        router.replace(
          "/admin/login"
        );

        return false;
      }

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select(
            "id, role"
          )
          .eq(
            "id",
            user.id
          )
          .maybeSingle();

      if (
        profileError ||
        profile?.role !==
          "admin"
      ) {
        router.replace(
          "/dashboard"
        );

        return false;
      }

      return true;
    }, [router]);

  /* =======================================================
     LOAD TASKS
  ======================================================= */

  const loadTasks =
    useCallback(async () => {
      setLoading(true);
      setErrorMessage("");

      try {
        const allowed =
          await checkAdmin();

        if (!allowed) {
          return;
        }

        const {
          data,
          error,
        } = await supabase
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
          .order(
            "created_at",
            {
              ascending: false,
            }
          );

        if (error) {
          console.error(
            "TASK LOAD ERROR:",
            error
          );

          throw new Error(
            error.message
          );
        }

        const formatted: Task[] =
          (data ?? []).map(
            (item) => ({
              id: item.id,
              title:
                item.title,
              description:
                item.description,
              reward: Number(
                item.reward ?? 0
              ),
              task_url:
                item.task_url,
              status:
                item.status,
              created_at:
                item.created_at,
            })
          );

        setTasks(
          formatted
        );
      } catch (error) {
        console.error(
          "LOAD TASKS ERROR:",
          error
        );

        setTasks([]);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load tasks."
        );
      } finally {
        setLoading(false);
      }
    }, [checkAdmin]);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  /* =======================================================
     FORM RESET
  ======================================================= */

  function resetForm() {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setReward("");
    setTaskType(
      "Visit Website"
    );
    setTaskUrl("");
    setIsActive(true);
  }

  /* =======================================================
     CREATE MODAL
  ======================================================= */

  function openCreateModal() {
    resetForm();

    setMessage("");
    setErrorMessage("");

    setShowModal(true);
  }

  /* =======================================================
     EDIT MODAL
  ======================================================= */

  function openEditModal(
    task: Task
  ) {
    setEditingTask(
      task
    );

    setTitle(
      task.title
    );

    setDescription(
      task.description ??
        ""
    );

    setReward(
      String(task.reward)
    );

    setTaskUrl(
      task.task_url ??
        ""
    );

    setIsActive(
      task.status ===
        "active"
    );

    setTaskType(
      "Visit Website"
    );

    setMessage("");
    setErrorMessage("");

    setShowModal(true);
  }

  /* =======================================================
     CLOSE MODAL
  ======================================================= */

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingTask(null);

    setMessage("");
    setErrorMessage("");
  }

  /* =======================================================
     SAVE TASK
  ======================================================= */

  async function saveTask() {
    if (saving) return;

    setMessage("");
    setErrorMessage("");

    /* -----------------------------------------------------
       TITLE
    ----------------------------------------------------- */

    const cleanTitle =
      title.trim();

    if (!cleanTitle) {
      setErrorMessage(
        "Task title is required."
      );

      return;
    }

    /* -----------------------------------------------------
       REWARD
    ----------------------------------------------------- */

    const numericReward =
      Number(reward);

    if (
      !reward.trim() ||
      !Number.isFinite(
        numericReward
      ) ||
      numericReward <= 0
    ) {
      setErrorMessage(
        "Enter a valid reward amount."
      );

      return;
    }

    /* -----------------------------------------------------
       URL
    ----------------------------------------------------- */

    const cleanUrl =
      taskUrl.trim();

    if (cleanUrl) {
      try {
        const parsed =
          new URL(
            cleanUrl
          );

        if (
          parsed.protocol !==
            "http:" &&
          parsed.protocol !==
            "https:"
        ) {
          throw new Error(
            "Invalid protocol"
          );
        }
      } catch {
        setErrorMessage(
          "Please enter a valid HTTP or HTTPS task link."
        );

        return;
      }
    }

    /* -----------------------------------------------------
       ADMIN CHECK
    ----------------------------------------------------- */

    const allowed =
      await checkAdmin();

    if (!allowed) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title:
          cleanTitle,
        description:
          description.trim() ||
          null,
        reward:
          numericReward,
        task_url:
          cleanUrl ||
          null,
        status:
          isActive
            ? "active"
            : "inactive",
      };

      /* --------------------------------------------------
         UPDATE
      -------------------------------------------------- */

      if (editingTask) {
        const {
          error,
        } =
          await supabase
            .from("tasks")
            .update(
              payload
            )
            .eq(
              "id",
              editingTask.id
            );

        if (error) {
          throw new Error(
            error.message
          );
        }

        setMessage(
          "Task updated successfully."
        );
      } else {
        /* ------------------------------------------------
           CREATE
        ------------------------------------------------ */

        const {
          error,
        } =
          await supabase
            .from("tasks")
            .insert(
              payload
            );

        if (error) {
          throw new Error(
            error.message
          );
        }

        setMessage(
          "Task created successfully."
        );
      }

      await loadTasks();

      window.setTimeout(
        () => {
          setShowModal(
            false
          );

          setEditingTask(
            null
          );

          setMessage("");
        },
        700
      );
    } catch (error) {
      console.error(
        "SAVE TASK ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     TOGGLE TASK
  ======================================================= */

  async function toggleTask(
    task: Task
  ) {
    if (processingId) {
      return;
    }

    setErrorMessage("");
    setMessage("");

    const allowed =
      await checkAdmin();

    if (!allowed) {
      return;
    }

    setProcessingId(
      task.id
    );

    try {
      const nextStatus =
        task.status ===
        "active"
          ? "inactive"
          : "active";

      const {
        error,
      } =
        await supabase
          .from("tasks")
          .update({
            status:
              nextStatus,
          })
          .eq(
            "id",
            task.id
          );

      if (error) {
        throw new Error(
          error.message
        );
      }

      setMessage(
        nextStatus ===
          "active"
          ? "Task activated."
          : "Task deactivated."
      );

      await loadTasks();
    } catch (error) {
      console.error(
        "TOGGLE TASK ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update task."
      );
    } finally {
      setProcessingId(
        null
      );
    }
  }

  /* =======================================================
     DELETE TASK
  ======================================================= */

  async function deleteTask(
    task: Task
  ) {
    if (processingId) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${task.title}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");
    setMessage("");

    const allowed =
      await checkAdmin();

    if (!allowed) {
      return;
    }

    setProcessingId(
      task.id
    );

    try {
      const {
        error,
      } =
        await supabase
          .from("tasks")
          .delete()
          .eq(
            "id",
            task.id
          );

      if (error) {
        throw new Error(
          error.message
        );
      }

      setMessage(
        "Task deleted successfully."
      );

      await loadTasks();
    } catch (error) {
      console.error(
        "DELETE TASK ERROR:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete task."
      );
    } finally {
      setProcessingId(
        null
      );
    }
  }

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredTasks =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return tasks;
      }

      return tasks.filter(
        (task) =>
          task.title
            .toLowerCase()
            .includes(
              keyword
            ) ||
          task.description
            ?.toLowerCase()
            .includes(
              keyword
            ) ||
          task.task_url
            ?.toLowerCase()
            .includes(
              keyword
            )
      );
    }, [
      tasks,
      search,
    ]);

  /* =======================================================
     STATS
  ======================================================= */

  const activeTasks =
    tasks.filter(
      (task) =>
        task.status ===
        "active"
    ).length;

  const inactiveTasks =
    tasks.length -
    activeTasks;

  /* =======================================================
     DATE
  ======================================================= */

  function formatDate(
    date: string
  ) {
    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "Unknown";
    }

    return parsed.toLocaleString();
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#070b10] text-slate-100">

      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                router.push(
                  "/admin"
                )
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-800 bg-[#11151b] text-slate-400 transition hover:border-blue-500/30 hover:bg-[#151b23] hover:text-white"
              aria-label="Back to admin"
            >
              <ArrowLeft
                size={20}
              />
            </button>

            <div>

              <div className="flex items-center gap-2">

                <h1 className="text-2xl font-black tracking-tight text-white">
                  Task Management
                </h1>

                <span className="hidden rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-400 sm:inline-flex">
                  EarnNova Team
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Create and manage customer earning tasks.
              </p>

            </div>

          </div>

          <div className="flex gap-2">

            <button
              onClick={() => {
                setMessage("");
                setErrorMessage("");
                void loadTasks();
              }}
              disabled={
                loading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-[#11151b] px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-[#151b23] disabled:cursor-not-allowed disabled:opacity-50"
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

            <button
              onClick={
                openCreateModal
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/10 transition hover:bg-blue-500"
            >
              <Plus size={18} />

              New Task
            </button>

          </div>

        </div>

        {/* =================================================
            DAILY LIMIT INFO
        ================================================= */}

        <section className="mb-6 rounded-2xl border border-blue-500/20 bg-[#11151b]">

          <div className="flex flex-col gap-4 border-b border-slate-800 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
                <Info
                  size={20}
                />
              </div>

              <div>

                <h2 className="font-black text-white">
                  Daily Earning Limits
                </h2>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Tasks and videos are separate earning systems.
                </p>

              </div>

            </div>

            <div className="flex flex-wrap gap-2">

              <span className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-400">
                {DAILY_TASK_LIMIT} Tasks / Day
              </span>

              <span className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-400">
                {DAILY_VIDEO_LIMIT} Videos / Day
              </span>

            </div>

          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2">

            <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Tasks
              </p>

              <p className="mt-2 text-2xl font-black text-white">
                {DAILY_TASK_LIMIT}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Maximum customer task completions per day
              </p>

            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-4">

              <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                Videos
              </p>

              <p className="mt-2 text-2xl font-black text-white">
                {DAILY_VIDEO_LIMIT}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Maximum customer video completions per day
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <StatCard
            title="Total Tasks"
            value={String(
              tasks.length
            )}
            icon={
              <ClipboardList
                size={21}
              />
            }
            type="blue"
          />

          <StatCard
            title="Active Tasks"
            value={String(
              activeTasks
            )}
            icon={
              <CheckCircle
                size={21}
              />
            }
            type="success"
          />

          <StatCard
            title="Inactive Tasks"
            value={String(
              inactiveTasks
            )}
            icon={
              <XCircle
                size={21}
              />
            }
            type="muted"
          />

        </div>

        {/* =================================================
            MESSAGES
        ================================================= */}

        {message && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
            <CheckCircle
              size={17}
            />
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold leading-6 text-red-300">
            <XCircle
              size={17}
              className="mt-0.5 shrink-0"
            />
            {errorMessage}
          </div>
        )}

        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="mb-5 rounded-2xl border border-slate-800 bg-[#11151b] p-4">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
            />

            <input
              type="text"
              placeholder="Search task, description or URL..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500"
            />

          </div>

        </div>

        {/* =================================================
            TASK LIST
        ================================================= */}

        {loading ? (

          <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-12 text-center">

            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-blue-500"
            />

            <p className="mt-3 text-sm font-semibold text-slate-500">
              Loading tasks...
            </p>

          </div>

        ) : filteredTasks.length ===
          0 ? (

          <div className="rounded-2xl border border-slate-800 bg-[#11151b] p-12 text-center">

            <ClipboardList
              size={42}
              className="mx-auto text-slate-700"
            />

            <h2 className="mt-4 text-lg font-black text-white">
              No tasks found
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {search
                ? "Try a different search."
                : "Create your first earning task."}
            </p>

            {!search && (
              <button
                onClick={
                  openCreateModal
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500"
              >
                <Plus size={17} />
                Create Task
              </button>
            )}

          </div>

        ) : (

          <div className="space-y-4">

            {filteredTasks.map(
              (task) => {

                const active =
                  task.status ===
                  "active";

                const processing =
                  processingId ===
                  task.id;

                return (
                  <div
                    key={
                      task.id
                    }
                    className="rounded-2xl border border-slate-800 bg-[#11151b] p-5 transition hover:border-slate-700"
                  >

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                      {/* INFO */}

                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-black text-white">
                            {
                              task.title
                            }
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                              active
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : "border-slate-700 bg-slate-800/50 text-slate-500"
                            }`}
                          >
                            {active
                              ? "Active"
                              : "Inactive"}
                          </span>

                        </div>

                        {task.description && (
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                            {
                              task.description
                            }
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-2">

                          <span className="rounded-lg border border-slate-800 bg-[#0b0f14] px-3 py-1.5 text-xs font-semibold text-slate-400">
                            General Task
                          </span>

                          {/* ADMIN CAN SEE REWARD */}

                          <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
                            +$
                            {Number(
                              task.reward
                            ).toFixed(
                              2
                            )}
                          </span>

                          {task.task_url && (
                            <a
                              href={
                                task.task_url
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20"
                            >
                              Open Link

                              <ExternalLink
                                size={
                                  12
                                }
                              />
                            </a>
                          )}

                          <span className="text-[10px] text-slate-700">
                            {formatDate(
                              task.created_at
                            )}
                          </span>

                        </div>

                      </div>

                      {/* ACTIONS */}

                      <div className="flex shrink-0 flex-wrap items-center gap-2">

                        <button
                          onClick={() =>
                            void toggleTask(
                              task
                            )
                          }
                          disabled={
                            processing
                          }
                          className={`rounded-xl px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                            active
                              ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          }`}
                        >
                          {processing
                            ? "..."
                            : active
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          onClick={() =>
                            openEditModal(
                              task
                            )
                          }
                          disabled={
                            processing
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm font-bold text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-40"
                        >
                          <Pencil
                            size={
                              15
                            }
                          />
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            void deleteTask(
                              task
                            )
                          }
                          disabled={
                            processing
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-400 transition hover:bg-red-500/20 disabled:opacity-40"
                        >
                          <Trash2
                            size={
                              15
                            }
                          />
                          Delete
                        </button>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

        )}

      </div>

      {/* ===================================================
          CREATE / EDIT MODAL
      =================================================== */}

      {showModal && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >

          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-800 bg-[#11151b] shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-800 p-5">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-500">
                  EarnNova Team
                </p>

                <h2 className="mt-1 text-lg font-black text-white">
                  {editingTask
                    ? "Edit Task"
                    : "Create New Task"}
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Configure the customer earning task.
                </p>

              </div>

              <button
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-[#0b0f14] text-slate-500 transition hover:text-white disabled:opacity-50"
                aria-label="Close"
              >
                <X size={18} />
              </button>

            </div>

            {/* BODY */}

            <div className="space-y-5 p-5">

              {/* TITLE */}

              <div>

                <label className="mb-1.5 block text-sm font-bold text-slate-300">
                  Task Title
                </label>

                <input
                  value={
                    title
                  }
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Visit website"
                  disabled={
                    saving
                  }
                  className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:opacity-50"
                />

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="mb-1.5 block text-sm font-bold text-slate-300">
                  Description
                </label>

                <textarea
                  value={
                    description
                  }
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows={3}
                  disabled={
                    saving
                  }
                  placeholder="Explain what the user needs to do..."
                  className="w-full resize-none rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 disabled:opacity-50"
                />

              </div>

              {/* REWARD + TYPE */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-bold text-slate-300">
                    Reward ($)
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      reward
                    }
                    onChange={(e) =>
                      setReward(
                        e.target.value
                      )
                    }
                    placeholder="0.10"
                    disabled={
                      saving
                    }
                    className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 disabled:opacity-50"
                  />

                  <p className="mt-1.5 text-[10px] leading-4 text-slate-600">
                    Reward is controlled by EarnNova Team and should be credited only through secure server-side completion logic.
                  </p>

                </div>

                <div>

                  <label className="mb-1.5 block text-sm font-bold text-slate-300">
                    Task Type
                  </label>

                  <select
                    value={
                      taskType
                    }
                    onChange={(e) =>
                      setTaskType(
                        e.target.value
                      )
                    }
                    disabled={
                      saving
                    }
                    className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    {TASK_TYPES.map(
                      (
                        type
                      ) => (
                        <option
                          key={
                            type
                          }
                          value={
                            type
                          }
                          className="bg-[#11151b]"
                        >
                          {
                            type
                          }
                        </option>
                      )
                    )}
                  </select>

                  <p className="mt-1.5 text-[10px] text-slate-600">
                    Type is for internal task organization.
                  </p>

                </div>

              </div>

              {/* URL */}

              <div>

                <label className="mb-1.5 block text-sm font-bold text-slate-300">
                  Task Link
                </label>

                <input
                  type="url"
                  value={
                    taskUrl
                  }
                  onChange={(e) =>
                    setTaskUrl(
                      e.target.value
                    )
                  }
                  placeholder="https://example.com"
                  disabled={
                    saving
                  }
                  className="w-full rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500 disabled:opacity-50"
                />

                <p className="mt-1.5 text-[10px] leading-4 text-slate-600">
                  Optional. The customer can open this link while completing the task.
                </p>

              </div>

              {/* DAILY LIMIT */}

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">

                <div className="flex items-start gap-3">

                  <div className="mt-0.5 text-blue-400">
                    <Info
                      size={17}
                    />
                  </div>

                  <div>

                    <p className="text-sm font-black text-white">
                      Current daily limits
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      These limits are separate and should be enforced server-side.
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2">

                      <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-3">

                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-600">
                          Tasks
                        </p>

                        <p className="mt-1 text-lg font-black text-blue-400">
                          {DAILY_TASK_LIMIT}
                        </p>

                        <p className="text-[10px] text-slate-600">
                          per day
                        </p>

                      </div>

                      <div className="rounded-xl border border-slate-800 bg-[#0b0f14] p-3">

                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-600">
                          Videos
                        </p>

                        <p className="mt-1 text-lg font-black text-cyan-400">
                          {DAILY_VIDEO_LIMIT}
                        </p>

                        <p className="text-[10px] text-slate-600">
                          per day
                        </p>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

              {/* STATUS */}

              <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-[#0b0f14] p-4">

                <div>

                  <p className="text-sm font-bold text-white">
                    Task Status
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    Active tasks can be shown to eligible customers.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setIsActive(
                      (value) =>
                        !value
                    )
                  }
                  disabled={
                    saving
                  }
                  className={`relative h-7 w-12 rounded-full transition ${
                    isActive
                      ? "bg-blue-600"
                      : "bg-slate-700"
                  }`}
                  aria-label="Toggle task status"
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                      isActive
                        ? "left-6"
                        : "left-1"
                    }`}
                  />
                </button>

              </div>

              {/* MODAL MESSAGE */}

              {message && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-300">
                  {message}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-semibold text-red-300">
                  {errorMessage}
                </div>
              )}

            </div>

            {/* FOOTER */}

            <div className="flex gap-3 border-t border-slate-800 p-5">

              <button
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
                className="flex-1 rounded-xl border border-slate-800 bg-[#0b0f14] px-4 py-3 text-sm font-bold text-slate-400 transition hover:bg-[#151b23] hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={() =>
                  void saveTask()
                }
                disabled={
                  saving
                }
                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingTask
                  ? "Update Task"
                  : "Create Task"}
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  icon,
  type,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  type:
    | "warning"
    | "blue"
    | "success"
    | "muted";
}) {
  const styles = {
    warning: {
      box:
        "border-amber-500/20 bg-amber-500/5",
      icon:
        "border-amber-500/20 bg-amber-500/10 text-amber-400",
    },

    blue: {
      box:
        "border-blue-500/20 bg-blue-500/5",
      icon:
        "border-blue-500/20 bg-blue-500/10 text-blue-400",
    },

    success: {
      box:
        "border-emerald-500/20 bg-emerald-500/5",
      icon:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    },

    muted: {
      box:
        "border-slate-800 bg-[#11151b]",
      icon:
        "border-slate-800 bg-slate-800/50 text-slate-500",
    },
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${styles[type].box}`}
    >
      <div className="flex items-center justify-between">

        <div>

          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            {title}
          </p>

          <p className="mt-2 text-2xl font-black text-white">
            {value}
          </p>

        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${styles[type].icon}`}
        >
          {icon}
        </div>

      </div>
    </div>
  );
}