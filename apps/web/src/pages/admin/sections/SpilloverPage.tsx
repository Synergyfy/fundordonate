// =============================================================================
// Admin — Spillover & Surplus
// =============================================================================

import { useEffect, useState } from "react";
import { campaignApi } from "@/services/campaign";
import {
  AdminPageHeader,
  AdminLoading,
  AdminError,
  AdminEmpty,
  AdminTable,
} from "./shared";

export function SpilloverPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    campaignApi
      .getSpilloverRules()
      .then((res) => {
        setRules(Array.isArray(res) ? res : []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(load, []);

  if (loading) return <AdminLoading />;
  if (error) return <AdminError onRetry={load} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Spillover & Surplus"
        description="Rules that apply when a campaign reaches its target."
      />
      {rules.length === 0 ? (
        <AdminEmpty message="No spillover rules configured yet." />
      ) : (
        <AdminTable columns={["Campaign", "Action", "Threshold", "Created"]}>
          {rules.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{r.campaignTitle ?? r.campaignId ?? "—"}</td>
              <td className="px-4 py-3 capitalize text-gray-500">
                {String(r.action ?? r.onTargetReached ?? "—").replace(/_/g, " ")}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {r.thresholdPct != null ? `${r.thresholdPct}%` : "—"}
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">
                {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-GB") : "—"}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
