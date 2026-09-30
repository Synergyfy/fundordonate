import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Download, BarChart3, FileText } from "lucide-react";
import { CampaignStatusBadge } from "@/components/ui/CampaignStatusBadge";
import { getAdminCampaigns, summarizeCoverage } from "@/data/adminCampaigns";

const fmt = (p: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(p / 100);

type ReportTab = "business" | "consumer" | "funding" | "campaigns" | "rewards";

const TABS: { id: ReportTab; label: string; path: string }[] = [
  { id: "business", label: "Business Reports", path: "/admin/reports/business" },
  { id: "consumer", label: "Consumer Reports", path: "/admin/reports/consumer" },
  { id: "funding", label: "Funding Reports", path: "/admin/reports/funding" },
  { id: "campaigns", label: "Campaign Reports", path: "/admin/reports/campaigns" },
  { id: "rewards", label: "Reward Reports", path: "/admin/reports/rewards" },
];

interface BusinessReportRow {
  business: string;
  owner: string;
  city: string;
  campaigns: number;
  contributed: number; // pence
  rewardsIssued: number;
  status: "active" | "review" | "inactive";
}

const BUSINESS_ROWS: BusinessReportRow[] = [
  { business: "Sarah's Bakery", owner: "Sarah Chen", city: "London", campaigns: 3, contributed: 450_000, rewardsIssued: 62, status: "active" },
  { business: "Northern Brew Co", owner: "James Wilson", city: "Manchester", campaigns: 2, contributed: 320_000, rewardsIssued: 48, status: "active" },
  { business: "Green Grocer Ltd", owner: "Amelia Foster", city: "Birmingham", campaigns: 2, contributed: 210_000, rewardsIssued: 35, status: "active" },
  { business: "Campus Tech Store", owner: "Grace Okoro", city: "Leeds", campaigns: 1, contributed: 150_000, rewardsIssued: 22, status: "review" },
  { business: "City Arts Trust", owner: "Noah Patel", city: "Bristol", campaigns: 1, contributed: 95_000, rewardsIssued: 14, status: "active" },
  { business: "Hillside Cafe", owner: "Oliver Smith", city: "Birmingham", campaigns: 1, contributed: 40_000, rewardsIssued: 6, status: "inactive" },
];

interface ConsumerReportRow {
  segment: string;
  consumers: number;
  donations: number; // count
  raised: number; // pence
  pledges: number;
  founding: number;
}

const CONSUMER_ROWS: ConsumerReportRow[] = [
  { segment: "New this season", consumers: 1_240, donations: 2_105, raised: 8_450_000, pledges: 640, founding: 120 },
  { segment: "Returning", consumers: 860, donations: 3_980, raised: 21_300_000, pledges: 1_120, founding: 210 },
  { segment: "Founding Members", consumers: 330, donations: 1_450, raised: 9_600_000, pledges: 410, founding: 330 },
  { segment: "Lapsed (>90 days)", consumers: 415, donations: 0, raised: 0, pledges: 0, founding: 45 },
];

interface RewardReportRow {
  reward: string;
  type: string;
  issued: number;
  fulfilled: number;
  pending: number;
  value: number; // pence
}

const REWARD_ROWS: RewardReportRow[] = [
  { reward: "£5 E-Gift Card", type: "e-gift", issued: 420, fulfilled: 402, pending: 18, value: 210_000 },
  { reward: "£10 E-Gift Card", type: "e-gift", issued: 260, fulfilled: 245, pending: 15, value: 260_000 },
  { reward: "Free Coffee Voucher", type: "voucher", issued: 310, fulfilled: 298, pending: 12, value: 108_500 },
  { reward: "Branded Tote Bag", type: "merch", issued: 150, fulfilled: 131, pending: 19, value: 180_000 },
  { reward: "Event Ticket", type: "experience", issued: 85, fulfilled: 74, pending: 11, value: 212_500 },
];

function toCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.map(escape).join(","), ...rows.map((r) => r.map(escape).join(","))].join("\n");
}

function useExportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  return () => {
    const blob = new Blob([toCsv(headers, rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
}

function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-sm font-semibold text-gray-900">{children}</h2>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1.5 text-xl font-bold text-gray-900">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-gray-400">{hint}</div>}
    </div>
  );
}

export function ReportsPage({ tab }: { tab: ReportTab }) {
  const navigate = useNavigate();
  const campaigns = useMemo(() => getAdminCampaigns(), []);

  const exportBusiness = useExportCsv(
    "business-reports.csv",
    ["Business", "Owner", "City", "Campaigns", "Contributed (pence)", "Rewards issued", "Status"],
    BUSINESS_ROWS.map((r) => [r.business, r.owner, r.city, r.campaigns, r.contributed, r.rewardsIssued, r.status])
  );
  const exportConsumer = useExportCsv(
    "consumer-reports.csv",
    ["Segment", "Consumers", "Donations", "Raised (pence)", "Pledges", "Founding members"],
    CONSUMER_ROWS.map((r) => [r.segment, r.consumers, r.donations, r.raised, r.pledges, r.founding])
  );
  const exportRewards = useExportCsv(
    "reward-reports.csv",
    ["Reward", "Type", "Issued", "Fulfilled", "Pending", "Value (pence)"],
    REWARD_ROWS.map((r) => [r.reward, r.type, r.issued, r.fulfilled, r.pending, r.value])
  );

  const fundingTotals = useMemo(() => {
    const raised = campaigns.reduce((s, c) => s + c.raisedAmount, 0);
    const target = campaigns.reduce((s, c) => s + c.targetAmount, 0);
    return { raised, target, pct: target > 0 ? Math.round((raised / target) * 100) : 0 };
  }, [campaigns]);

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/admin" className="hover:text-gray-700">Admin</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-gray-900">Reports</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500">Operational reporting across business, consumer, funding, campaign and reward activity.</p>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 pb-px">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(t.path)}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? "border-primary-600 text-primary-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── BUSINESS ── */}
      {tab === "business" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle hint={`${BUSINESS_ROWS.length} businesses`}>Business Performance</SectionTitle>
            <button onClick={exportBusiness} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Business</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Campaigns</th>
                  <th className="px-4 py-3">Contributed</th>
                  <th className="px-4 py-3">Rewards</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {BUSINESS_ROWS.map((r) => (
                  <tr key={r.business} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.business}</td>
                    <td className="px-4 py-3 text-gray-500">{r.owner}</td>
                    <td className="px-4 py-3 text-gray-500">{r.city}</td>
                    <td className="px-4 py-3 text-gray-500">{r.campaigns}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{fmt(r.contributed)}</td>
                    <td className="px-4 py-3 text-gray-500">{r.rewardsIssued}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.status === "active" ? "bg-green-100 text-green-700" : r.status === "review" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CONSUMER ── */}
      {tab === "consumer" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle hint="By donor segment">Consumer Participation</SectionTitle>
            <button onClick={exportConsumer} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label="Active consumers" value={CONSUMER_ROWS.slice(0, 3).reduce((s, r) => s + r.consumers, 0).toLocaleString("en-GB")} hint="Excludes lapsed" />
            <Kpi label="Total raised" value={fmt(CONSUMER_ROWS.reduce((s, r) => s + r.raised, 0))} hint="Across segments" />
            <Kpi label="Open pledges" value={CONSUMER_ROWS.reduce((s, r) => s + r.pledges, 0).toLocaleString("en-GB")} hint="Awaiting fulfilment" />
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Segment</th>
                  <th className="px-4 py-3">Consumers</th>
                  <th className="px-4 py-3">Donations</th>
                  <th className="px-4 py-3">Raised</th>
                  <th className="px-4 py-3">Pledges</th>
                  <th className="px-4 py-3">Founding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {CONSUMER_ROWS.map((r) => (
                  <tr key={r.segment} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.segment}</td>
                    <td className="px-4 py-3 text-gray-500">{r.consumers.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-3 text-gray-500">{r.donations.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{fmt(r.raised)}</td>
                    <td className="px-4 py-3 text-gray-500">{r.pledges.toLocaleString("en-GB")}</td>
                    <td className="px-4 py-3 text-gray-500">{r.founding}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link to="/admin/donors" className="text-xs font-medium text-primary-600 hover:text-primary-700">Full donor list →</Link>
        </div>
      )}

      {/* ── FUNDING ── */}
      {tab === "funding" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle hint="Season to date">Funding Summary</SectionTitle>
            <Link to="/admin/funding" className="text-xs font-medium text-primary-600 hover:text-primary-700">Open Funding workspace →</Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Kpi label="Raised" value={fmt(fundingTotals.raised)} hint={`${fundingTotals.pct}% of target`} />
            <Kpi label="Target" value={fmt(fundingTotals.target)} hint={`${campaigns.length} campaigns`} />
            <Kpi label="Average campaign" value={fmt(campaigns.length > 0 ? Math.round(fundingTotals.raised / campaigns.length) : 0)} hint="Per campaign" />
            <Kpi label="Top campaign" value={fmt(campaigns.reduce((m, c) => Math.max(m, c.raisedAmount), 0))} hint="Highest raised" />
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Raised</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...campaigns]
                  .sort((a, b) => b.raisedAmount - a.raisedAmount)
                  .map((c) => {
                    const pct = c.targetAmount > 0 ? Math.min(100, Math.round((c.raisedAmount / c.targetAmount) * 100)) : 0;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.title}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{fmt(c.raisedAmount)}</td>
                        <td className="px-4 py-3 text-gray-500">{fmt(c.targetAmount)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-100">
                              <div className="h-full rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-400">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CAMPAIGNS ── */}
      {tab === "campaigns" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle hint={`${campaigns.length} campaigns`}>Campaign Performance</SectionTitle>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const blob = new Blob(
                    [toCsv(
                      ["Campaign", "Status", "Audience", "City", "Raised (pence)", "Target (pence)", "Coverage"],
                      campaigns.map((c) => [c.title, c.status, c.audience, c.cityName, c.raisedAmount, c.targetAmount, summarizeCoverage(c)])
                    )],
                    { type: "text/csv;charset=utf-8" }
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "campaign-reports.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
              <Link to="/admin/campaigns" className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <FileText className="h-3.5 w-3.5" /> All campaigns
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Campaign</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Audience</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Raised</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Coverage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/admin/campaigns/${c.id}`} className="font-medium text-gray-900 hover:text-primary-600">{c.title}</Link>
                    </td>
                    <td className="px-4 py-3"><CampaignStatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 capitalize text-gray-500">{c.audience}</td>
                    <td className="px-4 py-3 text-gray-500">{c.cityName}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{fmt(c.raisedAmount)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmt(c.targetAmount)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{summarizeCoverage(c)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REWARDS ── */}
      {tab === "rewards" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle hint="Issued vs fulfilled">Reward Reports</SectionTitle>
            <div className="flex gap-2">
              <button onClick={exportRewards} className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
              <Link to="/admin/rewards/fulfilment" className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <BarChart3 className="h-3.5 w-3.5" /> Fulfilment queue
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Kpi label="Rewards issued" value={REWARD_ROWS.reduce((s, r) => s + r.issued, 0).toLocaleString("en-GB")} hint="Season to date" />
            <Kpi label="Fulfilled" value={REWARD_ROWS.reduce((s, r) => s + r.fulfilled, 0).toLocaleString("en-GB")} hint={`${Math.round((REWARD_ROWS.reduce((s, r) => s + r.fulfilled, 0) / REWARD_ROWS.reduce((s, r) => s + r.issued, 0)) * 100)}% fulfilment rate`} />
            <Kpi label="Reward value" value={fmt(REWARD_ROWS.reduce((s, r) => s + r.value, 0))} hint="Issued value" />
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Reward</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Issued</th>
                  <th className="px-4 py-3">Fulfilled</th>
                  <th className="px-4 py-3">Pending</th>
                  <th className="px-4 py-3">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {REWARD_ROWS.map((r) => (
                  <tr key={r.reward} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.reward}</td>
                    <td className="px-4 py-3 text-gray-500">{r.type}</td>
                    <td className="px-4 py-3 text-gray-500">{r.issued}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{r.fulfilled}</td>
                    <td className="px-4 py-3 text-gray-500">{r.pending}</td>
                    <td className="px-4 py-3 text-gray-900">{fmt(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
