"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
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
  Layers3,
  Info,
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
  task_type: string | null;
  link: string | null;
  is_active: boolean;
  created_at: string;
};

const PLAN_LIMITS = [
  {
    name: "Starter",
    tasks: 10,
    videos: 40,
    price: "$2.50",
  },
  {
    name: "Basic",
    tasks: 20,
    videos: 80,
    price: "$5",
  },
  {
    name: "Pro",
    tasks: 30,
    videos: 160,
    price: "$10",
  },
  {
    name: "Premium",
    tasks: 40,
    videos: 280,
    price: "$20",
  },
  {
    name: "VIP",
    tasks: 50,
    videos: 400,
    price: "$50",
  },
];

const TASK_TYPES = [
  "Visit Website",
  "Social Media",
  "Survey",
  "App Install",
  "Other",
];

export default function AdminTasksPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [taskType, setTaskType] = useState("Visit Website");
  const [link, setLink] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function checkAdmin() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/admin/login");
      return false;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || profile?.role !== "admin") {
      router.replace("/dashboard");
      return false;
    }

    return true;
  }

  async function loadTasks() {
    try {
      setLoading(true);
      setErrorMessage("");

      const allowed = await checkAdmin();

      if (!allowed) return;

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(error);
        setErrorMessage(error.message);
        setTasks([]);
        return;
      }

      setTasks((data as Task[]) || []);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(
        error?.message || "Failed to load tasks."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  function resetForm() {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setReward("");
    setTaskType("Visit Website");
    setLink("");
    setIsActive(true);
  }

  function openCreateModal() {
    resetForm();
    setMessage("");
    setErrorMessage("");
    setShowModal(true);
  }

  function openEditModal(task: Task) {
    setEditingTask(task);

    setTitle(task.title);
    setDescription(task.description || "");
    setReward(String(task.reward));
    setTaskType(
      task.task_type || "Visit Website"
    );
    setLink(task.link || "");
    setIsActive(task.is_active);

    setMessage("");
    setErrorMessage("");
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;

    setShowModal(false);
    setEditingTask(null);
    setMessage("");
    setErrorMessage("");
  }

  async function saveTask() {
    setMessage("");
    setErrorMessage("");

    if (!title.trim()) {
      setErrorMessage(
        "Task title is required."
      );
      return;
    }

    const numericReward = Number(reward);

    if (
      !reward ||
      Number.isNaN(numericReward) ||
      numericReward <= 0
    ) {
      setErrorMessage(
        "Enter a valid reward amount."
      );
      return;
    }

    if (link.trim()) {
      try {
        new URL(link.trim());
      } catch {
        setErrorMessage(
          "Please enter a valid task link."
        );
        return;
      }
    }

    try {
      setSaving(true);

      if (editingTask) {
        const { error } = await supabase
          .from("tasks")
          .update({
            title: title.trim(),
            description:
              description.trim() || null,
            reward: numericReward,
            task_type: taskType,
            link: link.trim() || null,
            is_active: isActive,
          })
          .eq("id", editingTask.id);

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        setMessage(
          "Task updated successfully."
        );
      } else {
        const { error } = await supabase
          .from("tasks")
          .insert({
            title: title.trim(),
            description:
              description.trim() || null,
            reward: numericReward,
            task_type: taskType,
            link: link.trim() || null,
            is_active: isActive,
          });

        if (error) {
          setErrorMessage(error.message);
          return;
        }

        setMessage(
          "Task created successfully."
        );
      }

      await loadTasks();

      setTimeout(() => {
        setShowModal(false);
        setEditingTask(null);
        setMessage("");
      }, 700);
    } catch (error: any) {
      setErrorMessage(
        error?.message ||
          "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: Task) {
    setErrorMessage("");
    setMessage("");

    const { error } = await supabase
      .from("tasks")
      .update({
        is_active: !task.is_active,
      })
      .eq("id", task.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(
      task.is_active
        ? "Task deactivated."
        : "Task activated."
    );

    await loadTasks();
  }

  async function deleteTask(task: Task) {
    const confirmed = window.confirm(
      `Delete "${task.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setErrorMessage("");
    setMessage("");

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", task.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(
      "Task deleted successfully."
    );

    await loadTasks();
  }

  const filteredTasks = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase();

    if (!keyword) return tasks;

    return tasks.filter((task) => {
      return (
        task.title
          .toLowerCase()
          .includes(keyword) ||
        task.description
          ?.toLowerCase()
          .includes(keyword) ||
        task.task_type
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [tasks, search]);

  const activeTasks = tasks.filter(
    (task) => task.is_active
  ).length;

  const inactiveTasks = tasks.filter(
    (task) => !task.is_active
  ).length;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">

      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-center gap-3">

            <button
              onClick={() =>
                router.push("/admin")
              }
              className="
                flex h-11 w-11 shrink-0
                items-center justify-center
                rounded-xl
                border border-slate-200
                bg-white
                text-slate-600
                shadow-sm
                transition
                hover:bg-slate-50
                hover:text-slate-900
              "
            >
              <ArrowLeft size={20} />
            </button>

            <div>
              <div className="flex items-center gap-2">

                <h1 className="text-2xl font-bold">
                  Task Management
                </h1>

                <span className="hidden rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-600 sm:inline-flex">
                  Admin
                </span>

              </div>

              <p className="mt-1 text-sm text-slate-500">
                Create, manage and control earning tasks
              </p>
            </div>

          </div>

          <div className="flex gap-2">

            <button
              onClick={loadTasks}
              disabled={loading}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border border-slate-200
                bg-white
                px-4
                py-3
                text-sm
                font-semibold
                text-slate-700
                shadow-sm
                transition
                hover:bg-slate-50
                disabled:opacity-60
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

              Refresh
            </button>

            <button
              onClick={openCreateModal}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-blue-600
                px-4
                py-3
                text-sm
                font-semibold
                text-white
                shadow-sm
                shadow-blue-600/20
                transition
                hover:bg-blue-700
              "
            >
              <Plus size={18} />

              New Task
            </button>

          </div>

        </div>


        {/* PLAN LIMIT INFO */}

        <div className="mb-6 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">

          <div className="flex flex-col gap-3 border-b border-slate-100 bg-blue-50/60 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Layers3 size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Daily Task Limits
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  User task limits are controlled by their active membership plan.
                </p>
              </div>

            </div>

            <div className="flex items-center gap-2 text-xs text-blue-600">
              <Info size={15} />
              <span>
                Videos have separate limits
              </span>
            </div>

          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 sm:grid-cols-5 sm:divide-y-0">

            {PLAN_LIMITS.map((plan) => (
              <div
                key={plan.name}
                className="p-4 text-center"
              >
                <p className="text-xs font-semibold text-slate-500">
                  {plan.name}
                </p>

                <p className="mt-1 text-xl font-black text-slate-900">
                  {plan.tasks}
                </p>

                <p className="text-[11px] text-slate-400">
                  tasks / day
                </p>

                <p className="mt-2 text-[10px] font-medium text-blue-600">
                  {plan.videos} videos
                </p>
              </div>
            ))}

          </div>

        </div>


        {/* STATS */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-4 flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ClipboardList size={21} />
              </div>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                All
              </span>

            </div>

            <p className="text-sm text-slate-500">
              Total Tasks
            </p>

            <p className="mt-1 text-2xl font-black">
              {tasks.length}
            </p>

          </div>


          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-4 flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle size={21} />
              </div>

              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                Live
              </span>

            </div>

            <p className="text-sm text-slate-500">
              Active Tasks
            </p>

            <p className="mt-1 text-2xl font-black">
              {activeTasks}
            </p>

          </div>


          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-4 flex items-center justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <XCircle size={21} />
              </div>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Off
              </span>

            </div>

            <p className="text-sm text-slate-500">
              Inactive Tasks
            </p>

            <p className="mt-1 text-2xl font-black">
              {inactiveTasks}
            </p>

          </div>

        </div>


        {/* MESSAGES */}

        {message && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle size={17} />
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}


        {/* SEARCH */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search by task name, description or type..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              className="
                w-full
                rounded-xl
                border border-slate-200
                bg-slate-50
                py-3
                pl-10
                pr-4
                text-sm
                outline-none
                transition
                focus:border-blue-500
                focus:bg-white
                focus:ring-2
                focus:ring-blue-100
              "
            />

          </div>

        </div>


        {/* TASK LIST */}

        {loading ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-blue-600"
            />

            <p className="mt-3 text-sm text-slate-500">
              Loading tasks...
            </p>

          </div>

        ) : filteredTasks.length === 0 ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <ClipboardList
              size={42}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-4 text-lg font-bold">
              No tasks found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {search
                ? "Try a different search."
                : "Create your first earning task."}
            </p>

            {!search && (
              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Plus size={17} />
                Create Task
              </button>
            )}

          </div>

        ) : (

          <div className="space-y-4">

            {filteredTasks.map((task) => (

              <div
                key={task.id}
                className="
                  rounded-2xl
                  border border-slate-200
                  bg-white
                  p-5
                  shadow-sm
                  transition
                  hover:border-slate-300
                  hover:shadow-md
                "
              >

                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                  {/* INFO */}

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <h3 className="font-bold text-slate-900">
                        {task.title}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          task.is_active
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {task.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>

                    </div>


                    {task.description && (
                      <p className="mt-2 max-w-3xl line-clamp-2 text-sm leading-6 text-slate-500">
                        {task.description}
                      </p>
                    )}


                    <div className="mt-4 flex flex-wrap items-center gap-2">

                      <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                        {task.task_type ||
                          "General"}
                      </span>

                      <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                        +$
                        {Number(
                          task.reward
                        ).toFixed(2)}
                      </span>

                      {task.link && (
                        <a
                          href={task.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                        >
                          Open Link
                          <ExternalLink
                            size={12}
                          />
                        </a>
                      )}

                    </div>

                  </div>


                  {/* ACTIONS */}

                  <div className="flex shrink-0 flex-wrap items-center gap-2">

                    <button
                      onClick={() =>
                        toggleTask(task)
                      }
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        task.is_active
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {task.is_active
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                    <button
                      onClick={() =>
                        openEditModal(task)
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      <Pencil size={15} />
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        deleteTask(task)
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>


      {/* CREATE / EDIT MODAL */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 p-5">

              <div>

                <h2 className="text-lg font-bold">
                  {editingTask
                    ? "Edit Task"
                    : "Create New Task"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Configure the earning task
                </p>

              </div>

              <button
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X size={18} />
              </button>

            </div>


            {/* BODY */}

            <div className="space-y-5 p-5">

              {/* TITLE */}

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Task Title
                </label>

                <input
                  value={title}
                  onChange={(e) =>
                    setTitle(e.target.value)
                  }
                  placeholder="e.g. Visit EarnNova Website"
                  className="
                    w-full
                    rounded-xl
                    border border-slate-200
                    px-4 py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />

              </div>


              {/* DESCRIPTION */}

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Explain what the user needs to do..."
                  className="
                    w-full
                    resize-none
                    rounded-xl
                    border border-slate-200
                    px-4 py-3
                    text-sm
                    outline-none
                    transition
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />

              </div>


              {/* REWARD + TYPE */}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Reward ($)
                  </label>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={reward}
                    onChange={(e) =>
                      setReward(
                        e.target.value
                      )
                    }
                    placeholder="0.10"
                    className="
                      w-full
                      rounded-xl
                      border border-slate-200
                      px-4 py-3
                      text-sm
                      outline-none
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  />

                  <p className="mt-1.5 text-[11px] text-slate-400">
                    Reward is credited after successful task completion.
                  </p>

                </div>


                <div>

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Task Type
                  </label>

                  <select
                    value={taskType}
                    onChange={(e) =>
                      setTaskType(
                        e.target.value
                      )
                    }
                    className="
                      w-full
                      rounded-xl
                      border border-slate-200
                      bg-white
                      px-4 py-3
                      text-sm
                      outline-none
                      focus:border-blue-500
                      focus:ring-2
                      focus:ring-blue-100
                    "
                  >
                    {TASK_TYPES.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      )
                    )}
                  </select>

                </div>

              </div>


              {/* LINK */}

              <div>

                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Task Link
                </label>

                <input
                  type="url"
                  value={link}
                  onChange={(e) =>
                    setLink(
                      e.target.value
                    )
                  }
                  placeholder="https://example.com"
                  className="
                    w-full
                    rounded-xl
                    border border-slate-200
                    px-4 py-3
                    text-sm
                    outline-none
                    focus:border-blue-500
                    focus:ring-2
                    focus:ring-blue-100
                  "
                />

                <p className="mt-1.5 text-xs text-slate-400">
                  Optional. Users can open this link while completing the task.
                </p>

              </div>


              {/* PLAN INFORMATION */}

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">

                <div className="flex items-start gap-3">

                  <div className="mt-0.5 text-blue-600">
                    <Info size={17} />
                  </div>

                  <div>

                    <p className="text-sm font-bold text-slate-800">
                      Plan-based daily limits
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      The number of tasks a user can complete per day is controlled by their membership plan.
                    </p>

                    <div className="mt-3 grid grid-cols-5 gap-1.5">

                      {PLAN_LIMITS.map(
                        (plan) => (
                          <div
                            key={plan.name}
                            className="rounded-lg bg-white px-1.5 py-2 text-center"
                          >
                            <p className="truncate text-[9px] font-bold text-slate-500">
                              {plan.name}
                            </p>

                            <p className="mt-0.5 text-sm font-black text-blue-600">
                              {plan.tasks}
                            </p>

                          </div>
                        )
                      )}

                    </div>

                  </div>

                </div>

              </div>


              {/* STATUS */}

              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">

                <div>

                  <p className="text-sm font-semibold">
                    Task Status
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Active tasks are available to eligible users.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setIsActive(
                      !isActive
                    )
                  }
                  className={`relative h-7 w-12 rounded-full transition ${
                    isActive
                      ? "bg-blue-600"
                      : "bg-slate-300"
                  }`}
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


              {message && (
                <div className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                  {message}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">
                  {errorMessage}
                </div>
              )}

            </div>


            {/* FOOTER */}

            <div className="flex gap-3 border-t border-slate-100 p-5">

              <button
                onClick={closeModal}
                disabled={saving}
                className="
                  flex-1
                  rounded-xl
                  bg-slate-100
                  px-4 py-3
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:bg-slate-200
                  disabled:opacity-50
                "
              >
                Cancel
              </button>

              <button
                onClick={saveTask}
                disabled={saving}
                className="
                  flex-1
                  rounded-xl
                  bg-blue-600
                  px-4 py-3
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-blue-700
                  disabled:opacity-50
                "
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