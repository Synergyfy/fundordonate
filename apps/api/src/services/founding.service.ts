// =============================================================================
// Backend Stub — Founding Service
// Placeholder for backend developer to implement.
// Handles founding programme CRUD, membership grants, and original member tracking.
// =============================================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Grant a founding membership to a user.
 *
 * Steps:
 * 1. Validate programme exists and has capacity
 * 2. Check if user already has a membership for this programme
 * 3. Determine if user is an Original Founding Member (among first N contributors)
 * 4. Create FoundingMembership record
 * 5. Increment programme allocatedCount
 * 6. Create UserBadge record
 * 7. Unlock configured benefits
 *
 * @param userId - The user receiving the membership
 * @param programmeId - The founding programme to join
 * @param contributionAmount - Amount contributed in pence
 * @param isMonthly - Whether this is a monthly recurring membership
 * @returns The created FoundingMembership
 */
export async function grantFoundingMembership(
  userId: string,
  programmeId: string,
  contributionAmount: number,
  isMonthly: boolean = false
) {
  const programme = await prisma.foundingProgramme.findUniqueOrThrow({
    where: { id: programmeId },
    include: { foundingMemberships: true },
  });

  // Check capacity
  if (programme.allocatedCount >= programme.totalAllocation) {
    throw new Error("Programme is fully allocated");
  }

  // Check if user already has membership
  const existing = await prisma.foundingMembership.findUnique({
    where: { userId_programmeId: { userId, programmeId } },
  });
  if (existing) {
    throw new Error("User already has a membership for this programme");
  }

  // Determine if Original Founding Member (among first 10% of allocation)
  const originalThreshold = Math.ceil(programme.totalAllocation * 0.1);
  const isOriginal = programme.allocatedCount < originalThreshold;

  // Create membership
  const membership = await prisma.foundingMembership.create({
    data: {
      userId,
      programmeId,
      locationId: programme.locationId,
      campaignId: programme.campaignId || null,
      status: "ACTIVE",
      contributionAmount,
      grantedAt: new Date(),
      benefitsVersion: "1.0",
    },
  });

  // Update programme allocation
  await prisma.foundingProgramme.update({
    where: { id: programmeId },
    data: { allocatedCount: { increment: 1 } },
  });

  // Create badge
  const badgeType = isOriginal ? "ORIGINAL_FOUNDING" : "FOUNDING_MEMBER";
  // TODO: Create UserBadge record

  // TODO: Unlock benefits based on programme.benefitConfig

  return { ...membership, isOriginal, isMonthly };
}

/**
 * Check if a user is an Original Founding Member for a location.
 */
export async function checkOriginalStatus(userId: string, locationId: string): Promise<boolean> {
  const membership = await prisma.foundingMembership.findFirst({
    where: {
      userId,
      locationId,
      status: "ACTIVE",
    },
    include: { programme: true },
  });

  if (!membership) return false;

  // Check if user was among the first 10% of the programme's allocation
  const programme = membership.programme;
  const originalThreshold = Math.ceil(programme.totalAllocation * 0.1);

  // Count memberships created before this one
  const earlierCount = await prisma.foundingMembership.count({
    where: {
      programmeId: programme.id,
      grantedAt: { lt: membership.grantedAt },
    },
  });

  return earlierCount < originalThreshold;
}

/**
 * Get founding programmes for a location.
 */
export async function getProgrammes(locationId: string) {
  return prisma.foundingProgramme.findMany({
    where: { locationId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Get founding members for a programme.
 */
export async function getProgrammeMembers(programmeId: string) {
  return prisma.foundingMembership.findMany({
    where: { programmeId },
    include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
    orderBy: { grantedAt: "asc" },
  });
}

/**
 * Get a user's founding memberships.
 */
export async function getUserMemberships(userId: string) {
  return prisma.foundingMembership.findMany({
    where: { userId, status: "ACTIVE" },
    include: { programme: true, location: true },
    orderBy: { grantedAt: "desc" },
  });
}
