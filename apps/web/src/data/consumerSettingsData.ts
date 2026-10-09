// =============================================================================
// Consumer settings preferences (Phase 9, §21)
// Preferences persist in localStorage — instant, offline-safe.
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function mergeSection<T extends object>(base: T, raw: unknown): T {
  if (!isRecord(raw)) return base;
  const merged: Record<string, unknown> = {
    ...(base as Record<string, unknown>),
  };
  for (const key of Object.keys(base)) {
    const v = raw[key];
    if (typeof v === "boolean") merged[key] = v;
  }
  return merged as T;
}

export function getConsumerSettings(): ConsumerSettings {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isRecord(parsed)) {
        return {
          notifications: mergeSection(DEFAULT_SETTINGS.notifications, parsed.notifications),
          privacy: mergeSection(DEFAULT_SETTINGS.privacy, parsed.privacy),
          communication: mergeSection(DEFAULT_SETTINGS.communication, parsed.communication),
        };
      }
    }
  } catch {
    /* fall through to defaults */
  }
  return DEFAULT_SETTINGS;
}

export function updateSettingsSection<K extends keyof ConsumerSettings>(
  section: K,
  values: Partial<ConsumerSettings[K]>,
): ConsumerSettings {
  const current = getConsumerSettings();
  const next: ConsumerSettings = {
    ...current,
    [section]: { ...current[section], ...values },
  };
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — return merged values anyway */
  }
  return next;
}
