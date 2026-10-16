// =============================================================================
// Consumers List — Admin
// Directory of all consumers with search, filter, and detail links.
// =============================================================================

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, Users } from "lucide-react";
import { adminApi, type AdminConsumer } from "@/services/admin";

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  INACTIVE: "bg-gray-100 text-gray-500",
};

export function ConsumersListPage() {
  const [consumers, setConsumers] = useState<AdminConsumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    let mounted = true;
    async function fetchConsumers() {
      setLoading(true);
      try {
        const res = await adminApi.getConsumers({
          search: search || undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
          limit: 50,
        });
        if (!mounted) return;
        setConsumers(res?.items || []);
      } catch (err) {
        console.error("Failed to load consumers list:", err);
        if (mounted) setConsumers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchConsumers();
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
            <Link to="/admin/consumer-overview" className="hover:text-gray-700">Consumers</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">Directory</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Consumers</h1>
          <p className="text-sm text-gray-500">{consumers.length} consumers found</p>
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
            placeholder="Search by name or email..."
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
          <div className="py-12 text-center text-sm text-gray-400">Loading consumers...</div>
        ) : consumers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No consumers match your search</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {consumers.map((c) => {
              const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ") || c.email;
              const initials = (c.firstName?.[0] || c.email[0] || "C").toUpperCase();

              return (
                <div
                  key={c.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{fullName}</span>
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[c.membershipStatus || "ACTIVE"] || "bg-gray-100 text-gray-500"}`}>
                        {c.membershipStatus || "ACTIVE"}
                      </span>
                      {c.membershipTier && (
                        <span className="inline-flex rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                          {c.membershipTier}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{c.email}</div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      <span>{c.donationsCount || 0} contributions</span>
                      {c.createdAt && (
                        <span>Joined {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
