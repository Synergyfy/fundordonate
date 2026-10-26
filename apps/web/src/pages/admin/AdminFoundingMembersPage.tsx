// =============================================================================
// Admin Founding Members Page
// Directory of actual FoundingMembership records, with programme/location context.
// =============================================================================

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";
import { FoundingMemberBadge, getFoundingBadgeType } from "@/components/hub/FoundingMemberBadge";
import { Loader2, Users } from "lucide-react";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

type AudienceFilter = "" | "BUSINESS" | "CONSUMER";
type StatusFilter = "" | "ACTIVE" | "PENDING" | "EXPIRED" | "REVOKED";

interface MembershipRow {
  id: string;
  memberName: string;
  email: string;
  programmeTitle: string;
  audience: "BUSINESS" | "CONSUMER";
  locationName: string;
  tier: string;
  status: string;
  contributionAmount: number;
  isMonthly?: boolean;
  grantedAt: string;
}

export default function AdminFoundingMembersPage() {
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [search, setSearch] = useState("");

  const { data: apiMembers, isLoading, error } = useQuery<MembershipRow[]>({
    queryKey: ["admin-founding-memberships"],
    queryFn: () => adminApi.getFoundingMemberships(),
  });

  const members = useMemo(() => {
    let filtered = apiMembers || [];
    if (audienceFilter) filtered = filtered.filter((m) => m.audience === audienceFilter);
    if (statusFilter) filtered = filtered.filter((m) => m.status === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((m) =>
        [m.memberName, m.email, m.locationName, m.programmeTitle]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(q)),
      );
    }
    return filtered;
  }, [apiMembers, audienceFilter, statusFilter, search]);

  const stats = useMemo(
    () => ({
      total: members.length,
      business: members.filter((m) => m.audience === "BUSINESS").length,
      consumer: members.filter((m) => m.audience === "CONSUMER").length,
      totalRaised: members.reduce((sum, m) => sum + (m.contributionAmount || 0), 0),
    }),
    [members],
  );

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
        <p className="text-sm text-gray-500">
          Location-scoped founding memberships recorded against a programme and location.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load founding memberships.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search member, location, programme..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <select
          value={audienceFilter}
          onChange={(event) => setAudienceFilter(event.target.value as AudienceFilter)}
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          <option value="">All Audiences</option>
          <option value="BUSINESS">Business</option>
          <option value="CONSUMER">Consumer</option>
        </select>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="EXPIRED">Expired</option>
          <option value="REVOKED">Revoked</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {members.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            No founding memberships match your current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Member</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Programme</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Location</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Audience</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Contribution</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Badge</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.map((membership) => (
                  <tr key={membership.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{membership.memberName}</p>
                      <p className="text-xs text-gray-400">{membership.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{membership.programmeTitle}</td>
                    <td className="px-4 py-3 text-gray-600">{membership.locationName}</td>
                    <td className="px-4 py-3 text-gray-600">{membership.audience}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      {fmt(membership.contributionAmount || 0)}
                      {membership.isMonthly ? " / month" : ""}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                          membership.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {membership.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <FoundingMemberBadge
                        type={getFoundingBadgeType(
                          membership.audience === "BUSINESS" ? "BUSINESS" : "CONSUMER",
                          false,
                          Boolean(membership.isMonthly),
                        )}
                        size="sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
