// =============================================================================
// Location Recommendations — Admin review queue
// Community submissions from businesses & consumers ("Can't see your high
// street? Recommend it"). Approving a recommendation creates it as SUGGESTED
// (source "recommendation") — it still needs confirming on the High Streets
// page before it is an official location.
// =============================================================================

import { useEffect, useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ChevronRight, Inbox, CheckCircle2, XCircle, Clock, MapPin,
  ShieldCheck, Loader2, Store, Users,
} from "lucide-react";
import {
  listLocationRecommendations,
  getLocationRecommendationCounts,
  approveLocationRecommendation,
  rejectLocationRecommendation,
  type LocationRecommendation,
  type RecommendationStatus,
} from "@/data/locationRecommendations";

type Filter = "pending" | "approved" | "rejected" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "all", label: "All" },
];

const STATUS_META: Record<RecommendationStatus, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: "Pending review", cls: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  approved: { label: "Approved · Suggested", cls: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", cls: "bg-gray-100 text-gray-600 border-gray-200", icon: XCircle },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export function LocationRecommendationsPage() {
  const [filter, setFilter] = useState<Filter>("pending");
  const [rows, setRows] = useState<LocationRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const counts = useMemo(() => getLocationRecommendationCounts(), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await listLocationRecommendations(
      filter === "all" ? undefined : { status: filter }
    );
    setRows(list);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const showToast = (kind: "ok" | "err", text: string) => {
    setToast({ kind, text });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async (rec: LocationRecommendation) => {
    setBusyId(rec.id);
    try {
      await approveLocationRecommendation(rec.id);
      showToast(
        "ok",
        `"${rec.name}" added as SUGGESTED — confirm it on the High Streets page to make it official.`
      );
      await refresh();
    } catch (err) {
      showToast("err", err instanceof Error ? err.message : "Could not approve.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (rec: LocationRecommendation) => {
    setBusyId(rec.id);
    try {
      await rejectLocationRecommendation(rec.id);
      showToast("ok", `"${rec.name}" rejected. Nothing was added to the hierarchy.`);
      await refresh();
    } catch (err) {
      showToast("err", err instanceof Error ? err.message : "Could not reject.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/admin/hub-locations" className="hover:text-gray-700">UK Activation</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-gray-900 font-medium">Recommendations</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Location Recommendations</h1>
            <p className="text-sm text-gray-500">
              High streets recommended by businesses and consumers — reviewed here before anything enters the hierarchy
            </p>
          </div>
          <Link
            to="/admin/high-streets"
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 hover:bg-primary-100 transition-colors"
          >
            <ShieldCheck className="h-4 w-4" />
            Confirm suggested high streets
          </Link>
        </div>
      </div>

      {/* Counts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Inbox className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-bold text-amber-700">Pending</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{counts.pending}</div>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs font-bold text-green-700">Approved (suggested)</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{counts.approved}</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <XCircle className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-600">Rejected</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{counts.rejected}</div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`rounded-lg px-4 py-3 text-sm font-medium border ${
            toast.kind === "ok"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* Filters + table */}
      <div className="rounded-xl bg-white border">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Recommendations</h3>
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.id ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-500">
                <th className="px-5 py-3 text-left font-medium">High Street</th>
                <th className="px-5 py-3 text-left font-medium hidden md:table-cell">City / Area</th>
                <th className="px-5 py-3 text-center font-medium hidden lg:table-cell">Recommended by</th>
                <th className="px-5 py-3 text-left font-medium hidden xl:table-cell">Note</th>
                <th className="px-5 py-3 text-center font-medium hidden md:table-cell">Submitted</th>
                <th className="px-5 py-3 text-center font-medium">Status</th>
                <th className="px-5 py-3 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Loader2 className="h-6 w-6 text-gray-300 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading recommendations…</p>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">No {filter === "all" ? "" : filter} recommendations</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submissions from the “Can&apos;t see your high street?” forms appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                rows.map((rec) => {
                  const meta = STATUS_META[rec.status];
                  const StatusIcon = meta.icon;
                  const busy = busyId === rec.id;
                  return (
                    <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{rec.name}</div>
                        {rec.postcodes.length > 0 && (
                          <div className="text-xs text-gray-500">{rec.postcodes.join(", ")}</div>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <div className="text-sm text-gray-700">{rec.cityName}</div>
                        <div className="text-xs text-gray-500">{rec.areaName}</div>
                      </td>
                      <td className="px-5 py-4 text-center hidden lg:table-cell">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-sm font-medium text-gray-800">{rec.suggestedBy}</span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              rec.submittedByRole === "business"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {rec.submittedByRole === "business"
                              ? <Store className="h-3 w-3" />
                              : <Users className="h-3 w-3" />}
                            {rec.submittedByRole === "business" ? "Business" : "Consumer"}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden xl:table-cell">
                        <p className="text-xs text-gray-600 line-clamp-2 max-w-xs">
                          {rec.note || <span className="text-gray-400">—</span>}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-center hidden md:table-cell">
                        <span className="text-xs text-gray-500">{fmtDate(rec.createdAt)}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.cls}`}>
                          <StatusIcon className="h-3 w-3" />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        {rec.status === "pending" ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => void handleApprove(rec)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                              Approve
                            </button>
                            <button
                              onClick={() => void handleReject(rec)}
                              disabled={busy}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                            >
                              <XCircle className="h-3 w-3" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
