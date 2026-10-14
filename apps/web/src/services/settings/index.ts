// =============================================================================
// Consumer Settings & Preferences Service
// Manages notification preferences, privacy and communication settings.
// =============================================================================

import { userDashboardApi } from "@/services/user-dashboard";

export interface ConsumerSettings {
  notifications: {
    campaignUpdates: boolean;
    contributionConfirmations: boolean;
    rewardNotifications: boolean;
    foundingMemberUpdates: boolean;
    seasonUpdates: boolean;
    communityUpdates: boolean;
  };
  privacy: {
    publicProfile: boolean;
    showContributions: boolean;
    personalisedRecommendations: boolean;
  };
  communication: {
    campaignEmailDigest: boolean;
    productNews: boolean;
    smsAlerts: boolean;
  };
}

const SETTINGS_KEY = "fod:settings";

const DEFAULT_SETTINGS: ConsumerSettings = {
  notifications: {
    campaignUpdates: true,
    contributionConfirmations: true,
    rewardNotifications: true,
    foundingMemberUpdates: true,
    seasonUpdates: true,
    communityUpdates: true,
  },
  privacy: {
    publicProfile: true,
    showContributions: false,
    personalisedRecommendations: true,
  },
  communication: {
    campaignEmailDigest: true,
    productNews: false,
    smsAlerts: false,
  },
};

export function getConsumerSettings(): ConsumerSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveConsumerSettings(settings: ConsumerSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
  // Also sync notifications with backend API
  userDashboardApi.updateNotificationPrefs(settings.notifications as any).catch(() => {});
}

export function updateSettingsSection<K extends keyof ConsumerSettings>(
  section: K,
  patch: Partial<ConsumerSettings[K]>
): ConsumerSettings {
  const current = getConsumerSettings();
  const updated: ConsumerSettings = {
    ...current,
    [section]: {
      ...current[section],
      ...patch,
    },
  };
  saveConsumerSettings(updated);
  return updated;
}
