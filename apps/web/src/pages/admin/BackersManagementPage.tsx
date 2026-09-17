import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { backerApi } from "@/services/backer.service";
import { BackerBadge, type BackerBadgeTier } from "@/components/hub/BackerBadge";
import { ALL_LOCATIONS } from "@/data/ukHubData";

type TierFilter = "" | "BACKER" | "CITY" | "NATIONAL";

interface BackerRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tier: BackerBadgeTier;
  cityHub: string;
  funnelCode: string;
  totalContributed: number;
  contributionsCount: number;
  badges: string[];
  joinedAt: string;
}

const formatCurrency = (a: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);

const formatDate = (d: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));

const TIER_OPTIONS: { value: TierFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "BACKER", label: "Backer" },
  { value: "CITY", label: "City Hub" },
  { value: "NATIONAL", label: "National" },
];

function generateBackers(): BackerRecord[] {
  const backers: BackerRecord[] = [];
  const cities = ALL_LOCATIONS.filter((l) => l.type === "CITY").map((l) => l.name);

  const names = [
    "Emma Wilson", "Liam Johnson", "Olivia Brown", "Noah Davis", "Ava Taylor",
    "Ethan Anderson", "Sophia Thomas", "Mason Jackson", "Isabella White", "Lucas Harris",
    "Mia Martin", "James Thompson", "Charlotte Garcia", "Benjamin Martinez", "Amelia Robinson",
    "Henry Clark", "Harper Rodriguez", "Alexander Lewis", "Evelyn Lee", "Daniel Walker",
    "Abigail Hall", "Matthew Allen", "Emily Young", "Sebastian King", "Elizabeth Wright",
    "David Scott", "Sofia Green", "Joseph Baker", "Avery Adams", "Samuel Nelson",
  ];

  const tiers: BackerBadgeTier[] = ["BACKER", "CITY", "NATIONAL"];

  names.forEach((name, i) => {
    const parts = name.split(" ");
    const first = parts[0]!;
    const last = parts[1] || "";
    const tier = tiers[i % 3]!;
    const city = cities[i % cities.length]!;
    backers.push({
      id: `backer-${i + 1}`,
      firstName: first,
      lastName: last,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      tier,
      cityHub: city,
      funnelCode: `UKH-${String(100000 + i * 137).slice(0, 6)}`,
      totalContributed: Math.floor(Math.random() * 50000) + 5000,
      contributionsCount: Math.floor(Math.random() * 12) + 1,
      badges: tier === "NATIONAL" ? ["gb", "backer"] : tier === "CITY" ? ["city", "backer"] : ["backer"],
      joinedAt: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    });
  });

  return backers;
}

const ALL_BACKERS = generateBackers();

export function BackersManagementPage() {
  const [tierFilter, setTierFilter] = useState<TierFilter>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<BackerRecord | null>(null);

  const { data: apiData } = useQuery({
    queryKey: ["admin-backers", tierFilter, search],
    queryFn: () => backerApi.getBackers({ page: 1, limit: 20, tier: tierFilter || undefined, search: search || undefined }),
    placeholderData: { backers: [], total: 0, totalPages: 0 },
  });

  const filtered = useMemo(() => {
    // Use API data if available, otherwise fall back to demo
    if (apiData && apiData.backers.length > 0) {
      return apiData.backers.map((b) => ({
        id: b.id,
        firstName: "Backer",
        lastName: "",
        email: "",
        tier: (b.statusType || "BACKER") as BackerBadgeTier,
        cityHub: b.locationName || "N/A",
        funnelCode: `UKH-${b.id.slice(-6)}`,
        totalContributed: 0,
        contributionsCount: 0,
        badges: [],
        joinedAt: b.grantedAt,
      }));
    }
    // Demo fallback
    let list = ALL_BACKERS;
    if (tierFilter) list = list.filter((b) => b.tier === tierFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.firstName.toLowerCase().includes(q) ||
          b.lastName.toLowerCase().includes(q) ||
          b.email.toLowerCase().includes(q) ||
          b.funnelCode.toLowerCase().includes(q)
      );
    }
    return list;
  }, [apiData, tierFilter, search]);

  const tierCounts = useMemo(() => {
    const c: Record<string, number> = { BACKER: 0, CITY: 0, NATIONAL: 0 };
    ALL_BACKERS.forEach((b) => { c[b.tier] = (c[b.tier] || 0) + 1; });
    return c;
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Backers</h1>
          <p className="text-sm text-gray-500">{filtered.length} backer records</p>
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

      {/* Tier Tabs */}
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
        placeholder="Search by name, email, or funnel code..."
        className="input-field w-full"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-3 py-3 font-medium text-gray-500">Backer</th>
              <th className="px-3 py-3 font-medium text-gray-500">Tier</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden sm:table-cell">City Hub</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Funnel Code</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Contributed</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden lg:table-cell">Joined</th>
              <th className="px-3 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                  No backers found.
                </td>
              </tr>
            )}
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-3 py-3">
                  <p className="text-sm font-medium text-gray-800">
                    {b.firstName} {b.lastName}
                  </p>
                  <p className="text-xs text-gray-400">{b.email}</p>
                </td>
                <td className="px-3 py-3">
                  <BackerBadge tier={b.tier} size="sm" />
                </td>
                <td className="px-3 py-3 hidden sm:table-cell text-sm text-gray-600">
                  {b.cityHub}
                </td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                    {b.funnelCode}
                  </span>
                </td>
                <td className="px-3 py-3 hidden md:table-cell text-sm font-semibold text-gray-900">
                  {formatCurrency(b.totalContributed)}
                </td>
                <td className="px-3 py-3 hidden lg:table-cell text-xs text-gray-400">
                  {formatDate(b.joinedAt)}
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => setSelected(b)}
                    className="rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Backer Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Name</span>
                <span className="text-gray-800">{selected.firstName} {selected.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-800">{selected.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tier</span>
                <BackerBadge tier={selected.tier} size="sm" />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">City Hub</span>
                <span className="text-gray-800">{selected.cityHub}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Funnel Code</span>
                <span className="font-mono text-gray-800">{selected.funnelCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Contributed</span>
                <span className="font-semibold text-gray-900">{formatCurrency(selected.totalContributed)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Contributions</span>
                <span className="text-gray-800">{selected.contributionsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Badges</span>
                <span className="text-lg">{selected.badges.join(" ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Joined</span>
                <span className="text-gray-800">{formatDate(selected.joinedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
