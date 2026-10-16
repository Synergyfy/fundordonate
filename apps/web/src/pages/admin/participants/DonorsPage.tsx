import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Search, Users, HeartHandshake, Crown, TrendingUp, Loader2 } from "lucide-react";
import { useAdminBackers } from "@/services/admin/hook";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

interface DonorItem {
  id: string;
  name: string;
  email: string;
  city: string;
  donations: number;
  total: number;
  founding: boolean;
  lastDonation: string;
}

export function DonorsPage() {
  const [search, setSearch] = useState("");
  const [foundingOnly, setFoundingOnly] = useState(false);

  const { data, isLoading, isError } = useAdminBackers({
    search: search.trim() || undefined,
  });

  const rawItems: DonorItem[] = useMemo(() => {
    const list = data?.items ?? (data as any)?.backers ?? [];
    return list.map((b: any): DonorItem => {
      const name = [b.firstName, b.lastName].filter(Boolean).join(" ") || b.email.split("@")[0];
      const isFounding = Boolean(b.membershipTier && b.membershipTier.toUpperCase().includes("FOUNDING"));
      return {
        id: b.id,
        name,
        email: b.email,
        city: b.city || "—",
        donations: b.contributionsCount || 0,
        total: b.totalContributed || 0,
        founding: isFounding,
        lastDonation: b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-GB") : "—",
      };
    });
  }, [data]);

  const filtered: DonorItem[] = useMemo(() => {
    return rawItems.filter((d: DonorItem) => {
      if (foundingOnly && !d.founding) return false;
      return true;
    });
  }, [rawItems, foundingOnly]);

  const stats = useMemo(() => {
    const total = rawItems.reduce((s: number, d: any) => s + d.total, 0);
    const donations = rawItems.reduce((s: number, d: any) => s + d.donations, 0);
    return {
      donors: data?.total ?? rawItems.length,
      donations,
      total,
      founding: rawItems.filter((d: any) => d.founding).length,
      avg: donations > 0 ? Math.round(total / donations) : 0,
    };
  }, [rawItems, data]);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-gray-900">Donors</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Donors</h1>
        <p className="text-sm text-gray-500">Consumers who have made monetary contributions across campaigns.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500"><Users className="h-3.5 w-3.5" /> Donors</div>
          <div className="mt-1.5 text-xl font-bold text-gray-900">{stats.donors}</div>
          <div className="text-xs text-gray-400">Active this season</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500"><HeartHandshake className="h-3.5 w-3.5" /> Donations</div>
          <div className="mt-1.5 text-xl font-bold text-gray-900">{stats.donations}</div>
          <div className="text-xs text-gray-400">{fmt(stats.total)} raised</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500"><TrendingUp className="h-3.5 w-3.5" /> Average gift</div>
          <div className="mt-1.5 text-xl font-bold text-gray-900">{fmt(stats.avg)}</div>
          <div className="text-xs text-gray-400">Per donation</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500"><Crown className="h-3.5 w-3.5" /> Founding donors</div>
          <div className="mt-1.5 text-xl font-bold text-gray-900">{stats.founding}</div>
          <div className="text-xs text-gray-400">Founding Members programme</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search donors…"
            className="w-72 rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm focus:border-primary-500 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setFoundingOnly((v) => !v)}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${
            foundingOnly ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Founding members only
        </button>
        <Link to="/admin/founding-members" className="ml-auto text-xs font-medium text-primary-600 hover:text-primary-700">
          Founding Members →
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">Donor</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Donations</th>
              <th className="px-4 py-3">Total given</th>
              <th className="px-4 py-3">Last donation</th>
              <th className="px-4 py-3">Member</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                    <span>Loading donors...</span>
                  </div>
                </td>
              </tr>
            )}
            {isError && !isLoading && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-red-500">
                  Failed to load donors from server.
                </td>
              </tr>
            )}
            {!isLoading && !isError && filtered.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                      {d.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </span>
                    <span className="font-medium text-gray-900">{d.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500">{d.email}</td>
                <td className="px-4 py-3 text-gray-500">{d.city}</td>
                <td className="px-4 py-3 text-gray-500">{d.donations}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{fmt(d.total)}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{d.lastDonation}</td>
                <td className="px-4 py-3">
                  {d.founding ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Founding</span>
                  ) : (
                    <span className="text-xs text-gray-400">Standard</span>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && !isError && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No donors match.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
