import api from "../api";
import type {
  Leaderboard,
  LeaderboardEntry,
  LeaderboardQueryDto,
  LeaderboardResponse,
} from "./type";

function getEmptyLeaderboard(
  level: string,
  scopeId?: string,
): Leaderboard {
  return {
    id: `leaderboard-${level}-${scopeId || "all"}`,
    scope: level,
    scopeId,
    totalEntries: 0,
    lastUpdated: new Date().toISOString(),
    entries: [],
  };
}

export const leaderboardService = {
  /**
   * Fetch dense rank leaderboard entries for business dashboard.
   */
  async getBusinessLeaderboard(query?: LeaderboardQueryDto): Promise<LeaderboardResponse> {
    return api.get("/business/leaderboard", { params: query });
  },

  /**
   * Platform-wide business leaderboard for the admin area.
   */
  async getAdminBusinessLeaderboard(query?: LeaderboardQueryDto): Promise<LeaderboardResponse> {
    return api.get("/admin/leaderboards/business", { params: query });
  },

  /**
   * Fetch leaderboard. Supports both string level ("campaign" | "city" | ...)
   * and business LeaderboardQueryDto object.
   */
  async getLeaderboard(
    levelOrQuery?: "campaign" | "city" | "borough" | "high_street" | "national" | LeaderboardQueryDto,
    scopeId?: string,
    top: number = 100,
    sortBy: "totalContributed" | "campaignCount" = "totalContributed",
  ): Promise<any> {
    if (typeof levelOrQuery === "object" || levelOrQuery === undefined) {
      return this.getBusinessLeaderboard(levelOrQuery);
    }

    const level = levelOrQuery;
    try {
      const url = scopeId
        ? `/leaderboard/${level}/${scopeId}?top=${top}&sortBy=${sortBy}`
        : `/leaderboard/${level}?top=${top}&sortBy=${sortBy}`;
      const res = await api.get(url);
      return res || null;
    } catch {
      return getEmptyLeaderboard(level, scopeId);
    }
  },

  /**
   * Get urgency-based leaderboard (first N people qualify).
   */
  async getUrgencyLeaderboard(
    level: string,
    scopeId: string,
    qualificationLimit: number = 10,
    qualificationWindowHours: number = 72,
  ): Promise<Leaderboard | null> {
    try {
      const res = await api.get(
        `/leaderboard/urgency/${level}/${scopeId}?limit=${qualificationLimit}&windowHours=${qualificationWindowHours}`,
      );
      return res || null;
    } catch {
      return getEmptyLeaderboard(level, scopeId);
    }
  },

  /**
   * Check if current user qualifies for an urgency-based reward.
   */
  async checkQualification(
    level: string,
    scopeId: string,
    qualificationLimit: number = 10,
  ): Promise<{ qualifies: boolean; rank: number | null; qualificationExpiresAt: string | null }> {
    try {
      const res = await api.get(
        `/leaderboard/check-qualification/${level}/${scopeId}?limit=${qualificationLimit}`,
      );
      return res || { qualifies: false, rank: null, qualificationExpiresAt: null };
    } catch {
      return { qualifies: false, rank: null, qualificationExpiresAt: null };
    }
  },

  /**
   * Get leaderboard overview (admin).
   */
  async getOverview(): Promise<{
    national: Leaderboard;
    cityLeaderboards: { cityId: string; cityName: string; entries: LeaderboardEntry[] }[];
    lastUpdated: string;
  } | null> {
    try {
      const res = await api.get("/leaderboard/overview");
      return res || null;
    } catch {
      return null;
    }
  },
};

export const leaderboardApi = leaderboardService;
export default leaderboardService;
export type * from "./type";
