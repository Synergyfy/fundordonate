// =============================================================================
// Consumers List — Admin
// Directory of all consumers with search, filter, and detail links.
// =============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, Users } from "lucide-react";

const DEMO_CONSUMERS = [
  { id: "c-1", firstName: "Emily", lastName: "Johnson", email: "emily.j@email.com", city: "London", status: "ACTIVE", donations: 12, raised: 2400, campaigns: 3 },
  { id: "c-2", firstName: "James", lastName: "Smith", email: "james.s@email.com", city: "Manchester", status: "ACTIVE", donations: 8, raised: 1600, campaigns: 2 },
  { id: "c-3", firstName: "Sophie", lastName: "Williams", email: "sophie.w@email.com", city: "Birmingham", status: "ACTIVE", donations: 15, raised: 3200, campaigns: 4 },
  { id: "c-4", firstName: "Oliver", lastName: "Brown", email: "oliver.b@email.com", city: "Leeds", status: "ACTIVE", donations: 5, raised: 800, campaigns: 1 },
  { id: "c-5", firstName: "Charlotte", lastName: "Taylor", email: "charlotte.t@email.com", city: "Bristol", status: "INACTIVE", donations: 2, raised: 350, campaigns: 0 },
  { id: "c-6", firstName: "Daniel", lastName: "Wilson", email: "daniel.w@email.com", city: "Liverpool", status: "ACTIVE", donations: 9, raised: 1900, campaigns: 2 },
];

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  INACTIVE: "bg-gray-100 text-gray-500",
};

const fmt = (p: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

export function ConsumersListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = DEMO_CONSUMERS.filter((c) => {
    const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
    if (search && !fullName.includes(search.toLowerCase()) && !c.city.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
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
            <Link to="/admin/consumer-overview" className="hover:text-gray-700">Consumers</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">Consumers</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Consumers</h1>
          <p className="text-sm text-gray-500">{DEMO_CONSUMERS.length} consumers registered</p>
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
            placeholder="Search by name or city..."
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
          {filtered.map((consumer) => (
            <Link
              key={consumer.id}
              to={`/admin/consumer-overview/${consumer.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 flex-shrink-0">
                {consumer.firstName[0]}{consumer.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{consumer.firstName} {consumer.lastName}</span>
                  <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[consumer.status] || "bg-gray-100 text-gray-500"}`}>
                    {consumer.status}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{consumer.email} · {consumer.city}</div>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                  <span>{consumer.donations} donations</span>
                  <span>{fmt(consumer.raised)} raised</span>
                  <span>{consumer.campaigns} campaigns</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No consumers match your filters</p>
        </div>
      )}
    </div>
  );
}
