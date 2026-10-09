import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight, Lock, ShieldCheck } from "lucide-react";
import {
  getConsumerSettings,
  updateSettingsSection,
  type ConsumerSettings,
} from "@/data/consumerSettingsData";
import { useAuthStore } from "@/stores/auth.store";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-6" : "left-1"
        }`}
      />
    </button>
  );
}

function SettingRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

const NOTIFICATION_ROWS: {
  key: keyof ConsumerSettings["notifications"];
  label: string;
}[] = [
  { key: "campaignUpdates", label: "Campaign updates" },
  { key: "contributionConfirmations", label: "Contribution confirmations" },
  { key: "rewardNotifications", label: "Reward notifications" },
  { key: "foundingMemberUpdates", label: "Founding member updates" },
  { key: "seasonUpdates", label: "Season updates" },
  { key: "communityUpdates", label: "Community updates" },
];

const PRIVACY_ROWS: {
  key: keyof ConsumerSettings["privacy"];
  label: string;
  description: string;
}[] = [
  {
    key: "publicProfile",
    label: "Public profile",
    description: "Let other community members see your display name.",
  },
  {
    key: "showContributions",
    label: "Show contributions publicly",
    description: "Display your contribution activity on campaign pages.",
  },
  {
    key: "personalisedRecommendations",
    label: "Personalised recommendations",
    description: "Suggest campaigns based on what you have backed before.",
  },
];

const COMMUNICATION_ROWS: {
  key: keyof ConsumerSettings["communication"];
  label: string;
  description: string;
}[] = [
  {
    key: "campaignEmailDigest",
    label: "Campaign email digest",
    description: "A weekly summary of campaigns on your high street.",
  },
  {
    key: "productNews",
    label: "Product news & tips",
    description: "Occasional updates about new FundOrDonate features.",
  },
  {
    key: "smsAlerts",
    label: "SMS alerts",
    description: "Text alerts for time-sensitive campaign milestones.",
  },
];

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <h2 className="border-b border-gray-100 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ConsumerSettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const centralHubEnabled = useAuthStore((s) => s.centralHubEnabled);
  const centralHubLoading = useAuthStore((s) => s.centralHubLoading);
  const checkCentralHub = useAuthStore((s) => s.checkCentralHub);

  const [settings, setSettings] = useState<ConsumerSettings>(getConsumerSettings);

  useEffect(() => {
    void checkCentralHub();
  }, [checkCentralHub]);

  const displayName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ");
  const name = displayName || user?.username || "Consumer";

  const update = <K extends keyof ConsumerSettings>(
    section: K,
    values: Partial<ConsumerSettings[K]>,
  ) => {
    setSettings(updateSettingsSection(section, values));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          to="/consumer/you"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          You
        </Link>
        <span className="text-xs text-gray-400">Settings</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <Card title="Account">
        <div className="divide-y divide-gray-50">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="text-sm text-gray-500">Name</p>
            <p className="text-sm font-medium text-gray-900">{name}</p>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="text-sm text-gray-500">Email</p>
            <p className="truncate text-sm font-medium text-gray-900">
              {user?.email || "—"}
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="text-sm text-gray-500">Username</p>
            <p className="text-sm font-medium text-gray-900">
              {user?.username || "—"}
            </p>
          </div>
        </div>
        <Link
          to="/consumer/you/profile"
          className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm font-semibold text-primary-700 hover:bg-primary-50"
        >
          Manage profile
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>

      <Card title="Notifications">
        <div className="divide-y divide-gray-50">
          {NOTIFICATION_ROWS.map((row) => (
            <SettingRow
              key={row.key}
              label={row.label}
              checked={settings.notifications[row.key]}
              onChange={(next) =>
                update("notifications", { [row.key]: next } as Partial<
                  ConsumerSettings["notifications"]
                >)
              }
            />
          ))}
        </div>
      </Card>

      <Card title="Privacy">
        <div className="divide-y divide-gray-50">
          {PRIVACY_ROWS.map((row) => (
            <SettingRow
              key={row.key}
              label={row.label}
              description={row.description}
              checked={settings.privacy[row.key]}
              onChange={(next) =>
                update("privacy", { [row.key]: next } as Partial<
                  ConsumerSettings["privacy"]
                >)
              }
            />
          ))}
        </div>
        <Link
          to="/privacy"
          className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm font-semibold text-primary-700 hover:bg-primary-50"
        >
          Privacy Policy
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>

      <Card title="Communication Preferences">
        <div className="divide-y divide-gray-50">
          {COMMUNICATION_ROWS.map((row) => (
            <SettingRow
              key={row.key}
              label={row.label}
              description={row.description}
              checked={settings.communication[row.key]}
              onChange={(next) =>
                update("communication", { [row.key]: next } as Partial<
                  ConsumerSettings["communication"]
                >)
              }
            />
          ))}
        </div>
      </Card>

      <Card title="Security">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50">
              <ShieldCheck className="h-5 w-5 text-primary-600" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">Central Hub</p>
              <p className="truncate text-xs text-gray-500">
                Your FundOrDonate sign-in is linked to MCOM Central Hub.
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              centralHubLoading
                ? "bg-gray-100 text-gray-500"
                : centralHubEnabled
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
            }`}
          >
            {centralHubLoading
              ? "Checking…"
              : centralHubEnabled
                ? "Linked"
                : "Not linked"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/consumer/you/profile?tab=password")}
          className="flex w-full items-center justify-between border-t border-gray-100 px-4 py-3 text-sm font-semibold text-primary-700 hover:bg-primary-50"
        >
          <span className="inline-flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Change password
          </span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </Card>

      <p className="pb-4 text-center text-xs text-gray-400">
        Preferences are saved on this device for the demo.
      </p>
    </div>
  );
}
