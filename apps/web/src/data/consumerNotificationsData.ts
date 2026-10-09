// =============================================================================
// Consumer notifications (Phase 9, §20)
// Fake-async dataset (setTimeout) with read/unread state persisted in
// localStorage; unread badge count feeds useUnreadNotifications.
// =============================================================================

import { setUnreadCount } from "@/hooks/useUnreadNotifications";

export type NotificationCategory =
  | "campaign_updates"
  | "contribution_confirmations"
  | "reward_notifications"
  | "founding_member_updates"
  | "season_updates"
  | "community_updates";

export interface NotificationCategoryMeta {
  id: NotificationCategory;
  label: string;
}

export const NOTIFICATION_CATEGORIES: NotificationCategoryMeta[] = [
  { id: "campaign_updates", label: "Campaign Updates" },
  { id: "contribution_confirmations", label: "Contribution Confirmations" },
  { id: "reward_notifications", label: "Reward Notifications" },
  { id: "founding_member_updates", label: "Founding Member Updates" },
  { id: "season_updates", label: "Season Updates" },
  { id: "community_updates", label: "Community Updates" },
];

export interface ConsumerNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
}

const READ_KEY = "fod:notifications:read";
const DELAY_MS = 250;

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 86400000).toISOString();
}

// Newest three start unread; the rest start read.
const INITIAL_UNREAD_IDS = ["n-1", "n-2", "n-3"];

const DATASET: Omit<ConsumerNotification, "read">[] = [
  {
    id: "n-1",
    category: "campaign_updates",
    title: "Camden High Street campaign is 71% funded",
    body: "The campaign you viewed just passed £14,200 of its £20,000 target.",
    createdAt: daysAgo(1),
  },
  {
    id: "n-2",
    category: "reward_notifications",
    title: "A new reward is available",
    body: "Your latest contribution qualified you for the Supporter E-Card.",
    createdAt: daysAgo(2),
  },
  {
    id: "n-3",
    category: "contribution_confirmations",
    title: "Contribution received",
    body: "Thanks! Your £10 contribution to Chalk Farm Road is being processed.",
    createdAt: daysAgo(3),
  },
  {
    id: "n-4",
    category: "community_updates",
    title: "New campaigns on your high street",
    body: "Two new campaigns launched on Camden High Street this week.",
    createdAt: daysAgo(5),
  },
  {
    id: "n-5",
    category: "founding_member_updates",
    title: "Founding Member benefits updated",
    body: "Founding Members now receive MCOM reward points on every contribution.",
    createdAt: daysAgo(8),
  },
  {
    id: "n-6",
    category: "season_updates",
    title: "A new funding season has started",
    body: "Seasonal funding pools are open — explore this season's campaigns.",
    createdAt: daysAgo(12),
  },
  {
    id: "n-7",
    category: "campaign_updates",
    title: "Chalk Farm Road campaign ends soon",
    body: "Only 5 days left to back the Chalk Farm Road community campaign.",
    createdAt: daysAgo(15),
  },
  {
    id: "n-8",
    category: "contribution_confirmations",
    title: "Contribution completed",
    body: "Your £100 Founding Membership contribution to Lambeth completed.",
    createdAt: daysAgo(14),
  },
  {
    id: "n-9",
    category: "reward_notifications",
    title: "Reward ready to open",
    body: "Your Premium Supporter Package is claimed — open it whenever you like.",
    createdAt: daysAgo(14),
  },
];

function readReadIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed as string[]);
    }
  } catch {
    /* fall through to defaults */
  }
  return new Set(
    DATASET.filter((n) => !INITIAL_UNREAD_IDS.includes(n.id)).map((n) => n.id),
  );
}

function writeReadIds(ids: Set<string>): void {
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  } catch {
    /* storage unavailable */
  }
}

function computeUnread(): number {
  const readIds = readReadIds();
  return DATASET.filter((n) => !readIds.has(n.id)).length;
}

/** Recompute the unread badge from the dataset and broadcast it. */
export function syncUnreadBadge(): void {
  setUnreadCount(computeUnread());
}

export async function listNotifications(): Promise<ConsumerNotification[]> {
  const readIds = readReadIds();
  const items = DATASET.map((n) => ({ ...n, read: readIds.has(n.id) })).sort(
    (a, b) => b.createdAt.localeCompare(a.createdAt),
  );
  return new Promise((resolve) =>
    window.setTimeout(() => resolve(items), DELAY_MS),
  );
}

export function markNotificationRead(id: string): void {
  const readIds = readReadIds();
  readIds.add(id);
  writeReadIds(readIds);
  setUnreadCount(computeUnread());
}

export function markAllNotificationsRead(): void {
  writeReadIds(new Set(DATASET.map((n) => n.id)));
  setUnreadCount(0);
}
