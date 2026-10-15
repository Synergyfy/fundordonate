import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { adminApi, type AdminConsumer } from "@/services/admin";
import { formatDate } from "@/utils/formatters";

type FoundingFilter = "" | "FOUNDING" | "MEMBER" | "NONE";

const STATUS_COLORS: Record<string, string> = {
  FOUNDING: "bg-amber-100 text-amber-700",
  MEMBER: "bg-green-100 text-green-700",
  NONE: "bg-gray-100 text-gray-600",
};

const STATUS_OPTIONS: { value: FoundingFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "FOUNDING", label: "Founding" },
  { value: "MEMBER", label: "Member" },
  { value: "NONE", label: "Standard" },
];

export function ConsumersManagementPage() {
  const [consumers, setConsumers] = useState<AdminConsumer[]>([]);
  const [total, setTotal] = useState(0);
  const [foundingCount, setFoundingCount] = useState(0);
  const [activeMembersCount, setActiveMembersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FoundingFilter>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminConsumer | null>(null);

  const fetchConsumers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getConsumers({
        search: search || undefined,
      });
      const list = res.items || res.consumers || [];
      setConsumers(list);
      setTotal(res.total || list.length);
      setFoundingCount(
        res.foundingCount !== undefined
          ? res.foundingCount
          : list.filter((c: any) => (c.membershipTier || "").toUpperCase().includes("FOUNDING")).length
      );
      setActiveMembersCount(
        res.activeMembersCount !== undefined
          ? res.activeMembersCount
          : list.filter((c: any) => (c.membershipStatus || "").toUpperCase() === "ACTIVE").length
      );
    } catch {
      setConsumers([]);
      setTotal(0);
      setFoundingCount(0);
      setActiveMembersCount(0);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchConsumers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchConsumers]);

  const filteredConsumers = consumers.filter((c) => {
    if (!statusFilter) return true;
    const tier = (c.membershipTier || c.membershipStatus || "").toUpperCase();
    if (statusFilter === "FOUNDING") return tier.includes("FOUNDING");
    if (statusFilter === "MEMBER") return tier.includes("MEMBER") || tier.includes("ACTIVE");
    return !tier || tier === "NONE" || tier === "STANDARD";
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consumers</h1>
          <p className="text-sm text-gray-500">{total} registered consumer accounts</p>
        </div>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white p-3 shadow-sm border border-gray-100 text-center">
          <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">FOUNDING</span>
          <p className="mt-1 text-lg font-bold text-gray-900">{foundingCount}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border border-gray-100 text-center">
          <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">ACTIVE MEMBERS</span>
          <p className="mt-1 text-lg font-bold text-gray-900">{activeMembersCount}</p>
        </div>
        <div className="rounded-xl bg-white p-3 shadow-sm border border-gray-100 text-center">
          <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">TOTAL REGISTERED</span>
          <p className="mt-1 text-lg font-bold text-gray-900">{total}</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === opt.value ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by consumer name or email..."
        className="input-field w-full"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-3 py-3 font-medium text-gray-500">Consumer</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden sm:table-cell">Status</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Tier</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Donations Count</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden lg:table-cell">Joined</th>
              <th className="px-3 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                  Loading consumers...
                </td>
              </tr>
            ) : filteredConsumers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                  No consumers found.
                </td>
              </tr>
            ) : (
              filteredConsumers.map((c) => {
                const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ") || "Consumer";
                const isFounding = (c.membershipTier || "").toUpperCase().includes("FOUNDING");
                const badge = isFounding ? "FOUNDING" : c.membershipStatus === "ACTIVE" ? "MEMBER" : "NONE";

                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <p className="text-sm font-medium text-gray-800">{fullName}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[badge]}`}>
                        {badge}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell text-xs text-gray-600">
                      {c.membershipTier || "Standard"}
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell text-sm font-semibold text-gray-900">
                      {c.donationsCount || 0}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell text-xs text-gray-400">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelected(c)}
                          className="rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50"
                        >
                          Quick View
                        </button>
                        <Link
                          to={`/admin/users/${c.id}`}
                          className="rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          Profile →
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Consumer Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="text-gray-800 font-medium">{[selected.firstName, selected.lastName].filter(Boolean).join(" ") || "Consumer"}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-800">{selected.email}</span></div>
              <div className="flex justify-between">
                <span className="text-gray-500">Membership Tier</span>
                <span className="text-gray-800">{selected.membershipTier || "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className="text-gray-800">{selected.membershipStatus || "ACTIVE"}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Donations Count</span><span className="font-semibold text-gray-900">{selected.donationsCount || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="text-gray-800">{formatDate(selected.createdAt)}</span></div>
            </div>
            <div className="mt-5 flex justify-end">
              <Link
                to={`/admin/users/${selected.id}`}
                className="rounded-lg bg-primary-600 px-3 py-2 text-sm text-white hover:bg-primary-700"
              >
                Full User Record
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
