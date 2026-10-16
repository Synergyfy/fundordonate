import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { adminApi, type AdminBusiness } from "@/services/admin";
import { formatCurrency, formatDate } from "@/utils/formatters";

type VerificationFilter = "" | "VERIFIED" | "PENDING" | "REJECTED";

const STATUS_COLORS: Record<string, string> = {
  VERIFIED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  REJECTED: "bg-red-100 text-red-700",
};

const STATUS_OPTIONS: { value: VerificationFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "VERIFIED", label: "Verified" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
];

export function BusinessesManagementPage() {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<VerificationFilter>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminBusiness | null>(null);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getBusinesses({
        search: search || undefined,
        verificationStatus: statusFilter || undefined,
      });
      setBusinesses(res.items || res.businesses || []);
      setTotal(res.total || (res.items || []).length);
    } catch {
      setBusinesses([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBusinesses();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchBusinesses]);

  const handleVerify = async (id: string, status: "VERIFIED" | "REJECTED") => {
    try {
      await adminApi.verifyBusiness(id, status);
      await fetchBusinesses();
      if (selected && selected.id === id) {
        setSelected((prev) => (prev ? { ...prev, verificationStatus: status } : null));
      }
    } catch (err) {
      console.error("Failed to update business status:", err);
    }
  };

  const statusCounts = {
    VERIFIED: businesses.filter((b) => b.verificationStatus === "VERIFIED").length,
    PENDING: businesses.filter((b) => b.verificationStatus === "PENDING").length,
    REJECTED: businesses.filter((b) => b.verificationStatus === "REJECTED").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
          <p className="text-sm text-gray-500">{total} registered businesses in platform</p>
        </div>
      </div>

      {/* Status KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {(["VERIFIED", "PENDING", "REJECTED"] as const).map((s) => (
          <div key={s} className="rounded-xl bg-white p-3 shadow-sm border border-gray-100 text-center">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s]}`}>{s}</span>
            <p className="mt-1 text-lg font-bold text-gray-900">{statusCounts[s]}</p>
          </div>
        ))}
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
        placeholder="Search by business name or email..."
        className="input-field w-full"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-3 py-3 font-medium text-gray-500">Business</th>
              <th className="px-3 py-3 font-medium text-gray-500">Category</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden sm:table-cell">City / Address</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Status</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Contributed</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden lg:table-cell">Joined</th>
              <th className="px-3 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                  Loading businesses...
                </td>
              </tr>
            ) : businesses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                  No businesses found.
                </td>
              </tr>
            ) : (
              businesses.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3">
                    <p className="text-sm font-medium text-gray-800">{b.name}</p>
                    <p className="text-xs text-gray-400">{b.membershipTier || "Standard"}</p>
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-600">
                    {b.category || "General"}
                  </td>
                  <td className="px-3 py-3 hidden sm:table-cell text-xs text-gray-600">
                    {b.city || b.address || "—"}
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${(STATUS_COLORS as Record<string, string>)[b.verificationStatus || "unverified"] || "bg-gray-100 text-gray-700"}`}>
                      {b.verificationStatus || "unverified"}
                    </span>
                  </td>
                  <td className="px-3 py-3 hidden md:table-cell text-sm font-semibold text-gray-900">
                    {formatCurrency(b.totalContributed || 0)}
                  </td>
                  <td className="px-3 py-3 hidden lg:table-cell text-xs text-gray-400">
                    {formatDate(b.createdAt)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/admin/businesses/${b.id}`} className="rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50">
                        Details
                      </Link>
                      {b.verificationStatus === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleVerify(b.id, "VERIFIED")}
                            className="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleVerify(b.id, "REJECTED")}
                            className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Business Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Business</span><span className="text-gray-800 font-medium">{selected.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">City / Location</span><span className="text-gray-800">{selected.city || "—"}</span></div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${(STATUS_COLORS as Record<string, string>)[selected.verificationStatus || "unverified"] || "bg-gray-100 text-gray-700"}`}>
                  {selected.verificationStatus || "unverified"}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Total Contributed</span><span className="font-semibold text-gray-900">{formatCurrency(selected.totalContributed || 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Membership Tier</span><span className="text-gray-800">{selected.membershipTier || "None"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="text-gray-800">{formatDate(selected.createdAt)}</span></div>
            </div>
            {selected.verificationStatus === "PENDING" && (
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => handleVerify(selected.id, "VERIFIED")}
                  className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
                >
                  Verify
                </button>
                <button
                  onClick={() => handleVerify(selected.id, "REJECTED")}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
