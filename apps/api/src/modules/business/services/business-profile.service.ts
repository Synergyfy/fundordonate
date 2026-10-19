import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Business, BusinessStatus } from "@prisma/client";
import { BusinessOnboardingDto } from "../dto/business-onboarding.dto";
import { UpdateBusinessProfileDto } from "../dto/update-business-profile.dto";
import { businessRewardOwnershipWhere } from "../business-reward-ownership.util";

@Injectable()
export class BusinessProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates a URL-friendly unique slug from a business name.
   */
  private async generateUniqueSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = baseSlug || "business";
    let counter = 1;

    while (await this.prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Retrieves full profile of a business by ID scoped to owner.
   */
  async getProfile(businessId: string, ownerId?: string): Promise<Business> {
    const business = await this.prisma.business.findFirst({
      where: {
        id: businessId,
        ...(ownerId ? { ownerId } : {}),
      },
      include: {
        settings: true,
        location: true,
        _count: {
          select: {
            campaigns: true,
            contributions: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException("Business not found");
    }

    // Rewards the owner earned (legacy earnedRewards retired). Rewards belong
    // to the person who earned them, so scope to the owner's identity — this
    // excludes rewards contributors earned on the business's campaigns while
    // still counting the owner's own contributions elsewhere.
    const owner = await this.prisma.user.findUnique({
      where: { id: business.ownerId },
      select: { id: true, email: true, mcomUserId: true },
    });

    const earnedRewards = owner
      ? await this.prisma.rewardIssuance.count({
          where: businessRewardOwnershipWhere({
            userId: owner.id,
            emails: [owner.email, business.email],
            mcomUserId: owner.mcomUserId,
          }),
        })
      : 0;

    const profile = {
      ...business,
      _count: { ...business._count, earnedRewards },
    };
    return profile;
  }

  /**
   * Updates business profile fields with strict ownership check at query level.
   */
  async updateProfile(
    businessId: string,
    ownerId: string,
    dto: UpdateBusinessProfileDto,
  ): Promise<Business> {
    const existing = await this.prisma.business.findFirst({
      where: { id: businessId, ownerId },
    });

    if (!existing) {
      throw new NotFoundException("Business not found");
    }

    return this.prisma.business.update({
      where: { id: existing.id },
      data: {
        name: dto.name,
        businessType: dto.businessType,
        registrationNumber: dto.registrationNumber,
        description: dto.description,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        logoUrl: dto.logoUrl,
        coverImageUrl: dto.coverImageUrl,
        category: dto.category,
        subcategories: dto.subcategories,
        preferredAudience: dto.preferredAudience,
        campaignGoal: dto.campaignGoal,
      },
      include: {
        settings: true,
      },
    });
  }

  /**
   * Completes onboarding for a user, creating their business and default settings.
   */
  async onboard(userId: string, dto: BusinessOnboardingDto): Promise<Business> {
    const existingForUser = await this.prisma.business.findFirst({
      where: { ownerId: userId },
    });

    if (existingForUser) {
      throw new ConflictException(
        "A business profile is already associated with this account.",
      );
    }

    const slug = await this.generateUniqueSlug(dto.businessName);

    // Find location ID if matching city/localArea/highStreet exists in HubLocation
    const location = await this.prisma.hubLocation.findFirst({
      where: {
        name: {
          equals: dto.highStreet || dto.localArea || dto.city,
          mode: "insensitive",
        },
      },
    });

    return this.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          ownerId: userId,
          name: dto.businessName,
          slug,
          businessType: dto.businessType,
          registrationNumber: dto.registrationNumber,
          description: dto.description,
          email: dto.email,
          phone: dto.phone,
          website: dto.website,
          city: dto.city,
          localArea: dto.localArea,
          highStreet: dto.highStreet,
          address: dto.address,
          postcode: dto.postcode,
          category: dto.category,
          subcategories: dto.subcategories ?? [],
          preferredAudience: dto.preferredAudience,
          campaignGoal: dto.campaignGoal,
          membershipTier: dto.membershipTier,
          status: BusinessStatus.ACTIVE,
          // NOTE: pre-audit state is owned by 247GBS Audit and populated from a
          // delegated read (Business.auditLinkStatus). The legacy
          // `auditReference` input is no longer stored.
          locationId: location?.id,
          settings: {
            create: {
              emailAlerts: true,
              campaignUpdates: true,
              leaderboardChanges: true,
              rewardsEarned: true,
              newBackers: false,
              weeklyDigest: true,
            },
          },
        },
        include: {
          settings: true,
        },
      });

      // Update user role to business if not set
      await tx.user.update({
        where: { id: userId },
        data: { userType: "business" },
      });

      return business;
    });
  }
}
