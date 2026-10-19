// =============================================================================
// Admin — Analytics & Reporting sections
// =============================================================================

import { useEffect, useState } from "react";
import { adminApi } from "@/services/admin";
import {
  AdminPageHeader,
  AdminLoading,
  AdminError,
  AdminEmpty,
  AdminTable,
  StatCard,
  StatusPill,
  fmtGbp,
  fmtDate,
} from "./shared";

// ─── Seasonal Performance ───────────────────────────────────────────────────

export function SeasonalPerformancePage() {
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    adminApi
      .getSeasons({ limit: 50 })
      .then((res) => {
        setSeasons(res.items ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(load, []);

  if (loading) return <AdminLoading />;
  if (error) return <AdminError onRetry={load} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Seasonal Performance" description="Performance across seasons." />
      {seasons.length === 0 ? (
        <AdminEmpty message="No seasons recorded yet." />
      ) : (
        <AdminTable columns={["Season", "Status", "Raised", "Target", "Campaigns", "Participants"]}>
          {seasons.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
              <td className="px-4 py-3">
                <StatusPill status={String(s.status)} />
              </td>
              <td className="px-4 py-3 font-semibold text-gray-900">{fmtGbp(s.totalRaised ?? 0)}</td>
              <td className="px-4 py-3 text-gray-500">{fmtGbp(s.overallTarget ?? 0)}</td>
              <td className="px-4 py-3 text-gray-500">{s.activeCampaigns ?? 0}</td>
              <td className="px-4 py-3 text-gray-500">{s.totalParticipants ?? 0}</td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}

// ─── Activation Performance ─────────────────────────────────────────────────

export function ActivationPerformancePage() {
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    adminApi
      .getLocations({ type: "CITY", limit: 100 })
      .then((res) => {
        setCities(res.items ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(load, []);

  if (loading) return <AdminLoading />;
  if (error) return <AdminError onRetry={load} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Activation Performance" description="UK activation metrics by city." />
      <StatCard label="Cities" value={cities.length} />
      {cities.length === 0 ? (
        <AdminEmpty message="No city locations configured." />
      ) : (
        <AdminTable columns={["City", "Status", "Target", "Businesses", "Campaigns"]}>
          {cities.map((c) => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
              <td className="px-4 py-3">
                <StatusPill status={String(c.activationStatus ?? c.status ?? "—")} />
              </td>
              <td className="px-4 py-3 text-gray-500">{fmtGbp(Number(c.targetAmount ?? 0))}</td>
              <td className="px-4 py-3 text-gray-500">{c.businessesCount ?? c._count?.businesses ?? 0}</td>
              <td className="px-4 py-3 text-gray-500">{c.campaignsCount ?? 0}</td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}

// ─── Campaign Performance ───────────────────────────────────────────────────

export function CampaignPerformancePage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    adminApi
      .getCampaigns({ limit: 100 })
      .then((res) => {
        setCampaigns(res.items ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(load, []);

  if (loading) return <AdminLoading />;
  if (error) return <AdminError onRetry={load} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Campaign Performance" description="Campaign success and funding metrics." />
      {campaigns.length === 0 ? (
        <AdminEmpty message="No campaigns found." />
      ) : (
        <AdminTable columns={["Campaign", "Status", "Raised", "Target", "Progress", "Backers"]}>
          {campaigns.map((c) => {
            const target = Number(c.targetAmount ?? c.target ?? 0);
            const raised = Number(c.raisedAmount ?? c.raised ?? 0);
            const pct = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
            return (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.title}</td>
                <td className="px-4 py-3">
                  <StatusPill status={String(c.status)} />
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">{fmtGbp(raised)}</td>
                <td className="px-4 py-3 text-gray-500">{fmtGbp(target)}</td>
                <td className="px-4 py-3 text-gray-500">{pct}%</td>
                <td className="px-4 py-3 text-gray-500">{c.backerCount ?? c.totalContributors ?? 0}</td>
              </tr>
            );
          })}
        </AdminTable>
      )}
    </div>
  );
}

// ─── Participation & Membership ─────────────────────────────────────────────

export function ParticipationMembershipPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    Promise.allSettled([
      adminApi.getConsumers({ limit: 1 }),
      adminApi.getBusinesses({ limit: 1 }),
      adminApi.getBackers({ limit: 1 }),
      adminApi.getFoundingMembers(),
    ])
      .then(([consumers, businesses, backers, founding]) => {
        setStats({
          consumers: consumers.status === "fulfilled" ? consumers.value.total ?? 0 : 0,
          businesses: businesses.status === "fulfilled" ? businesses.value.total ?? 0 : 0,
          backers: backers.status === "fulfilled" ? backers.value.total ?? 0 : 0,
          founding: founding.status === "fulfilled" ? (founding.value as any[]).length : 0,
        });
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(load, []);

  if (loading) return <AdminLoading />;
  if (error) return <AdminError onRetry={load} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Participation & Membership" description="Participation and membership trends." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Consumers" value={stats.consumers} />
        <StatCard label="Businesses" value={stats.businesses} />
        <StatCard label="Backers" value={stats.backers} />
        <StatCard label="Founding Members" value={stats.founding} />
      </div>
    </div>
  );
}

// ─── Financial Reports ──────────────────────────────────────────────────────

export function FinancialReportsPage() {
  const [overview, setOverview] = useState<any | null>(null);
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    Promise.allSettled([adminApi.getFinanceOverview(), adminApi.getDonations({ limit: 25 })])
      .then(([ov, donations]) => {
        setOverview(ov.status === "fulfilled" ? ov.value : null);
        setRecent(donations.status === "fulfilled" ? donations.value.items ?? [] : []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(load, []);

  if (loading) return <AdminLoading />;
  if (error) return <AdminError onRetry={load} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Financial Reports" description="Financial reporting and recent transactions." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Gross" value={fmtGbp(overview?.totalGross ?? 0)} />
        <StatCard label="Net" value={fmtGbp(overview?.totalNet ?? 0)} />
        <StatCard label="Refunded" value={fmtGbp(overview?.totalRefunded ?? 0)} />
      </div>
      {recent.length === 0 ? (
        <AdminEmpty message="No recent transactions." />
      ) : (
        <AdminTable columns={["Reference", "Campaign", "Amount", "Status", "Date"]}>
          {recent.map((d) => (
            <tr key={d.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.reference ?? d.id.slice(0, 8)}</td>
              <td className="px-4 py-3 text-gray-900">{d.campaign?.title ?? "—"}</td>
              <td className="px-4 py-3 font-semibold text-gray-900">{fmtGbp(d.amount)}</td>
              <td className="px-4 py-3">
                <StatusPill status={String(d.status)} />
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(d.createdAt)}</td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
