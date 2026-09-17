// =============================================================================
// Business Owners List — Admin
// Directory of all business owners with search, filter, and detail links.
// =============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, Building2 } from "lucide-react";

const DEMO_BUSINESS_OWNERS = [
  { id: "bo-1", firstName: "James", lastName: "Wilson", email: "james@techstart.co.uk", business: "TechStart Manchester", city: "Manchester", status: "ACTIVE", campaigns: 3, raised: 420000, backers: 180 },
  { id: "bo-2", firstName: "Sarah", lastName: "Chen", email: "sarah@greeninit.co.uk", business: "Green Initiative Ltd", city: "Birmingham", status: "ACTIVE", campaigns: 2, raised: 280000, backers: 120 },
  { id: "bo-3", firstName: "Michael", lastName: "Okafor", email: "michael@communityfund.co.uk", business: "Community Fund London", city: "London", status: "ACTIVE", campaigns: 4, raised: 650000, backers: 290 },
  { id: "bo-4", firstName: "Emma", lastName: "Thompson", email: "emma@digital.skills.co.uk", business: "Digital Skills Leeds", city: "Leeds", status: "ACTIVE", campaigns: 1, raised: 150000, backers: 85 },
  { id: "bo-5", firstName: "David", lastName: "Brown", email: "david@bristol.tech.co.uk", business: "Bristol Tech Hub", city: "Bristol", status: "PENDING", campaigns: 0, raised: 0, backers: 0 },
  { id: "bo-6", firstName: "Lisa", lastName: "Patel", email: "lisa@liverpoolgreen.co.uk", business: "Liverpool Green Spaces", city: "Liverpool", status: "ACTIVE", campaigns: 1, raised: 95000, backers: 45 },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  INACTIVE: "bg-gray-100 text-gray-500",
};

const fmt = (p: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

export function BusinessOwnersListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = DEMO_BUSINESS_OWNERS.filter((bo) => {
    const fullName = `${bo.firstName} ${bo.lastName}`.toLowerCase();
    if (search && !fullName.includes(search.toLowerCase()) && !bo.business.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && bo.status !== statusFilter) return false;
    return true;
  });

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
            <span className="text-gray-900 font-medium">Business Owners</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Business Owners</h1>
          <p className="text-sm text-gray-500">{DEMO_BUSINESS_OWNERS.length} business owners registered</p>
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
            placeholder="Search by name or business..."
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
        <div className="divide-y divide-gray-100">
          {filtered.map((bo) => (
            <Link
              key={bo.id}
              to={`/admin/business-owners/${bo.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 flex-shrink-0">
                {bo.firstName[0]}{bo.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{bo.firstName} {bo.lastName}</span>
                  <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[bo.status] || "bg-gray-100 text-gray-500"}`}>
                    {bo.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{bo.business} · {bo.city}</div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span>{bo.campaigns} campaigns</span>
                  <span>{fmt(bo.raised)} raised</span>
                  <span>{bo.backers} backers</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No business owners match your filters</p>
        </div>
      )}
    </div>
  );
}
