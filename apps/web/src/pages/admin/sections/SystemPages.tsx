// =============================================================================
// Admin — System & Platform sections
// =============================================================================

import { useEffect, useState } from "react";
import { adminApi, type AdminUser, type ActivityFeedItem } from "@/services/admin";
import { API_CONFIG } from "@/lib/config";
import { AdminPageHeader, AdminLoading, AdminError, AdminEmpty, AdminTable, StatCard, fmtDate } from "./shared";
import { ShieldCheck, Plug, Activity, Users, RefreshCw } from "lucide-react";

// ─── Users & Roles ──────────────────────────────────────────────────────────

const ROLES = ["admin", "fundraiser", "collaborator", "backer", "donor"];

export function UsersRolesPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(false);
    adminApi
      .getUsers({ limit: 100 })
      .then((res) => {
        setUsers(res.items ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const changeRole = (id: string, role: string) => {
    setBusy(id);
    adminApi
      .updateUserRole(id, role)
      .then(() => setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u))))
      .finally(() => setBusy(null));
  };

  if (loading) return <AdminLoading />;
  if (error) return <AdminError onRetry={load} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Users & Roles" description="Manage user roles and platform access." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Users" value={users.length} />
        <StatCard label="Admins" value={users.filter((u) => u.role === "admin").length} />
        <StatCard label="Business Owners" value={users.filter((u) => u.userType === "business").length} />
      </div>
      {users.length === 0 ? (
        <AdminEmpty message="No users found." />
      ) : (
        <AdminTable columns={["Name", "Email", "Type", "Joined", "Role"]}>
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">
                {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.username || "—"}
              </td>
              <td className="px-4 py-3 text-gray-500">{u.email}</td>
              <td className="px-4 py-3 capitalize text-gray-500">{u.userType ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(u.createdAt)}</td>
              <td className="px-4 py-3">
                <select
                  value={u.role}
                  disabled={busy === u.id}
                  onChange={(e) => changeRole(u.id, e.target.value)}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium capitalize focus:border-primary-500 focus:outline-none disabled:opacity-50"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}

// ─── Audit Logs ─────────────────────────────────────────────────────────────

export function AuditLogsPage() {
  const [logs, setLogs] = useState<ActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    adminApi
      .getAuditLogs({ limit: 100 })
      .then((res) => {
        setLogs(res.items ?? []);
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
      <AdminPageHeader title="Audit Logs" description="System audit trail of platform activity." />
      {logs.length === 0 ? (
        <AdminEmpty message="No audit events recorded yet." />
      ) : (
        <AdminTable columns={["Action", "Entity", "User", "IP", "When"]}>
          {logs.map((l) => (
            <tr key={l.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium capitalize text-gray-900">
                {l.action.replace(/_/g, " ").toLowerCase()}
              </td>
              <td className="px-4 py-3 text-gray-500">{l.entityType}</td>
              <td className="px-4 py-3 text-gray-500">
                {l.user ? [l.user.firstName, l.user.lastName].filter(Boolean).join(" ") || l.user.email : "System"}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-gray-400">{l.ipAddress ?? "—"}</td>
              <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(l.createdAt)}</td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}

// ─── System Health ──────────────────────────────────────────────────────────

interface HealthResult {
  status: string;
  info?: Record<string, { status: string }>;
  error?: Record<string, { status: string }>;
}

export function SystemHealthPage() {
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const healthUrl = `${API_CONFIG.BASE_URL.replace(/\/api\/v1\/?$/, "")}/health`;

  const load = () => {
    setLoading(true);
    setError(false);
    fetch(healthUrl)
      .then((r) => r.json())
      .then((data: HealthResult) => {
        setHealth(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(load, []);

  if (loading) return <AdminLoading label="Checking system health…" />;
  if (error) return <AdminError onRetry={load} />;

  const checks = { ...(health?.info ?? {}), ...(health?.error ?? {}) };
  const entries = Object.entries(checks);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="System Health"
        description="Live status of platform dependencies."
        actions={
          <button onClick={load} className="btn-secondary inline-flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Overall"
          value={
            <span className={health?.status === "ok" ? "text-green-600" : "text-red-600"}>
              {health?.status ?? "unknown"}
            </span>
          }
        />
        <StatCard label="Checks" value={entries.length} />
        <StatCard label="Failing" value={Object.keys(health?.error ?? {}).length} />
      </div>
      {entries.length === 0 ? (
        <AdminEmpty message="No health checks reported." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map(([name, detail]) => (
            <div key={name} className="flex items-center justify-between rounded-xl border bg-white p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium capitalize text-gray-900">{name}</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  detail.status === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}
              >
                {detail.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Integrations (no backend yet) ──────────────────────────────────────────

export function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Integrations" description="Third-party integrations and connected services." />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <Plug className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Connected services</h2>
            <p className="text-sm text-gray-500">
              Integration management is not available yet. Payment (MCOM Pay), rewards (MCOM Rewards) and
              247GBS Audit are wired through the API; configuration UI is coming.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Security (no backend yet) ──────────────────────────────────────────────

export function SecurityPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Security" description="Security policies and access controls." />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
            <ShieldCheck className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Security settings</h2>
            <p className="text-sm text-gray-500">
              Security policy management is not available yet. Authentication is handled via MCOM Central
              SSO with JWT sessions.
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        <Users className="h-4 w-4" /> Role-based access is managed under{" "}
        <span className="font-medium text-gray-700">System → Users &amp; Roles</span>.
      </div>
    </div>
  );
}
