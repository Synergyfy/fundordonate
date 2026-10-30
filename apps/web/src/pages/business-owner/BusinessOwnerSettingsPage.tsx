// =============================================================================
// Business Owner Settings Page
// Account and notification settings, wired to live backend API.
// =============================================================================

import { Bell, Lock, AlertCircle, ExternalLink, RefreshCw, Store } from "lucide-react";
import {
  useBusinessSettings,
  useUpdateBusinessSettings,
  useBusinessProfile,
} from "@/services/business/hook";
import { useAuthStore } from "@/stores/auth.store";
import { getCentralProfileUrl } from "@/lib/central-hub";
import { usePlanCapabilities } from "@/hooks/usePlanCapabilities";

export default function BusinessOwnerSettingsPage() {
  const plan = usePlanCapabilities();
  const canAlerts = plan.can("notifications.alerts");
  const canWeeklyDigest = plan.can("notifications.weekly_digest");
  const { data: settings, isLoading: settingsLoading, error: settingsError, refetch: refetchSettings } = useBusinessSettings();
  const updateSettingsMutation = useUpdateBusinessSettings();

  const { data: profile, isLoading: profileLoading } = useBusinessProfile();
  const authUser = useAuthStore((s) => s.user);
  const editProfileUrl = getCentralProfileUrl(
    authUser ?? { userType: "business", role: "business" },
  );

  const handleToggle = (key: "emailAlerts" | "campaignUpdates" | "leaderboardChanges" | "rewardsEarned" | "newBackers" | "weeklyDigest") => {
    if (!settings) return;
    updateSettingsMutation.mutate({
      [key]: !settings[key],
    });
  };

  if (settingsLoading || profileLoading) {
    return (
      <div className="space-y-6 max-w-2xl animate-pulse">
        <div className="h-8 w-40 rounded bg-gray-200" />
        <div className="h-48 rounded-xl bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (settingsError || !settings) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center max-w-2xl">
        <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-2" />
        <p className="font-semibold text-red-900">Failed to load business settings.</p>
        <button
          onClick={() => refetchSettings()}
          className="mt-3 inline-flex items-center gap-1 rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
        >
          <RefreshCw className="h-3 w-3" /> Retry
        </button>
      </div>
    );
  }

  const notificationOptions = [
    { key: "emailAlerts" as const, label: "Email notifications" },
    { key: "campaignUpdates" as const, label: "Campaign status & review updates" },
    { key: "leaderboardChanges" as const, label: "Leaderboard rank shift alerts" },
    { key: "rewardsEarned" as const, label: "Reward & badge unlock alerts" },
    { key: "newBackers" as const, label: "New backer contribution alerts" },
    { key: "weeklyDigest" as const, label: "Weekly performance digest" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your business account and notification preferences.</p>
      </div>

      {/* Business identity — synced from Central Hub, read-only here */}
      <div className="rounded-xl bg-white p-5 shadow-sm border">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-gray-600" />
            <h2 className="text-sm font-bold text-gray-900">Business Identity</h2>
          </div>
          <a
            href={editProfileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Edit on Central Hub <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          Your business name, contact email, phone, address and other business
          details are managed by MCOM Central Hub. They sync here automatically
          each time you sign in.
        </p>
        <div className="divide-y divide-gray-50">
          {[
            ["Business name", profile?.name],
            ["Contact email", profile?.email],
            ["Phone", profile?.phone],
            ["Address", [profile?.address, profile?.postcode, profile?.country].filter(Boolean).join(", ")],
            ["Business type", profile?.businessType],
            ["Industry", profile?.industry],
            ["Category", profile?.category],
            ["Website", profile?.website],
            ["Opening hours", profile?.openingHours],
            ["Social media", profile?.socialMedia],
          ].map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 py-2.5">
              <span className="text-sm text-gray-500">{label}</span>
              <span className="max-w-[60%] break-words text-right text-sm font-medium text-gray-900">
                {value || "Not provided"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl bg-white p-5 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <h2 className="text-sm font-bold text-gray-900">Notification Preferences</h2>
          </div>
          {updateSettingsMutation.isPending && (
            <span className="text-xs text-primary-600 animate-pulse">Updating...</span>
          )}
        </div>
        <div className="space-y-3">
          {notificationOptions.map(({ key, label }) => {
            const isEnabled = !!settings[key];
            const locked =
              (key === "weeklyDigest" && !canWeeklyDigest) ||
              (["leaderboardChanges", "rewardsEarned", "newBackers"].includes(key) &&
                !canAlerts);
            return (
              <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className={`text-sm ${locked ? "text-gray-400" : "text-gray-700"}`}>
                  {label}
                  {locked && (
                    <span className="ml-2 text-[10px] font-semibold uppercase text-amber-600">
                      Plan upgrade required
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle(key)}
                  disabled={locked}
                  title={locked ? "This alert is not included in your current plan" : undefined}
                  className={`relative h-6 w-11 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    isEnabled ? "bg-primary-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      isEnabled ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security */}
      <div className="rounded-xl bg-white p-5 shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5 text-gray-600" />
          <h2 className="text-sm font-bold text-gray-900">Security & Credentials</h2>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
            Authentication is secured via JWT and federated access. Sessions automatically renew.
          </div>
        </div>
      </div>
    </div>
  );
}
