import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { adminApi, type AdminBacker } from "@/services/admin";
import { BackerBadge, type BackerBadgeTier } from "@/components/hub/BackerBadge";
import { formatCurrency, formatDate } from "@/utils/formatters";

type TierFilter = "" | "BACKER" | "CITY" | "NATIONAL";

const TIER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "BACKER", label: "Backer" },
  { value: "CITY", label: "City Hub" },
  { value: "NATIONAL", label: "National" },
];

export function BackersManagementPage() {
  const [backers, setBackers] = useState<AdminBacker[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tierFilter, setTierFilter] = useState<TierFilter>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminBacker | null>(null);

  const fetchBackers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBackers({
        search: search || undefined,
        tier: tierFilter || undefined,
      });
      setBackers(res.items || (res as any).backers || []);
      setTotal(res.total || (res.items || []).length);
    } catch {
      setBackers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, tierFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBackers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchBackers]);

  const tierCounts = {
    BACKER: backers.filter((b) => (b.membershipTier || "").toUpperCase().includes("BACKER") || !b.membershipTier).length,
    CITY: backers.filter((b) => (b.membershipTier || "").toUpperCase().includes("CITY")).length,
    NATIONAL: backers.filter((b) => (b.membershipTier || "").toUpperCase().includes("NATIONAL")).length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Backers</h1>
          <p className="text-sm text-gray-500">{total} active backer records in system</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-3 gap-3">
        {(["BACKER", "CITY", "NATIONAL"] as const).map((t) => (
          <div key={t} className="rounded-xl bg-white p-3 shadow-sm border border-gray-100 text-center">
            <BackerBadge tier={t} size="sm" />
            <p className="mt-1 text-lg font-bold text-gray-900">{tierCounts[t]}</p>
          </div>
        ))}
      </div>

      {/* Tier Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {TIER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTierFilter(opt.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              tierFilter === opt.value ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
        placeholder="Search by backer name or email..."
        className="input-field w-full"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-3 py-3 font-medium text-gray-500">Backer</th>
              <th className="px-3 py-3 font-medium text-gray-500">Badge Tier</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Contributed</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden sm:table-cell">Contributions</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden lg:table-cell">Joined</th>
              <th className="px-3 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                  Loading backers...
                </td>
              </tr>
            ) : backers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                  No backer records found.
                </td>
              </tr>
            ) : (
              backers.map((b) => {
                const fullName = [b.firstName, b.lastName].filter(Boolean).join(" ") || "Backer";
                const tier = (
                  (b.membershipTier || "").toUpperCase().includes("NATIONAL") ? "NATIONAL" :
                  (b.membershipTier || "").toUpperCase().includes("CITY") ? "CITY" : "BACKER"
                ) as BackerBadgeTier;

                return (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <p className="text-sm font-medium text-gray-800">{fullName}</p>
                      <p className="text-xs text-gray-400">{b.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <BackerBadge tier={tier} size="sm" />
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell text-sm font-semibold text-gray-900">
                      {formatCurrency(b.totalContributed || 0)}
                    </td>
                    <td className="px-3 py-3 hidden sm:table-cell text-xs text-gray-600">
                      {b.contributionsCount || 0}
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell text-xs text-gray-400">
                      {formatDate(b.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelected(b)}
                          className="rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50"
                        >
                          Quick View
                        </button>
                        <Link
                          to={`/admin/users/${b.id}`}
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
              <h2 className="text-lg font-semibold text-gray-900">Backer Profile</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="text-gray-800 font-medium">{[selected.firstName, selected.lastName].filter(Boolean).join(" ") || "Backer"}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-800">{selected.email}</span></div>
              <div className="flex justify-between">
                <span className="text-gray-500">Badge Tier</span>
                <span className="text-gray-800 font-medium">{selected.membershipTier || "BACKER"}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Total Contributed</span><span className="font-semibold text-gray-900">{formatCurrency(selected.totalContributed || 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Contributions Count</span><span className="text-gray-800">{selected.contributionsCount || 0}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Member Since</span><span className="text-gray-800">{formatDate(selected.createdAt)}</span></div>
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
