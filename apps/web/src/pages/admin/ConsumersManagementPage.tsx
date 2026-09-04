import { useState, useMemo } from "react";
import { ALL_LOCATIONS } from "@/data/ukHubData";

type FoundingFilter = "" | "FOUNDING" | "MEMBER" | "NONE";

interface ConsumerRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  foundingStatus: "FOUNDING" | "MEMBER" | "NONE";
  cityHub: string;
  totalContributed: number;
  contributionsCount: number;
  walletBalance: number;
  joinedAt: string;
}

const formatCurrency = (a: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);

const formatDate = (d: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));

const STATUS_COLORS: Record<string, string> = {
  FOUNDING: "bg-amber-100 text-amber-700",
  MEMBER: "bg-green-100 text-green-700",
  NONE: "bg-gray-100 text-gray-600",
};

const STATUS_OPTIONS: { value: FoundingFilter; label: string }[] = [
  { value: "", label: "All" },
  { value: "FOUNDING", label: "Founding" },
  { value: "MEMBER", label: "Member" },
  { value: "NONE", label: "None" },
];

function generateConsumers(): ConsumerRecord[] {
  const consumers: ConsumerRecord[] = [];
  const cities = ALL_LOCATIONS.filter((l) => l.type === "CITY").map((l) => l.name);

  const firstNames = ["Sophie", "James", "Emily", "Oliver", "Chloe", "Harry", "Jessica", "George", "Megan", "Jack", "Lucy", "Thomas", "Grace", "Daniel", "Evie", "Alfie", "Poppy", "Oscar", "Ruby", "Leo", "Isla", "Freddie", "Daisy", "Archie", "Maisie", "Charlie", "Rosie", "Max", "Willow", "Finn"];
  const lastNames = ["Clarke", "Mitchell", "Roberts", "Scott", "Evans", "Palmer", "Baker", "Collins", "Stewart", "Morgan", "Cooper", "Reed", "Murphy", "Hughes", "Ward", "Brooks", "Sanders", "Price", "Bailey", "Kelly", "Russell", "Cook", "Griffin", "Wood", "Barnes", "Kennedy", "Francis", "Gibson", "Stone", "Murray"];

  const statuses: Array<"FOUNDING" | "MEMBER" | "NONE"> = ["FOUNDING", "MEMBER", "NONE"];

  firstNames.forEach((first, i) => {
    const last = lastNames[i] || "";
    const city = cities[i % cities.length]!;
    const status = statuses[i % 3]!;

    consumers.push({
      id: `cons-${i + 1}`,
      firstName: first,
      lastName: last,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
      foundingStatus: status,
      cityHub: city,
      totalContributed: Math.floor(Math.random() * 15000) + 1000,
      contributionsCount: Math.floor(Math.random() * 8) + 1,
      walletBalance: Math.floor(Math.random() * 5000),
      joinedAt: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    });
  });

  return consumers;
}

const ALL_CONSUMERS = generateConsumers();

export function ConsumersManagementPage() {
  const [foundingFilter, setFoundingFilter] = useState<FoundingFilter>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ConsumerRecord | null>(null);

  const filtered = useMemo(() => {
    let list = ALL_CONSUMERS;
    if (foundingFilter) list = list.filter((c) => c.foundingStatus === foundingFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [foundingFilter, search]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { FOUNDING: 0, MEMBER: 0, NONE: 0 };
    ALL_CONSUMERS.forEach((x) => { c[x.foundingStatus] = (c[x.foundingStatus] || 0) + 1; });
    return c;
  }, []);

  const totalWallet = useMemo(() => ALL_CONSUMERS.reduce((s, c) => s + c.walletBalance, 0), []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consumers</h1>
          <p className="text-sm text-gray-500">{filtered.length} registered consumers</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["FOUNDING", "MEMBER", "NONE"] as const).map((s) => (
          <div key={s} className="rounded-xl bg-white p-3 shadow-sm border border-gray-100 text-center">
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s]}`}>{s === "NONE" ? "No Status" : s === "FOUNDING" ? "Founding" : "Member"}</span>
            <p className="mt-1 text-lg font-bold text-gray-900">{statusCounts[s]}</p>
          </div>
        ))}
        <div className="rounded-xl bg-white p-3 shadow-sm border border-gray-100 text-center">
          <span className="text-xs text-gray-500">Total Wallet</span>
          <p className="mt-1 text-lg font-bold text-gray-900">{formatCurrency(totalWallet)}</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFoundingFilter(opt.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              foundingFilter === opt.value ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
        placeholder="Search by name or email..."
        className="input-field w-full"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-3 py-3 font-medium text-gray-500">Consumer</th>
              <th className="px-3 py-3 font-medium text-gray-500">Founding Status</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden sm:table-cell">City Hub</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Contributed</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Wallet</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden lg:table-cell">Joined</th>
              <th className="px-3 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                  No consumers found.
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-3 py-3">
                  <p className="text-sm font-medium text-gray-800">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-gray-400">{c.email}</p>
                </td>
                <td className="px-3 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.foundingStatus]}`}>
                    {c.foundingStatus === "NONE" ? "No Status" : c.foundingStatus}
                  </span>
                </td>
                <td className="px-3 py-3 hidden sm:table-cell text-sm text-gray-600">
                  {c.cityHub}
                </td>
                <td className="px-3 py-3 hidden md:table-cell text-sm font-semibold text-gray-900">
                  {formatCurrency(c.totalContributed)}
                </td>
                <td className="px-3 py-3 hidden md:table-cell text-sm text-gray-600">
                  {formatCurrency(c.walletBalance)}
                </td>
                <td className="px-3 py-3 hidden lg:table-cell text-xs text-gray-400">
                  {formatDate(c.joinedAt)}
                </td>
                <td className="px-3 py-3">
                  <button
                    onClick={() => setSelected(c)}
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
              <h2 className="text-lg font-semibold text-gray-900">Consumer Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="text-gray-800">{selected.firstName} {selected.lastName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-800">{selected.email}</span></div>
              <div className="flex justify-between">
                <span className="text-gray-500">Founding Status</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[selected.foundingStatus]}`}>
                  {selected.foundingStatus === "NONE" ? "No Status" : selected.foundingStatus}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">City Hub</span><span className="text-gray-800">{selected.cityHub}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Contributed</span><span className="font-semibold text-gray-900">{formatCurrency(selected.totalContributed)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Contributions</span><span className="text-gray-800">{selected.contributionsCount}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Wallet Balance</span><span className="text-gray-800">{formatCurrency(selected.walletBalance)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="text-gray-800">{formatDate(selected.joinedAt)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
