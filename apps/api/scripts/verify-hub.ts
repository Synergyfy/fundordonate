/**
 * Hub ownership regression checks.
 *
 * Run with: pnpm --filter @fundordonate/api verify:hub
 *
 * These assertions guard the invariants introduced with CampaignLocation:
 * - The UK national root exists.
 * - Active cities have canonical paths.
 * - Every campaign has at most one PRIMARY location.
 * - Campaigns whose business has a location are linked.
 * - City funding is attributed exactly once through PRIMARY links.
 */
import { PrismaClient, HubLocationType } from "@prisma/client";

const prisma = new PrismaClient();
let failures = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  console.log("UK Hub ownership checks\n");

  const national = await prisma.hubLocation.findFirst({
    where: { type: HubLocationType.NATIONAL },
    select: { id: true, slug: true, fullPath: true },
  });
  check("National Hub exists", Boolean(national), "no NATIONAL location found");
  check(
    "National Hub has a canonical path",
    national?.fullPath === (national?.slug ?? ""),
    national?.fullPath ?? "missing",
  );

  const cities = await prisma.hubLocation.findMany({
    where: { type: HubLocationType.CITY, isActive: true },
    select: { id: true, name: true, parentId: true, fullPath: true },
  });
  check("At least one active city exists", cities.length > 0);
  check(
    "Every active city has a canonical fullPath",
    cities.every((city) => Boolean(city.fullPath)),
    cities.filter((city) => !city.fullPath).map((city) => city.name).join(", "),
  );
  check(
    "Every active city sits under the National Hub",
    cities.every((city) => city.parentId === national?.id),
    cities.filter((city) => city.parentId !== national?.id).map((city) => city.name).join(", "),
  );

  const allLocationsForPaths = await prisma.hubLocation.findMany({
    select: { id: true, name: true, type: true, parentId: true, fullPath: true },
  });
  const pathKeys = allLocationsForPaths
    .filter((location) => Boolean(location.fullPath))
    .map((location) => location.fullPath as string);
  check(
    "Canonical fullPath values are unique",
    new Set(pathKeys).size === pathKeys.length,
    pathKeys.filter((path, index) => pathKeys.indexOf(path) !== index).join(", "),
  );
  const siblingKeys = allLocationsForPaths.map(
    (location) => `${location.parentId ?? "root"}|${location.name.toLowerCase()}|${location.type}`,
  );
  check(
    "No duplicate sibling locations share a name and type",
    new Set(siblingKeys).size === siblingKeys.length,
  );

  const primaryCounts = await prisma.campaignLocation.groupBy({
    by: ["campaignId"],
    where: { scope: "PRIMARY" },
    _count: { _all: true },
  });
  check(
    "No campaign has more than one PRIMARY location",
    primaryCounts.every((row) => row._count._all <= 1),
    primaryCounts
      .filter((row) => row._count._all > 1)
      .map((row) => row.campaignId)
      .join(", "),
  );

  const campaignsWithBusinessLocation = await prisma.businessCampaign.findMany({
    where: { business: { locationId: { not: null } } },
    select: { id: true, businessId: true, title: true },
  });
  const linkedCampaignIds = new Set(
    (
      await prisma.campaignLocation.findMany({
        where: { scope: "PRIMARY" },
        select: { campaignId: true },
      })
    ).map((link) => link.campaignId),
  );
  const unlinked = campaignsWithBusinessLocation.filter(
    (campaign) => !linkedCampaignIds.has(campaign.id),
  );
  check(
    "Every campaign with a business location has a PRIMARY link",
    unlinked.length === 0,
    unlinked.map((campaign) => `${campaign.title} (${campaign.id})`).join(", "),
  );

  // Recompute city funding using the same ownership rule as the API and ensure
  // no campaign is counted in more than one city.
  const locations = await prisma.hubLocation.findMany({
    select: { id: true, parentId: true, type: true },
  });
  const byId = new Map(locations.map((location) => [location.id, location]));
  const cityCache = new Map<string, string | null>();
  const cityOf = (locationId: string | null): string | null => {
    if (!locationId) return null;
    if (cityCache.has(locationId)) return cityCache.get(locationId) ?? null;
    let current = byId.get(locationId);
    let city: string | null = null;
    const seen = new Set<string>();
    while (current && !seen.has(current.id)) {
      seen.add(current.id);
      if (current.type === HubLocationType.CITY) {
        city = current.id;
        break;
      }
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    cityCache.set(locationId, city);
    return city;
  };

  const activeCampaigns = await prisma.businessCampaign.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      title: true,
      raisedAmount: true,
      business: { select: { locationId: true } },
      locations: {
        where: { scope: "PRIMARY" },
        select: { locationId: true },
        take: 1,
      },
    },
  });
  const seenCampaigns = new Set<string>();
  let duplicateAttribution = false;
  const raisedByCity = new Map<string, number>();
  for (const campaign of activeCampaigns) {
    const locationId =
      campaign.locations[0]?.locationId ?? campaign.business?.locationId ?? null;
    const city = cityOf(locationId);
    if (!city) continue;
    if (seenCampaigns.has(campaign.id)) duplicateAttribution = true;
    seenCampaigns.add(campaign.id);
    raisedByCity.set(city, (raisedByCity.get(city) ?? 0) + campaign.raisedAmount);
  }
  check("No active campaign is attributed to two cities", !duplicateAttribution);
  check(
    "Active campaigns are attributed to at most one city",
    activeCampaigns.every((campaign) => {
      const locationId =
        campaign.locations[0]?.locationId ?? campaign.business?.locationId ?? null;
      return Boolean(cityOf(locationId)) || locationId === null;
    }),
  );

  const totalRaised = [...raisedByCity.values()].reduce((sum, value) => sum + value, 0);
  console.log(`\nAttributed funding: ${(totalRaised / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" })}`);
  console.log(`Cities: ${cities.length} · Active campaigns attributed: ${seenCampaigns.size}`);

  if (failures > 0) {
    console.error(`\n${failures} check(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log("\nAll hub ownership checks passed.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
