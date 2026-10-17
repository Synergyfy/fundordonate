import { Injectable, Logger } from "@nestjs/common";
import {
  BusinessStatus,
  MembershipTier,
  Prisma,
  type Business,
  type Subscription,
  type User,
} from "@prisma/client";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { TokenCipher } from "../common/crypto/token-cipher";
import { McomClient } from "./mcom.client";
import type {
  McomAppPlan,
  McomBusinessProfile,
  McomUser,
  PlatformEntitlement,
} from "./mcom.types";

export interface SyncFromSsoInput {
  mcomUser: McomUser;
  entitlement?: PlatformEntitlement | null;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn?: number;
  };
}

export interface SyncResult {
  user: User;
  isNewUser: boolean;
}

export interface LocalEntitlement {
  planId: string | null;
  planName: string | null;
  source: string | null;
  status: string;
  isTrial: boolean;
  isActive: boolean;
  quotas: Prisma.JsonValue;
  limits: Prisma.JsonValue;
  features: string[];
  tasksToComplete: Prisma.JsonValue;
  membershipPlanName: string | null;
  expiresAt: Date | null;
}

@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: TokenCipher,
    private readonly mcomClient: McomClient,
  ) {}

  /**
   * Just-in-time provision / update the local user from an MCOM identity and
   * sync their platform subscription from the entitlement.
   */
  async syncFromSso(input: SyncFromSsoInput): Promise<SyncResult> {
    const { mcomUser, entitlement, tokens } = input;
    const { role, userType } = this.mapRole(mcomUser.role);
    const businessProfile = mcomUser.businessProfile ?? null;
    const appPlan = businessProfile?.appPlan ?? null;

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ mcomUserId: mcomUser.id }, { email: mcomUser.email }],
      },
    });

    const baseData: Prisma.UserUpdateInput = {
      email: mcomUser.email,
      firstName: mcomUser.firstName ?? existing?.firstName ?? null,
      lastName: mcomUser.lastName ?? existing?.lastName ?? null,
      role,
      userType,
      emailVerified: true,
      mcomUserId: mcomUser.id,
      mcomBusinessId: businessProfile?.id ?? null,
      membershipLevel: businessProfile?.membershipLevel ?? null,
      membershipPlanName: businessProfile?.membershipPlanName ?? null,
      membershipStatus: businessProfile?.membershipStatus ?? null,
      membershipTier: businessProfile?.membershipTier ?? null,
      hasPaidVerificationFee: Boolean(businessProfile?.hasPaidVerificationFee),
      trialAccessExpiresAt: businessProfile?.trialAccessExpiresAt
        ? new Date(businessProfile.trialAccessExpiresAt)
        : null,
      appPlan: appPlan
        ? (appPlan as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      lastSsoSyncAt: new Date(),
      mcomLinkedAt: existing?.mcomLinkedAt ?? new Date(),
    };

    if (tokens) {
      baseData.mcomAccessToken = this.cipher.encrypt(tokens.accessToken);
      baseData.mcomRefreshToken = this.cipher.encrypt(tokens.refreshToken);
      baseData.mcomTokenExpiresAt = new Date(
        Date.now() + (tokens.expiresIn ?? 3600) * 1000,
      );
    }

    let user: User;
    let isNewUser = false;

    if (existing) {
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: baseData,
      });
    } else {
      isNewUser = true;
      user = await this.prisma.user.create({
        data: {
          ...(baseData as Prisma.UserCreateInput),
          username: this.deriveUsername(mcomUser.email),
        },
      });
    }

    await this.syncSubscription(user.id, entitlement ?? null, appPlan);

    // Mirror the Central Hub business profile locally. Owners onboarded through
    // Central already provided this information, so they must never be sent
    // through a second (local) business onboarding flow.
    if (userType === "business") {
      await this.ensureLinkedBusiness(user, businessProfile);
    }

    return { user, isNewUser };
  }

  /**
   * Backfill a local Business for an already-authenticated MCOM business owner
   * (e.g. sessions established before business mirroring existed).
   * Returns true when a business is available for the user afterwards.
   */
  async ensureBusinessForUser(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    const existing = await this.prisma.business.findFirst({
      where: { ownerId: user.id },
      select: { id: true },
    });
    if (existing) return true;

    // Only mirror for business accounts; consumers/admins are left untouched.
    if (user.userType !== "business" && user.role !== "business") {
      return false;
    }

    // Fall back to the cached identity for the name; the next SSO sync will
    // refresh it with the authoritative business name from Central.
    await this.ensureLinkedBusiness(user, {
      businessName:
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
        user.email.split("@")[0],
      membershipTier: user.membershipTier,
    });
    return true;
  }

  /**
   * Create or update the local Business that mirrors a Central Hub business
   * profile. Central is the source of truth for the business name and
   * membership tier.
   */
  private async ensureLinkedBusiness(
    user: User,
    businessProfile: McomBusinessProfile | null = null,
  ): Promise<Business> {
    const name =
      businessProfile?.businessName?.trim() ||
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
      user.email.split("@")[0];

    const membershipTier = this.mapMembershipTier(
      businessProfile?.membershipTier ??
        businessProfile?.membershipLevel ??
        businessProfile?.membershipPlanName,
    );

    const existing = await this.prisma.business.findFirst({
      where: { ownerId: user.id },
    });

    if (existing) {
      return this.prisma.business.update({
        where: { id: existing.id },
        data: {
          ...(businessProfile?.businessName ? { name } : {}),
          membershipTier,
        },
      });
    }

    return this.prisma.business.create({
      data: {
        ownerId: user.id,
        name,
        slug: await this.generateUniqueBusinessSlug(name),
        businessType: "Other",
        category: "Community",
        subcategories: [],
        email: user.email,
        membershipTier,
        status: BusinessStatus.ACTIVE,
        city: "",
        localArea: "",
        highStreet: "",
        postcode: "",
        settings: { create: {} },
      },
    });
  }

  /** Map a Central membership value ("Gold", "Standard", …) to the local enum. */
  private mapMembershipTier(value?: string | null): MembershipTier {
    const raw = (value ?? "").toUpperCase();
    if (raw.includes("PLATINUM")) return MembershipTier.PLATINUM;
    if (raw.includes("GOLD")) return MembershipTier.GOLD;
    if (raw.includes("SILVER")) return MembershipTier.SILVER;
    return MembershipTier.BRONZE;
  }

  /** URL-friendly, collision-free slug for a mirrored business. */
  private async generateUniqueBusinessSlug(name: string): Promise<string> {
    const base =
      name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "business";

    let slug = base;
    let counter = 1;
    while (await this.prisma.business.findUnique({ where: { slug } })) {
      slug = `${base}-${counter}`;
      counter++;
    }
    return slug;
  }

  /** Persist the platform subscription derived from an entitlement. */
  async syncSubscription(
    userId: string,
    entitlement: PlatformEntitlement | null,
    appPlan: McomAppPlan | null,
  ): Promise<Subscription> {
    const access = entitlement?.access;
    const plan = entitlement?.plan ?? null;
    const hasAccess = access?.hasAccess ?? false;
    const isTrial = access?.accessType === "TRIAL_PROGRAMME";

    const quotas = (plan?.quotas ?? appPlan?.quotas ?? {}) as Prisma.InputJsonValue;
    const limits = (plan?.limits ?? appPlan?.limits ?? {}) as Prisma.InputJsonValue;
    const features = plan?.features ?? appPlan?.features ?? [];
    const tasks = (entitlement?.trialContext?.programmeTasks ??
      []) as unknown as Prisma.InputJsonValue;

    const payload = {
      planId: plan?.planId ?? appPlan?.planId ?? null,
      planName: plan?.planName ?? appPlan?.planName ?? null,
      source: plan?.source ?? (isTrial ? "trial" : appPlan?.source ?? null),
      status: plan?.status ?? (hasAccess ? "active" : "inactive"),
      quotas,
      limits,
      features,
      isTrial,
      tasksToComplete: tasks,
      membershipPlanName:
        entitlement?.membershipContext?.membershipPlanName ??
        appPlan?.membershipPlanName ??
        null,
      expiresAt: plan?.expiresAt ? new Date(plan.expiresAt) : null,
      isActive: hasAccess,
      lastSyncedAt: new Date(),
    };

    return this.prisma.subscription.upsert({
      where: { userId },
      update: payload,
      create: { userId, ...payload },
    });
  }

  /** Normalized entitlement/subscription view for the frontend. */
  async buildLocalEntitlement(userId: string): Promise<LocalEntitlement | null> {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) return null;
    return {
      planId: sub.planId,
      planName: sub.planName,
      source: sub.source,
      status: sub.status,
      isTrial: sub.isTrial,
      isActive: sub.isActive,
      quotas: sub.quotas,
      limits: sub.limits,
      features: sub.features,
      tasksToComplete: sub.tasksToComplete,
      membershipPlanName: sub.membershipPlanName,
      expiresAt: sub.expiresAt,
    };
  }

  /** Decrypt the stored Central access token (for proxied billing, Phase 2/3). */
  async getStoredCentralToken(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mcomAccessToken: true },
    });
    if (!user?.mcomAccessToken) return null;
    try {
      return this.cipher.decrypt(user.mcomAccessToken);
    } catch (error) {
      this.logger.warn(`Failed to decrypt Central token: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * A usable Central SSO access token for the user, refreshing it from Central
   * when it is missing or close to expiry. Used as the `subject_token` for
   * RFC 8693 delegated exchanges (e.g. 247GBS Audit reads). Returns `null` when
   * the user has no MCOM link or the refresh fails and no usable token remains.
   */
  async getFreshCentralToken(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        mcomAccessToken: true,
        mcomRefreshToken: true,
        mcomTokenExpiresAt: true,
      },
    });
    if (!user) return null;

    const current = this.tryDecrypt(user.mcomAccessToken);
    const expiringSoon =
      !user.mcomTokenExpiresAt ||
      user.mcomTokenExpiresAt.getTime() <= Date.now() + 60_000;
    if (current && !expiringSoon) return current;

    const refresh = this.tryDecrypt(user.mcomRefreshToken);
    if (!refresh) return current;

    try {
      const tokens = await this.mcomClient.refreshCentralToken(refresh);
      if (!tokens?.accessToken) return current;
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          mcomAccessToken: this.cipher.encrypt(tokens.accessToken),
          ...(tokens.refreshToken
            ? { mcomRefreshToken: this.cipher.encrypt(tokens.refreshToken) }
            : {}),
          mcomTokenExpiresAt: new Date(
            Date.now() + (tokens.expiresIn ?? 3600) * 1000,
          ),
        },
      });
      return tokens.accessToken;
    } catch (error) {
      this.logger.warn(
        `Central token refresh failed for user ${userId}: ${(error as Error).message}`,
      );
      return current;
    }
  }

  /** Decrypt a stored value, returning null instead of throwing. */
  private tryDecrypt(value: string | null | undefined): string | null {
    if (!value) return null;
    try {
      return this.cipher.decrypt(value);
    } catch (error) {
      this.logger.warn(`Failed to decrypt stored token: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * MCOM role → local role/userType.
   * BUSINESS → business, CUSTOMER → consumer, ADMIN → admin.
   */
  private mapRole(mcomRole?: string): { role: string; userType: string } {
    switch ((mcomRole ?? "").toUpperCase()) {
      case "ADMIN":
        return { role: "admin", userType: "admin" };
      case "BUSINESS":
        return { role: "business", userType: "business" };
      case "CUSTOMER":
      case "CONSUMER":
      default:
        return { role: "donor", userType: "consumer" };
    }
  }

  /** SSO users have no username from Central — derive a unique one. */
  private deriveUsername(email: string): string {
    const local = email
      .split("@")[0]
      .replace(/[^a-zA-Z0-9._-]/g, "")
      .slice(0, 24);
    return `${local || "user"}_${randomBytes(3).toString("hex")}`;
  }
}
