import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronDown, ChevronUp, Mail, Send } from "lucide-react";
import { DEMO_FAQ } from "@/data/demo";

interface FaqEntry {
  q: string;
  a: string;
}

interface FaqCategory {
  id: string;
  label: string;
  questions: FaqEntry[];
}

function pick(...titles: string[]): FaqEntry[] {
  return titles
    .map((title) => DEMO_FAQ.find((f) => f.q === title))
    .filter((f): f is FaqEntry => !!f);
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "general",
    label: "General",
    questions: pick(
      "What is FundOrDonate?",
      "How does cost-neutral community funding work?",
      "What is the Mobile VCard integration?",
    ),
  },
  {
    id: "campaigns",
    label: "Campaigns",
    questions: pick(
      "How do I start a Local Hub campaign?",
      "How do I receive funds?",
    ),
  },
  {
    id: "payments",
    label: "Contributions & Payments",
    questions: pick("What are the fees?"),
  },
  {
    id: "rewards",
    label: "Rewards",
    questions: pick("What is a Founding Membership?"),
  },
  {
    id: "account",
    label: "Account",
    questions: pick("How do I contact support?"),
  },
];

const CONTACT_TOPICS = [
  { id: "general", label: "General question" },
  { id: "campaign", label: "A campaign" },
  { id: "payment", label: "A contribution or payment" },
  { id: "reward", label: "A reward" },
  { id: "account", label: "My account" },
];

export function ConsumerHelpPage() {
  const [activeCategory, setActiveCategory] = useState(FAQ_CATEGORIES[0]?.id ?? "general");
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  const [topic, setTopic] = useState(CONTACT_TOPICS[0]?.id ?? "general");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const category =
    FAQ_CATEGORIES.find((c) => c.id === activeCategory) ?? FAQ_CATEGORIES[0];

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (sending) return;
    if (message.trim().length < 10) {
      setFormError("Please enter a message of at least 10 characters.");
      return;
    }
    setFormError(null);
    setSending(true);
    window.setTimeout(() => {
      setSending(false);
      setSent(true);
      setMessage("");
    }, 600);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          to="/consumer/you"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          You
        </Link>
        <span className="text-xs text-gray-400">Help & Support</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Frequently Asked Questions
        </h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {FAQ_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setActiveCategory(c.id);
                setOpenQuestion(null);
              }}
              className={`rounded-full px-3 py-2 text-sm font-semibold transition-colors ${
                activeCategory === c.id
                  ? "bg-primary-600 text-white"
                  : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-white">
          {(category?.questions ?? []).map((f) => {
            const isOpen = openQuestion === f.q;
            return (
              <div key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpenQuestion(isOpen ? null : f.q)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-medium text-gray-900">
                    {f.q}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                  )}
                </button>
                {isOpen && (
                  <p className="px-4 pb-4 text-sm leading-relaxed text-gray-600">
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Contact Support
        </h2>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          {sent ? (
            <div className="py-4 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </span>
              <h3 className="mt-3 text-base font-semibold text-gray-900">
                Message sent
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Thanks for reaching out — our team aims to respond within 24
                hours.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="help-topic"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Topic
                </label>
                <select
                  id="help-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {CONTACT_TOPICS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="help-message"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Message
                </label>
                <textarea
                  id="help-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us how we can help…"
                  className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                {formError && (
                  <p className="mt-1 text-sm text-red-600">{formError}</p>
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                  <Mail className="h-4 w-4" />
                  support@fundordonate.com
                </span>
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-60"
                >
                  {sending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send message
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
