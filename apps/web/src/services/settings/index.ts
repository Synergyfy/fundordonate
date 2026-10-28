// =============================================================================
// Consumer Settings & Preferences Service
// Manages notification preferences, privacy and communication settings.
// Preferences are stored per device — the API does not persist them yet.
// =============================================================================

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

export function saveConsumerSettings(settings: ConsumerSettings): void {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* storage unavailable */
  }
}

/** Merge persisted settings with the defaults (deep for each section). */
export function getConsumerSettings(): ConsumerSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ConsumerSettings>;
      return {
        notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications },
        privacy: { ...DEFAULT_SETTINGS.privacy, ...parsed.privacy },
        communication: {
          ...DEFAULT_SETTINGS.communication,
          ...parsed.communication,
        },
      };
    }
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT_SETTINGS;
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
