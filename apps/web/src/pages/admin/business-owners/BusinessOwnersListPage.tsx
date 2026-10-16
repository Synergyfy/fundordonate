// =============================================================================
// Business Owners List — Admin
// Directory of all business owners with search, filter, and detail links.
// =============================================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, Building2 } from "lucide-react";
import { adminApi, type AdminBusiness } from "@/services/admin";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  INACTIVE: "bg-gray-100 text-gray-500",
  SUSPENDED: "bg-red-100 text-red-700",
};

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format((p || 0) / 100);

export function BusinessOwnersListPage() {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    async function fetchBusinesses() {
      setLoading(true);
      try {
        const res = await adminApi.getBusinesses({
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          limit: 50,
        });
        if (!mounted) return;
        setBusinesses(res?.items || []);
      } catch (err) {
        console.error("Failed to load business owners:", err);
        if (mounted) setBusinesses([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchBusinesses();
    return () => {
      mounted = false;
    };
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link to="/admin" className="hover:text-gray-700">Admin</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to="/admin/business-owners" className="hover:text-gray-700">Business Owners</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Business Owners</h1>
          <p className="text-sm text-gray-500">{businesses.length} registered businesses found</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city, or business..."
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="all">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* List */}
      <div className="rounded-xl bg-white border">
        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading business owners...</div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No business owners match your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {businesses.map((bo) => {
              const displayName = bo.name || "Business";
              const initials = displayName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "B";

              return (
                <Link
                  key={bo.id}
                  to={`/admin/business-owners/${bo.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{bo.name}</span>
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[bo.status] || "bg-gray-100 text-gray-500"}`}>
                        {bo.status}
                      </span>
                      {bo.membershipTier && (
                        <span className="inline-flex rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                          {bo.membershipTier}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {bo.category || bo.businessType} · {bo.city} {bo.highStreet ? `> ${bo.highStreet}` : ""}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>{bo.campaignCount ?? bo.campaignsCount ?? 0} campaigns</span>
                      <span>{fmt(bo.totalRaised ?? 0)} raised</span>
                      <span>{bo.contributionCount ?? 0} contributions</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
