import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, authorize, type AuthRequest } from "../middleware/auth";

const locationsRouter = Router();

// =============================================================================
// GET /locations/tree — Full location hierarchy for the campaign wizard
// Returns: CITY > (BOROUGH | LOCAL_AREA | DISTRICT) > HIGH_STREET
// =============================================================================

locationsRouter.get("/locations/tree", async (_req, res, next) => {
  try {
    // Fetch all active public locations in one query
    const locations = await prisma.hubLocation.findMany({
      where: { isActive: true, isPublic: true },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        parentId: true,
        fullPath: true,
        publicStatus: true,
      },
      orderBy: { name: "asc" },
    });

    // Build lookup maps
    type LocationRow = typeof locations[number];
    const byId = new Map(locations.map((l) => [l.id, { ...l, children: [] as LocationRow[] }]));
    const roots: LocationRow[] = [];

    // Wire parent-child relationships
    for (const loc of locations) {
      const node = byId.get(loc.id)!;
      if (loc.parentId) {
        const parent = byId.get(loc.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    // Filter to only cities as top-level roots (for wizard purposes)
    const cityRoots = roots.filter((r) => r.type === "CITY");

    // Transform into the tree shape the frontend expects
    const tree = cityRoots.map((city) => ({
      id: city.id,
      name: city.name,
      slug: city.slug,
      type: city.type,
      fullPath: city.fullPath,
      publicStatus: city.publicStatus,
      localAreas: city.children
        .filter((c) => ["BOROUGH", "DISTRICT", "LOCAL_AREA", "COMMERCIAL_AREA"].includes(c.type))
        .map((area) => ({
          id: area.id,
          name: area.name,
          slug: area.slug,
          type: area.type,
          fullPath: area.fullPath,
          publicStatus: area.publicStatus,
          highStreets: area.children
            .filter((h) => h.type === "HIGH_STREET")
            .map((hs) => ({
              id: hs.id,
              name: hs.name,
              slug: hs.slug,
              type: hs.type,
              fullPath: hs.fullPath,
              publicStatus: hs.publicStatus,
            })),
        })),
    }));

    res.json({ cities: tree });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET /locations — Flat list with filters (for search, admin management)
// Query params: type, parentId, search, includeInactive
// =============================================================================

locationsRouter.get("/locations", async (req, res, next) => {
  try {
    const { type, parentId, search, includeInactive } = req.query;

    const where: Record<string, unknown> = {};

    if (type && typeof type === "string") {
      where.type = type;
    }
    if (parentId && typeof parentId === "string") {
      where.parentId = parentId;
    }
    if (search && typeof search === "string") {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (includeInactive !== "true") {
      where.isActive = true;
    }

    const locations = await prisma.hubLocation.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        parentId: true,
        fullPath: true,
        publicStatus: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
      take: 200,
    });

    res.json({ locations });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Admin-only endpoints for location management
// =============================================================================

locationsRouter.get(
  "/admin/locations",
  authenticate,
  authorize("admin"),
  async (req: AuthRequest, res, next) => {
    try {
      const { type, parentId, search, includeInactive } = req.query;

      const where: Record<string, unknown> = {};

      if (type && typeof type === "string") where.type = type;
      if (parentId && typeof parentId === "string") where.parentId = parentId;
      if (search && typeof search === "string") {
        where.name = { contains: search, mode: "insensitive" };
      }
      if (includeInactive !== "true") where.isActive = true;

      const locations = await prisma.hubLocation.findMany({
        where,
        orderBy: { name: "asc" },
        take: 500,
      });

      res.json({ locations });
    } catch (error) {
      next(error);
    }
  },
);

export { locationsRouter };
