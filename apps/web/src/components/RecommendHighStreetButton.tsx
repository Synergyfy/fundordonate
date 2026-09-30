// =============================================================================
// RecommendHighStreetButton — "Can't see your high street?" submission form
// Shared by business and consumer high-street list pages. Submits a pending
// recommendation into the admin review queue (locationRecommendations.ts).
// =============================================================================

import { useState, type FormEvent } from "react";
import { MapPin, X, CheckCircle2, Loader2, Send } from "lucide-react";
import {
  submitLocationRecommendation,
  type RecommendationAudience,
} from "@/data/locationRecommendations";

interface Props {
  role: RecommendationAudience;
  citySlug: string;
  cityName: string;
  areaSlug: string;
  areaName: string;
  label?: string;
  className?: string;
}

const DEFAULT_BTN =
  "inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:border-primary-300 hover:text-primary-700 transition-colors";

export function RecommendHighStreetButton({
  role,
  citySlug,
  cityName,
  areaSlug,
  areaName,
  label,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [postcodes, setPostcodes] = useState("");
  const [who, setWho] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const reset = () => {
    setName("");
    setPostcodes("");
    setWho("");
    setNote("");
    setError("");
    setDone(false);
    setSubmitting(false);
  };

  const close = () => {
    setOpen(false);
    setTimeout(reset, 250);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Enter the high street name.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await submitLocationRecommendation({
        kind: "high_street",
        name: name.trim(),
        citySlug,
        cityName,
        areaSlug,
        areaName,
        postcodes: postcodes.split(",").map((p) => p.trim()).filter(Boolean),
        suggestedBy: who.trim() || undefined,
        submittedByRole: role,
        note: note.trim(),
      });
      setDone(true);
      setTimeout(close, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? DEFAULT_BTN}
      >
        <MapPin className="h-3.5 w-3.5" />
        {label ?? "Can't see your high street? Recommend it"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="py-6 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Recommendation sent!
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  The FundOrDonate team will review it before it becomes a
                  suggested location for {areaName}, {cityName}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Recommend a high street
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {areaName}, {cityName} · Reviewed by Admin before anything
                      is added
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <label className="block text-xs font-medium text-gray-700 mb-1">
                  High street name <span className="text-red-500">*</span>
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Beech Road"
                  className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />

                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nearby postcode(s)
                </label>
                <input
                  value={postcodes}
                  onChange={(e) => setPostcodes(e.target.value)}
                  placeholder="M21 9EG, M21 9EL (comma separated)"
                  className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />

                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Your name or business {role === "business" ? "" : "(optional)"}
                </label>
                <input
                  value={who}
                  onChange={(e) => setWho(e.target.value)}
                  placeholder={role === "business" ? "Business name" : "e.g. Alex P."}
                  className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />

                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Why should it be included? (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="Independent shops, community favourite…"
                  className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400"
                />

                {error && (
                  <p className="mb-3 text-xs font-medium text-red-600">{error}</p>
                )}

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !name.trim()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    {submitting ? "Sending…" : "Send recommendation"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
