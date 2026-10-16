// =============================================================================
// Consumer Community Preference
// Persists the consumer's selected local community (City / Borough / High Street).
// =============================================================================

export interface ConsumerCommunity {
  citySlug: string;
  cityName: string;
  areaSlug: string;
  areaName: string;
  streetSlug: string;
  streetName: string;
}

const DEFAULT_COMMUNITY: ConsumerCommunity = {
  citySlug: "london",
  cityName: "London",
  areaSlug: "camden",
  areaName: "Camden",
  streetSlug: "camden-high-street",
  streetName: "Camden High Street",
};

const COMMUNITY_KEY = "fod:community";

function isValidCommunity(value: unknown): value is ConsumerCommunity {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  const keys = [
    "citySlug",
    "cityName",
    "areaSlug",
    "areaName",
    "streetSlug",
    "streetName",
  ] as const;
  return keys.every((k) => typeof v[k] === "string" && (v[k] as string).length > 0);
}

export function getConsumerCommunity(): ConsumerCommunity {
  try {
    const raw = window.localStorage.getItem(COMMUNITY_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isValidCommunity(parsed)) return parsed;
    }
  } catch {
    // fall through to default
  }
  return DEFAULT_COMMUNITY;
}

export function setConsumerCommunity(community: ConsumerCommunity): void {
  try {
    window.localStorage.setItem(COMMUNITY_KEY, JSON.stringify(community));
  } catch {
    // ignore quota errors
  }
}
