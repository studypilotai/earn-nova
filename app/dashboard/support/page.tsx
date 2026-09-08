"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Headphones,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Ticket,
} from "lucide-react";

type SupportTicket = {
  id: string;
  subject: string;
  category: string;
  message: string;
  createdAt: number;
};

const categories = [
  "General",
  "Account",
  "Activation",
  "Tasks",
  "Withdrawal",
  "Payment",
  "Referral",
  "Technical",
];

export default function SupportPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadTickets();

    const timer = setInterval(() => {
      loadTickets();
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  function loadTickets() {
    try {
      const saved = localStorage.getItem("earnNovaSupportTickets");

      if (!saved) {
        setTickets([]);
        return;
      }

      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        setTickets(parsed);
      }
    } catch {
      setTickets([]);
    }
  }

  function saveTickets(updatedTickets: SupportTicket[]) {
    localStorage.setItem(
      "earnNovaSupportTickets",
      JSON.stringify(updatedTickets)
    );

    setTickets(updatedTickets);
  }

  function isResolved(createdAt: number) {
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return Date.now() - createdAt >= twentyFourHours;
  }

  function getRemainingTime(createdAt: number) {
    const deadline = createdAt + 24 * 60 * 60 * 1000;
    const remaining = deadline - Date.now();

    if (remaining <= 0) {
      return "Resolved";
    }

    const hours = Math.floor(
      remaining / (1000 * 60 * 60)
    );

    const minutes = Math.floor(
      (remaining % (1000 * 60 * 60)) / (1000 * 60)
    );

    return `${hours}h ${minutes}m`;
  }

  function createTicket(e: FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!subject.trim()) {
      setError("Please enter a subject.");
      return;
    }

    if (!message.trim()) {
      setError("Please describe your issue.");
      return;
    }

    if (message.trim().length < 10) {
      setError("Please provide more details about your issue.");
      return;
    }

    const newTicket: SupportTicket = {
      id: crypto.randomUUID(),
      subject: subject.trim(),
      category,
      message: message.trim(),
      createdAt: Date.now(),
    };

    const updatedTickets = [newTicket, ...tickets];

    saveTickets(updatedTickets);

    setSubject("");
    setCategory("General");
    setMessage("");
    setShowCreate(false);

    setSuccess(
      "Ticket created successfully. It will automatically be resolved within 24 hours."
    );
  }

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  const openTickets = tickets.filter(
    (ticket) => !isResolved(ticket.createdAt)
  );

  const resolvedTickets = tickets.filter(
    (ticket) => isResolved(ticket.createdAt)
  );

  return (
    <main className="min-h-screen bg-[#070b10] text-white">

      {/* HEADER */}

      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#070b10]/90 backdrop-blur-xl">

        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5">

          <button
            onClick={() => router.back()}
            className="flex items-center gap-3 text-sm font-bold text-slate-400 transition hover:text-white"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
              <ArrowLeft size={18} />
            </div>

            Back
          </button>

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/20">
              <Headphones size={20} />
            </div>

            <div>
              <h1 className="font-black">
                Support
              </h1>

              <p className="text-[11px] font-semibold text-slate-600">
                Earn Nova Help Center
              </p>
            </div>

          </div>

          <button
            onClick={loadTickets}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:text-white"
          >
            <RefreshCw size={17} />
          </button>

        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-6xl px-5 py-8">

        {/* TITLE */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-sm font-black tracking-wider text-blue-400">
              HELP CENTER
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight">
              How can we help?
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              Create a ticket if you need help with your Earn Nova
              account. Tickets are automatically resolved after 24 hours.
            </p>

          </div>

          <button
            onClick={() => {
              setShowCreate(!showCreate);
              setError("");
              setSuccess("");
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
          >
            <Plus size={18} />
            Create Ticket
          </button>

        </div>

        {/* STATS */}

        <div className="mb-6 grid grid-cols-3 gap-3">

          <div className="rounded-2xl border border-white/[0.07] bg-[#11161d] p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Ticket size={18} />
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-600">
                  TOTAL
                </p>

                <p className="text-xl font-black">
                  {tickets.length}
                </p>
              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#11161d] p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Clock3 size={18} />
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-600">
                  OPEN
                </p>

                <p className="text-xl font-black">
                  {openTickets.length}
                </p>
              </div>

            </div>

          </div>

          <div className="rounded-2xl border border-white/[0.07] bg-[#11161d] p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={18} />
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-600">
                  RESOLVED
                </p>

                <p className="text-xl font-black">
                  {resolvedTickets.length}
                </p>
              </div>

            </div>

          </div>

        </div>

        {/* SUCCESS */}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-sm font-semibold text-emerald-400">
            {success}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm font-semibold text-red-400">
            {error}
          </div>
        )}

        {/* CREATE TICKET */}

        {showCreate && (
          <div className="mb-8 rounded-3xl border border-blue-500/20 bg-[#11161d] p-6">

            <div className="mb-6">

              <h3 className="text-xl font-black">
                Create Support Ticket
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Explain your issue and we'll automatically resolve the
                ticket within 24 hours.
              </p>

            </div>

            <form
              onSubmit={createTicket}
              className="space-y-5"
            >

              {/* SUBJECT */}

              <div>

                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Subject
                </label>

                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Withdrawal issue"
                  maxLength={100}
                  className="w-full rounded-xl border border-white/10 bg-[#070b10] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500/50"
                />

              </div>

              {/* CATEGORY */}

              <div>

                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Category
                </label>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#070b10] px-4 py-3.5 text-sm text-white outline-none focus:border-blue-500/50"
                >

                  {categories.map((item) => (
                    <option
                      key={item}
                      value={item}
                      className="bg-[#070b10]"
                    >
                      {item}
                    </option>
                  ))}

                </select>

              </div>

              {/* MESSAGE */}

              <div>

                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Message
                </label>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue..."
                  rows={6}
                  maxLength={2000}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#070b10] px-4 py-3.5 text-sm leading-6 text-white outline-none placeholder:text-slate-700 focus:border-blue-500/50"
                />

              </div>

              {/* BUTTONS */}

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-400 hover:bg-white/[0.04] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500"
                >
                  <Send size={17} />
                  Submit Ticket
                </button>

              </div>

            </form>

          </div>
        )}

        {/* TICKETS */}

        <div>

          <div className="mb-4 flex items-center justify-between">

            <h3 className="text-lg font-black">
              Your Tickets
            </h3>

            <span className="text-xs font-semibold text-slate-600">
              Automatically resolved
            </span>

          </div>

          {tickets.length === 0 ? (

            <div className="rounded-3xl border border-dashed border-white/[0.1] bg-[#11161d] p-12 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                <MessageSquare size={24} />
              </div>

              <h3 className="mt-5 text-lg font-black">
                No tickets yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Need help? Create a support ticket and it will
                automatically be resolved within 24 hours.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {tickets.map((ticket) => {

                const resolved = isResolved(ticket.createdAt);

                return (
                  <div
                    key={ticket.id}
                    className="rounded-3xl border border-white/[0.07] bg-[#11161d] p-5 sm:p-6"
                  >

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <span
                            className={
                              resolved
                                ? "rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-400"
                                : "rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-400"
                            }
                          >
                            {resolved ? "Resolved" : "Open"}
                          </span>

                          <span className="rounded-full bg-white/[0.04] px-3 py-1 text-[10px] font-bold text-slate-600">
                            {ticket.category}
                          </span>

                        </div>

                        <h4 className="mt-3 text-lg font-black">
                          {ticket.subject}
                        </h4>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-500">
                          {ticket.message}
                        </p>

                      </div>

                      <div className="shrink-0">

                        {resolved ? (

                          <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] px-5 py-3 text-center">

                            <CheckCircle2
                              size={18}
                              className="mx-auto text-emerald-400"
                            />

                            <p className="mt-1 text-xs font-black text-emerald-400">
                              Resolved
                            </p>

                            <p className="mt-1 text-[10px] text-slate-600">
                              24 hours completed
                            </p>

                          </div>

                        ) : (

                          <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.04] px-5 py-3 text-center">

                            <Clock3
                              size={18}
                              className="mx-auto text-amber-400"
                            />

                            <p className="mt-1 text-xs font-black text-amber-400">
                              Auto Resolve
                            </p>

                            <p className="mt-1 text-[10px] text-slate-600">
                              {getRemainingTime(ticket.createdAt)}
                            </p>

                          </div>

                        )}

                      </div>

                    </div>

                    <div className="mt-5 flex flex-wrap gap-4 border-t border-white/[0.06] pt-4 text-[11px] font-semibold text-slate-700">

                      <span>
                        Ticket #{ticket.id.slice(0, 8).toUpperCase()}
                      </span>

                      <span>
                        Created {formatDate(ticket.createdAt)}
                      </span>

                      {resolved && (
                        <span className="text-emerald-500/60">
                          Automatically resolved
                        </span>
                      )}

                    </div>

                  </div>
                );
              })}

            </div>

          )}

        </div>

      </div>
    </main>
  );
}