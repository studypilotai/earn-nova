"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import {
  ArrowLeft,
  CheckCircle2,
  Headphones,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
} from "lucide-react";

type SupportTicket = {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: "open" | "resolved";
  created_at: string;
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

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SupportPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      /*
       * Silent server-side cleanup.
       * Customer ko is process ki koi information nahi dikhai jati.
       */
      await supabase.rpc("auto_resolve_support_tickets");

      const { data, error: ticketsError } = await supabase
        .from("support_tickets")
        .select(
          "id, subject, category, message, status, created_at"
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (ticketsError) {
        throw ticketsError;
      }

      setTickets((data || []) as SupportTicket[]);
    } catch (err) {
      console.error("Support tickets error:", err);
      setError("Unable to load your support tickets.");
    } finally {
      setLoading(false);
    }
  }

  async function createTicket(e: FormEvent) {
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

    setSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login");
        return;
      }

      const { error: insertError } = await supabase
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: subject.trim(),
          category,
          message: message.trim(),
          status: "open",
        });

      if (insertError) {
        throw insertError;
      }

      setSubject("");
      setCategory("General");
      setMessage("");
      setShowCreate(false);

      setSuccess("Your support request has been submitted.");

      await loadTickets();
    } catch (err) {
      console.error("Create ticket error:", err);
      setError("Unable to submit your support request.");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

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
            disabled={loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
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
              Contact Earn Nova support whenever you need assistance
              with your account or activities.
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
                Tell us about the issue you are experiencing.
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
                  disabled={submitting}
                  className="w-full rounded-xl border border-white/10 bg-[#070b10] px-4 py-3.5 text-sm text-white outline-none placeholder:text-slate-700 focus:border-blue-500/50 disabled:opacity-50"
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
                  disabled={submitting}
                  className="w-full rounded-xl border border-white/10 bg-[#070b10] px-4 py-3.5 text-sm text-white outline-none focus:border-blue-500/50 disabled:opacity-50"
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
                  disabled={submitting}
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#070b10] px-4 py-3.5 text-sm leading-6 text-white outline-none placeholder:text-slate-700 focus:border-blue-500/50 disabled:opacity-50"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  disabled={submitting}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={17} />

                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TICKETS */}
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-black">
              Your Tickets
            </h3>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-white/[0.07] bg-[#11161d] p-12 text-center">
              <RefreshCw
                size={24}
                className="mx-auto animate-spin text-blue-400"
              />

              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading...
              </p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/[0.1] bg-[#11161d] p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
                <MessageSquare size={24} />
              </div>

              <h3 className="mt-5 text-lg font-black">
                Need help?
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Create a support ticket and our team will handle your
                request.
              </p>

              <button
                onClick={() => setShowCreate(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-500"
              >
                <Plus size={17} />
                Create Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => {
                const resolved = ticket.status === "resolved";

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
                                : "rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-400"
                            }
                          >
                            {resolved ? "Resolved" : "Received"}
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

                      {resolved && (
                        <div className="shrink-0 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.04] px-5 py-3 text-center">
                          <CheckCircle2
                            size={18}
                            className="mx-auto text-emerald-400"
                          />

                          <p className="mt-1 text-xs font-black text-emerald-400">
                            Resolved
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 border-t border-white/[0.06] pt-4 text-[11px] font-semibold text-slate-700">
                      Created {formatDate(ticket.created_at)}
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