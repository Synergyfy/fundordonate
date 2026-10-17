// =============================================================================
// Admin — Content, Comms & Support sections
// =============================================================================

import { useEffect, useState } from "react";
import { supportService } from "@/services/support";
import {
  AdminPageHeader,
  AdminLoading,
  AdminError,
  AdminEmpty,
  AdminTable,
  StatusPill,
  StatCard,
  fmtDate,
} from "./shared";
import { FileText, Bell, ShieldAlert, Megaphone, LifeBuoy } from "lucide-react";

function ComingSoonPanel({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
          <Icon className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h2 className="font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function ContentCMSPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Content & CMS" description="Manage static content and CMS assets." />
      <ComingSoonPanel
        icon={FileText}
        title="Content management"
        description="A CMS for static pages and marketing content is not available yet."
      />
    </div>
  );
}

export function CampaignCommsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Campaign Communications" description="Campaign emails, updates and broadcasts." />
      <ComingSoonPanel
        icon={Megaphone}
        title="Campaign communications"
        description="Broadcast email tools are not available yet. Campaign owners publish updates from their campaign pages."
      />
    </div>
  );
}

export function NotificationsPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Notifications" description="Platform notifications." />
      <ComingSoonPanel
        icon={Bell}
        title="Notification management"
        description="Platform notification configuration is not available yet."
      />
    </div>
  );
}

export function ModerationPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Moderation" description="Flagged content and moderation." />
      <ComingSoonPanel
        icon={ShieldAlert}
        title="Moderation queue"
        description="A moderation queue is not available yet. Campaign comments can be moderated from each campaign's admin detail page."
      />
    </div>
  );
}

// ─── Support (live) ─────────────────────────────────────────────────────────

export function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(false);
    supportService
      .listTickets({ limit: 100 })
      .then((res) => {
        setTickets(res.items ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const setStatus = (id: string, status: string) => {
    setBusy(id);
    supportService
      .updateTicketStatus(id, status)
      .then(() => setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t))))
      .finally(() => setBusy(null));
  };

  if (loading) return <AdminLoading />;
  if (error) return <AdminError onRetry={load} />;

  const open = tickets.filter((t) => t.status === "OPEN").length;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Support" description="Support tickets and enquiries." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Tickets" value={tickets.length} />
        <StatCard label="Open" value={open} />
        <StatCard label="Resolved" value={tickets.filter((t) => t.status === "RESOLVED").length} />
      </div>
      {tickets.length === 0 ? (
        <AdminEmpty message="No support tickets yet." />
      ) : (
        <AdminTable columns={["From", "Topic", "Message", "Status", "Received", "Action"]}>
          {tickets.map((t) => (
            <tr key={t.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium text-gray-900">{t.name}</div>
                <div className="text-xs text-gray-400">{t.email}</div>
              </td>
              <td className="px-4 py-3 text-gray-500">{t.subject ?? t.topic}</td>
              <td className="max-w-xs px-4 py-3 text-gray-500">
                <span className="line-clamp-2">{t.message}</span>
              </td>
              <td className="px-4 py-3">
                <StatusPill status={t.status} />
              </td>
              <td className="px-4 py-3 text-xs text-gray-400">{fmtDate(t.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <select
                  value={t.status}
                  disabled={busy === t.id}
                  onChange={(e) => setStatus(t.id, e.target.value)}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium focus:border-primary-500 focus:outline-none disabled:opacity-50"
                >
                  {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        <LifeBuoy className="h-4 w-4" /> Tickets submitted from the public contact form and the consumer
        dashboard appear here.
      </div>
    </div>
  );
}
