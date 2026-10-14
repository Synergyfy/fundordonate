import api from "../api";
import type {
  Leaderboard,
  LeaderboardEntry,
  LeaderboardQueryDto,
  LeaderboardResponse,
} from "./type";

function getDemoLeaderboard(
  level: string,
  scopeId?: string,
  top: number = 10,
): Leaderboard {
  const demoEntries: LeaderboardEntry[] = Array.from({ length: Math.min(top, 20) }, (_, i) => ({
    id: `demo-${level}-${scopeId || "all"}-${i}`,
    userId: `user-${i}`,
    rank: i + 1,
    totalContributed: Math.floor(Math.random() * 500000) + 10000,
    campaignCount: Math.floor(Math.random() * 15) + 1,
    scopeId,
    user: {
      id: `user-${i}`,
      firstName: ["Emma", "Liam", "Olivia", "Noah", "Oliver", "Alice", "Bob", "Charlie", "Diana", "Edward"][i % 10],
      lastName: ["Wilson", "Smith", "Brown", "Taylor", "Davies", "Clark", "Hall", "Green", "Baker", "Young"][i % 10],
      avatar: undefined,
      username: `user${i}`,
    },
    backerTier: ["NATIONAL", "CITY", "BACKER", "CITY", "NATIONAL", "BACKER", "CITY", "BACKER", "CITY", "NATIONAL"][i % 10],
    isOriginalFoundingMember: i < 3,
  }));

  demoEntries.sort((a, b) => b.totalContributed - a.totalContributed);
  demoEntries.forEach((e, i) => (e.rank = i + 1));

  return {
    id: `leaderboard-${level}-${scopeId || "all"}`,
    scope: level,
    scopeId,
    totalEntries: demoEntries.length,
    lastUpdated: new Date().toISOString(),
    entries: demoEntries,
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
      return getDemoLeaderboard(level, scopeId, top);
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
      return getDemoLeaderboard(level, scopeId, qualificationLimit);
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
