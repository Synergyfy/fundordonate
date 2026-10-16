// =============================================================================
// Admin Founding Members Page
// Directory of all founding members with filters for audience, status, programme.
// =============================================================================

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, type AdminFoundingMember } from "@/services/admin";
import { FoundingMemberBadge, getFoundingBadgeType } from "@/components/hub/FoundingMemberBadge";
import { AlertCircle, Loader2, Users } from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

type AudienceFilter = "" | "BUSINESS" | "CONSUMER";
type StatusFilter = "" | "ACTIVE" | "EXPIRED" | "REVOKED";

export default function AdminFoundingMembersPage() {
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminFoundingMember | null>(null);

  const { data: apiMembers, isLoading, error } = useQuery<AdminFoundingMember[]>({
    queryKey: ["admin-founding-members"],
    queryFn: () => adminApi.getFoundingMembers(),
  });

  const members = useMemo(() => {
    let filtered = apiMembers || [];
    if (audienceFilter) filtered = filtered.filter((m) => m.audience === audienceFilter);
    if (statusFilter) filtered = filtered.filter((m) => m.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((m) => {
        const name = m.name || m.userName || m.businessName || m.id || "";
        return (
          name.toLowerCase().includes(q) ||
          m.locationName?.toLowerCase().includes(q) ||
          m.id?.toLowerCase().includes(q)
        );
      });
    }
    return filtered;
  }, [apiMembers, audienceFilter, statusFilter, search]);

  const stats = useMemo(() => ({
    total: members.length,
    business: members.filter((m) => m.audience === "BUSINESS").length,
    consumer: members.filter((m) => m.audience === "CONSUMER").length,
    totalRaised: members.reduce((s: number, m) => s + (m.contributionAmount || 0), 0),
  }), [members]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Founding Members</h1>
        <p className="text-sm text-gray-500">Manage all registered founding business and consumer members.</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-500">Total Founding Members</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-500">Business Members</div>
          <div className="text-2xl font-bold text-gray-900">{stats.business}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-500">Consumer Members</div>
          <div className="text-2xl font-bold text-gray-900">{stats.consumer}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-500">Total Contribution</div>
          <div className="text-2xl font-bold text-gray-900">{fmt(stats.totalRaised)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search member, location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm flex-1"
        />
        <select
          value={audienceFilter}
          onChange={(e) => setAudienceFilter(e.target.value as AudienceFilter)}
          className="rounded-lg border px-3 py-2 text-sm bg-white"
        >
          <option value="">All Audiences</option>
          <option value="BUSINESS">Business</option>
          <option value="CONSUMER">Consumer</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-lg border px-3 py-2 text-sm bg-white"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="REVOKED">Revoked</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden shadow-sm">
        {members.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            No founding members match your current filters.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Member</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Audience</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Contribution</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelected(m)}>
                  <td className="px-4 py-3 font-medium text-gray-900">{m.name || m.userName || m.businessName || m.id}</td>
                  <td className="px-4 py-3 text-gray-600">{m.locationName || "National"}</td>
                  <td className="px-4 py-3 text-gray-600">{m.audience}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{fmt(m.contributionAmount || 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      m.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <FoundingMemberBadge type={getFoundingBadgeType(m.audience === "BUSINESS" ? "BUSINESS" : "CONSUMER", m.isOriginal ?? false, m.isMonthly ?? false)} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
