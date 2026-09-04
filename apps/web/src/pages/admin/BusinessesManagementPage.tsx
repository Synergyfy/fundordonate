import { useState, useMemo } from "react";
import { DEMO_CAMPAIGNS } from "@/data/demo";
import { ALL_LOCATIONS } from "@/data/ukHubData";

type VerificationFilter = "" | "VERIFIED" | "PENDING" | "REJECTED";

interface BusinessRecord {
  id: string;
  businessName: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  verificationStatus: "VERIFIED" | "PENDING" | "REJECTED";
  cityHub: string;
  participatingIn: string[];
  totalContributed: number;
  backerTier: string;
  joinedAt: string;
}

const formatCurrency = (a: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(a / 100);

const formatDate = (d: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(d));

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

function generateBusinesses(): BusinessRecord[] {
  const businesses: BusinessRecord[] = [];
  const cities = ALL_LOCATIONS.filter((l) => l.type === "CITY").map((l) => l.name);
  const businessCampaigns = DEMO_CAMPAIGNS.filter(
    (c) => c.category?.slug === "business" || c.backerTiersEnabled
  );

  const businessNames = [
    "Camden Coffee House", "Islington Tech Solutions", "Hackney Bike Co",
    "Westminster Legal Services", "Southwark Art Gallery", "Lambeth Fitness Hub",
    "Greenwich Marine Supplies", "Tower Hamlets Catering", "Croydon Auto Repair",
    "Sutton Garden Centre", "Merton Plumbing Ltd", "Kingston Electronics",
    "Richmond Bookshop", "Hounslow Dental Practice", "Ealing Yoga Studio",
    "Harrow Photography", "Barnet Plumbing", "Haringey Florist",
    "Enfield Hardware", "Waltham Forest Bakery", "Redbridge Pharmacy",
    "Barking Dental", "Havering Pet Store", "Hillingdon Travel Agent",
    "Brent Interior Design", "Hammersmith Furniture", "Kensington Jewellers",
    "Newham Grocers", "Lewisham Sports Shop", "Bexley Opticians",
    "Bromley Music Store", "Manchester Bakers", "Birmingham Electronics",
    "Leeds Furniture Store", "Liverpool Florist", "Bristol Bookshop",
    "Glasgow Coffee Roasters", "Edinburgh Bakery", "Bradford Textiles",
    "Sheffield Metal Works", "Newcastle Bike Shop", "Nottingham Tea Room",
  ];

  const statuses: Array<"VERIFIED" | "PENDING" | "REJECTED"> = ["VERIFIED", "PENDING", "REJECTED"];
  const tiers = ["Standard", "City Hub Backer", "National Backer"];

  const firstNames = ["Emma", "Liam", "Olivia", "Noah", "Ava", "Ethan", "Sophia", "Mason", "Isabella", "Lucas"];
  const lastNames = ["Wilson", "Johnson", "Brown", "Davis", "Taylor", "Anderson", "Thomas", "Jackson", "White", "Harris"];

  businessNames.forEach((biz, i) => {
    const ownerFirst = firstNames[i % firstNames.length]!;
    const ownerLast = lastNames[i % lastNames.length]!;
    const city = cities[i % cities.length]!;
    const status = statuses[i % 3]!;
    const campaignCount = Math.floor(Math.random() * 3) + 1;
    const campaignSlice = businessCampaigns.slice(i % businessCampaigns.length, i % businessCampaigns.length + campaignCount);
    const campaigns = campaignSlice.length > 0 ? campaignSlice.map((c) => c.title) : ["No campaigns"];

    businesses.push({
      id: `biz-${i + 1}`,
      businessName: biz,
      ownerFirstName: ownerFirst,
      ownerLastName: ownerLast,
      ownerEmail: `${ownerFirst.toLowerCase()}.${ownerLast.toLowerCase()}@${biz.toLowerCase().replace(/\s+/g, "")}.com`,
      verificationStatus: status,
      cityHub: city,
      participatingIn: campaigns,
      totalContributed: Math.floor(Math.random() * 80000) + 10000,
      backerTier: tiers[i % 3]!,
      joinedAt: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
    });
  });

  return businesses;
}

const ALL_BUSINESSES = generateBusinesses();

export function BusinessesManagementPage() {
  const [statusFilter, setStatusFilter] = useState<VerificationFilter>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<BusinessRecord | null>(null);

  const filtered = useMemo(() => {
    let list = ALL_BUSINESSES;
    if (statusFilter) list = list.filter((b) => b.verificationStatus === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.businessName.toLowerCase().includes(q) ||
          b.ownerFirstName.toLowerCase().includes(q) ||
          b.ownerLastName.toLowerCase().includes(q) ||
          b.ownerEmail.toLowerCase().includes(q)
      );
    }
    return list;
  }, [statusFilter, search]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { VERIFIED: 0, PENDING: 0, REJECTED: 0 };
    ALL_BUSINESSES.forEach((b) => { c[b.verificationStatus] = (c[b.verificationStatus] || 0) + 1; });
    return c;
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Businesses</h1>
          <p className="text-sm text-gray-500">{filtered.length} registered businesses</p>
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
        placeholder="Search by business name, owner, or email..."
        className="input-field w-full"
      />

      {/* Table */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm border border-gray-100">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="px-3 py-3 font-medium text-gray-500">Business</th>
              <th className="px-3 py-3 font-medium text-gray-500">Owner</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden sm:table-cell">City Hub</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Status</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden md:table-cell">Contributed</th>
              <th className="px-3 py-3 font-medium text-gray-500 hidden lg:table-cell">Joined</th>
              <th className="px-3 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-gray-400">
                  No businesses found.
                </td>
              </tr>
            )}
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-3 py-3">
                  <p className="text-sm font-medium text-gray-800">{b.businessName}</p>
                  <p className="text-xs text-gray-400">{b.backerTier}</p>
                </td>
                <td className="px-3 py-3">
                  <p className="text-sm text-gray-800">{b.ownerFirstName} {b.ownerLastName}</p>
                  <p className="text-xs text-gray-400">{b.ownerEmail}</p>
                </td>
                <td className="px-3 py-3 hidden sm:table-cell text-sm text-gray-600">
                  {b.cityHub}
                </td>
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[b.verificationStatus]}`}>
                    {b.verificationStatus}
                  </span>
                </td>
                <td className="px-3 py-3 hidden md:table-cell text-sm font-semibold text-gray-900">
                  {formatCurrency(b.totalContributed)}
                </td>
                <td className="px-3 py-3 hidden lg:table-cell text-xs text-gray-400">
                  {formatDate(b.joinedAt)}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setSelected(b)} className="rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50">
                      Details
                    </button>
                    {b.verificationStatus === "PENDING" && (
                      <>
                        <button className="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50">Verify</button>
                        <button className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">Reject</button>
                      </>
                    )}
                  </div>
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
              <h2 className="text-lg font-semibold text-gray-900">Business Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Business</span><span className="text-gray-800 font-medium">{selected.businessName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Owner</span><span className="text-gray-800">{selected.ownerFirstName} {selected.ownerLastName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="text-gray-800">{selected.ownerEmail}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">City Hub</span><span className="text-gray-800">{selected.cityHub}</span></div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[selected.verificationStatus]}`}>{selected.verificationStatus}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Total Contributed</span><span className="font-semibold text-gray-900">{formatCurrency(selected.totalContributed)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Backer Tier</span><span className="text-gray-800">{selected.backerTier}</span></div>
              <div>
                <span className="text-gray-500">Participating In</span>
                <div className="mt-1 space-y-1">
                  {selected.participatingIn.map((c, i) => (
                    <p key={i} className="text-xs text-gray-700 bg-gray-50 rounded px-2 py-1">{c}</p>
                  ))}
                </div>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="text-gray-800">{formatDate(selected.joinedAt)}</span></div>
            </div>
            {selected.verificationStatus === "PENDING" && (
              <div className="mt-5 flex gap-2">
                <button className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700">Verify</button>
                <button className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700">Reject</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
