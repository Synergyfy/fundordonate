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

export async function listNotifications(): Promise<ConsumerNotification[]> {
  try {
    const list = await consumerService.getNotifications();
    return list.map((n) => ({
      ...n,
      category: (n.type as NotificationCategory) || "contribution",
    }));
  } catch {
    return [];
  }
}

export async function markNotificationRead(_id: string): Promise<void> {
  // update unread count
  try {
    const current = Number(window.localStorage.getItem("fod:notifications:unread") || "0");
    setUnreadCount(Math.max(0, current - 1));
  } catch {}
}

export async function markAllNotificationsRead(): Promise<void> {
  setUnreadCount(0);
}

export async function syncUnreadBadge(): Promise<void> {
  try {
    const list = await consumerService.getNotifications();
    const count = list.filter((n) => !n.read).length;
    setUnreadCount(count);
  } catch {
    // ignore
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
