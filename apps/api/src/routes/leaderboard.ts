// =============================================================================
// Leaderboard Routes
// GET /leaderboard/:level/:scopeId?top=100&sortBy=totalContributed
// GET /leaderboard/urgency/:level/:scopeId
// GET /leaderboard/overview
// =============================================================================

import { Router } from "express";
import {
  getLeaderboard,
  getUrgencyLeaderboard,
  checkQualification,
  getLeaderboardsOverview,
} from "../services/leaderboard.service";

const leaderboardRouter = Router();

/**
 * GET /leaderboard/:level/:scopeId?
 * Get leaderboard for a given hierarchy level and optional scope.
 * Levels: campaign, city, borough, high_street, national
 */
leaderboardRouter.get("/leaderboard/:level/:scopeId?", async (req, res) => {
  try {
    const { level, scopeId } = req.params;
    const top = parseInt(req.query.top as string) || 100;
    const sortBy = (req.query.sortBy as string) || "totalContributed";

    const validLevels = ["campaign", "city", "borough", "high_street", "national"];
    if (!validLevels.includes(level)) {
      return res.status(400).json({ error: "Invalid leaderboard level" });
    }

    if (level !== "national" && !scopeId) {
      return res.status(400).json({ error: "scopeId required for non-national leaderboards" });
    }

    const leaderboard = await getLeaderboard(level, scopeId, top, sortBy);
    res.json({ data: leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

/**
 * GET /leaderboard/urgency/:level/:scopeId
 * Get urgency-based leaderboard (first N people qualify).
 */
leaderboardRouter.get("/leaderboard/urgency/:level/:scopeId", async (req, res) => {
  try {
    const { level, scopeId } = req.params;
    const qualificationLimit = parseInt(req.query.limit as string) || 10;
    const qualificationWindowHours = parseInt(req.query.windowHours as string) || 72;

    const leaderboard = await getUrgencyLeaderboard(
      level,
      scopeId,
      qualificationLimit,
      qualificationWindowHours
    );
    res.json({ data: leaderboard });
  } catch (error) {
    console.error("Urgency leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch urgency leaderboard" });
  }
});

/**
 * GET /leaderboard/check-qualification/:level/:scopeId
 * Check if the authenticated user qualifies for an urgency-based reward.
 */
leaderboardRouter.get("/leaderboard/check-qualification/:level/:scopeId", async (req, res) => {
  try {
    const userId = (req as any).userId; // From auth middleware
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { level, scopeId } = req.params;
    const qualificationLimit = parseInt(req.query.limit as string) || 10;

    const result = await checkQualification(userId, level, scopeId, qualificationLimit);
    res.json({ data: result });
  } catch (error) {
    console.error("Qualification check error:", error);
    res.status(500).json({ error: "Failed to check qualification" });
  }
});

/**
 * GET /leaderboard/overview
 * Get overview of all leaderboards (admin).
 */
leaderboardRouter.get("/leaderboard/overview", async (_req, res) => {
  try {
    const overview = await getLeaderboardsOverview();
    res.json({ data: overview });
  } catch (error) {
    console.error("Leaderboard overview error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard overview" });
  }
});

export { leaderboardRouter };
