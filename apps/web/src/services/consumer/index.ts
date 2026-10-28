import api from "../api";
import { setUnreadCount } from "@/hooks/useUnreadNotifications";
import type { IssuedReward } from "@/types/rewards";

export interface PaginatedIssuedRewards {
  items: IssuedReward[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ConsumerStats {
  totalContributed: number;
  campaignsBacked: number;
  rewardsEarned: number;
}

export interface ConsumerOverview {
  stats: ConsumerStats;
  activeSeason: any;
  featuredCampaigns: any[];
}

export type NotificationCategory = "contribution" | "reward" | "campaign" | "community" | "system";

export const NOTIFICATION_CATEGORIES: { id: NotificationCategory; label: string }[] = [
  { id: "contribution", label: "Contributions" },
  { id: "reward", label: "Rewards" },
  { id: "campaign", label: "Campaigns" },
  { id: "community", label: "Community" },
  { id: "system", label: "System" },
];

export interface ConsumerNotification {
  id: string;
  title: string;
  message: string;
  body?: string;
  createdAt: string;
  read: boolean;
  type: string;
  category?: NotificationCategory;
  link?: string;
  reference?: string;
}

const READ_KEY = "fod:notifications:read";
const MAX_TRACKED_READS = 500;

/** Ids of notifications the user has already opened on this device. */
function readIds(): Set<string> {
  try {
    const raw = window.localStorage.getItem(READ_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

function writeReadIds(ids: Set<string>): void {
  try {
    // Keep the newest ids so the set cannot grow without bound.
    const trimmed = [...ids].slice(-MAX_TRACKED_READS);
    window.localStorage.setItem(READ_KEY, JSON.stringify(trimmed));
  } catch {
    /* storage unavailable */
  }
}

const KNOWN_CATEGORIES = new Set<NotificationCategory>(
  NOTIFICATION_CATEGORIES.map((category) => category.id),
);

function normalizeCategory(type: string): NotificationCategory {
  return KNOWN_CATEGORIES.has(type as NotificationCategory)
    ? (type as NotificationCategory)
    : "system";
}

/** Last list fetched — lets read actions recompute the unread badge. */
let notificationCache: ConsumerNotification[] = [];

export async function listNotifications(): Promise<ConsumerNotification[]> {
  try {
    const list = await consumerService.getNotifications();
    const read = readIds();
    notificationCache = list.map((notification) => ({
      ...notification,
      body: notification.body ?? notification.message,
      category: normalizeCategory(notification.type),
      read: Boolean(notification.read) || read.has(notification.id),
    }));
    return notificationCache;
  } catch {
    notificationCache = [];
    return [];
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  const read = readIds();
  read.add(id);
  writeReadIds(read);

  notificationCache = notificationCache.map((notification) =>
    notification.id === id ? { ...notification, read: true } : notification,
  );
  if (notificationCache.length > 0) {
    setUnreadCount(notificationCache.filter((notification) => !notification.read).length);
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const read = readIds();
  for (const notification of notificationCache) read.add(notification.id);
  writeReadIds(read);

  notificationCache = notificationCache.map((notification) => ({
    ...notification,
    read: true,
  }));
  setUnreadCount(0);
}

export async function syncUnreadBadge(): Promise<void> {
  try {
    const list = await consumerService.getNotifications();
    const read = readIds();
    const unread = list.filter(
      (notification) => !notification.read && !read.has(notification.id),
    ).length;
    setUnreadCount(unread);
  } catch {
    // ignore — keep the last known badge
  }
}

export const consumerService = {
  async getOverview(): Promise<ConsumerOverview> {
    return api.get("/consumer/overview");
  },

  async getNotifications(): Promise<ConsumerNotification[]> {
    return api.get("/consumer/notifications");
  },

  /** The current user's issued rewards (real codes + lifecycle status). */
  async getRewards(params: { page?: number; limit?: number } = {}): Promise<PaginatedIssuedRewards> {
    return api.get("/consumer/rewards", { params });
  },

  async getReward(id: string): Promise<IssuedReward> {
    return api.get(`/consumer/rewards/${id}`);
  },
};

export const consumerApi = consumerService;
export default consumerService;
