import { Injectable, Logger, Inject } from "@nestjs/common";
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
import { REDIS_CLIENT } from "../redis/redis.constants";
import type Redis from "ioredis";
import { mergeWithDefaults, normalizeCapabilities } from "../modules/plans/plan.constants";
import { McomClient } from "./mcom.client";
import type {
  McomAppPlan,
  McomBusinessProfile,
  McomUser,
  McomUserInfo,
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
  /**
   * Effective capability map (`{ [featureKey]: { enabled, limit, unlimited } }`).
   * Empty for legacy Central entitlements.
   */
  capabilities: Prisma.JsonValue;
  entitlementKind: string | null;
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
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Just-in-time provision / update the local user from an MCOM identity and
   * sync their platform subscription from the entitlement.
   */
  async syncFromSso(input: SyncFromSsoInput): Promise<SyncResult> {
    const { mcomUser, entitlement, tokens } = input;
    const { role, userType } = this.mapRole(mcomUser.role);
    const businessProfile = mcomUser.businessProfile ?? null;
    const roleProfile = this.resolveRoleProfile(mcomUser);
    const appPlan = businessProfile?.appPlan ?? mcomUser.appPlan ?? null;

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ mcomUserId: mcomUser.id }, { email: mcomUser.email }],
      },
    });

    const baseData: Prisma.UserUpdateInput = {
      email: mcomUser.email,
      firstName: mcomUser.firstName ?? null,
      lastName: mcomUser.lastName ?? null,
      avatar: mcomUser.avatarUrl ?? businessProfile?.logoUrl ?? null,
      jobTitle: mcomUser.jobTitle ?? null,
      phone: mcomUser.phone ?? roleProfile?.phone ?? null,
      address: mcomUser.address ?? businessProfile?.address ?? null,
      postcode: mcomUser.postcode ?? businessProfile?.postcode ?? null,
      country: mcomUser.country ?? businessProfile?.country ?? null,
      profileType: mcomUser.profileType ?? mcomUser.role ?? null,
      isAffiliate: Boolean(mcomUser.isAffiliate),
      mcomProfile: roleProfile
        ? (roleProfile as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      role,
      userType,
      emailVerified: true,
      mcomUserId: mcomUser.id,
      mcomBusinessId:
        mcomUser.businessId ?? businessProfile?.id ?? null,
      membershipLevel:
        mcomUser.membershipLevel ?? businessProfile?.membershipLevel ?? null,
      membershipPlanName:
        mcomUser.membershipPlanName ??
        businessProfile?.membershipPlanName ??
        null,
      membershipStatus:
        mcomUser.membershipStatus ?? businessProfile?.membershipStatus ?? null,
      membershipTier:
        mcomUser.membershipTier ?? businessProfile?.membershipTier ?? null,
      hasPaidVerificationFee: Boolean(
        mcomUser.hasPaidVerificationFee ??
          businessProfile?.hasPaidVerificationFee,
      ),
      trialAccessExpiresAt: this.toDate(
        mcomUser.trialAccessExpiresAt ?? businessProfile?.trialAccessExpiresAt,
      ),
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

    await this.syncSubscription(
      user.id,
      entitlement ?? null,
      appPlan,
      businessProfile?.membershipTier ?? mcomUser.membershipTier ?? null,
      businessProfile?.membershipExpiresAt ?? null,
    );

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
      phone: user.phone,
      address: user.address,
      postcode: user.postcode,
      country: user.country,
      membershipTier: user.membershipTier,
    });
    return true;
  }

  /**
   * Create or update the local Business that mirrors a Central Hub business
   * profile. Central is the source of truth for every business field — the
   * local record is a read-only cache used for display.
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
      where: {
        OR: [
          { ownerId: user.id },
          ...(businessProfile?.id
            ? [{ mcomBusinessId: businessProfile.id }]
            : []),
        ],
      },
    });

    const shared = {
      ...(businessProfile?.id ? { mcomBusinessId: businessProfile.id } : {}),
      name,
      ...(businessProfile?.businessType
        ? { businessType: businessProfile.businessType }
        : {}),
      ...(businessProfile?.industry !== undefined
        ? { industry: businessProfile.industry }
        : {}),
      ...(businessProfile?.category
        ? { category: businessProfile.category }
        : {}),
      ...(businessProfile?.subCategory !== undefined
        ? { subCategory: businessProfile.subCategory }
        : {}),
      ...(businessProfile?.description !== undefined
        ? { description: businessProfile.description }
        : {}),
      ...(businessProfile?.email ? { email: businessProfile.email } : {}),
      ...(businessProfile?.phone !== undefined
        ? { phone: businessProfile.phone }
        : {}),
      ...(businessProfile?.website !== undefined
        ? { website: businessProfile.website }
        : {}),
      ...(businessProfile?.logoUrl !== undefined
        ? { logoUrl: businessProfile.logoUrl }
        : {}),
      ...(businessProfile?.address !== undefined
        ? { address: businessProfile.address }
        : {}),
      ...(businessProfile?.postcode
        ? { postcode: businessProfile.postcode }
        : {}),
      ...(businessProfile?.country !== undefined
        ? { country: businessProfile.country }
        : {}),
      ...(businessProfile?.openingHours !== undefined
        ? { openingHours: businessProfile.openingHours }
        : {}),
      ...(businessProfile?.socialMedia !== undefined
        ? { socialMedia: businessProfile.socialMedia }
        : {}),
      membershipTier,
      ...(businessProfile?.membershipExpiresAt
        ? { membershipExpiry: this.toDate(businessProfile.membershipExpiresAt) }
        : {}),
    };

    if (existing) {
      return this.prisma.business.update({
        where: { id: existing.id },
        data: shared,
      });
    }

    return this.prisma.business.create({
      data: {
        ...shared,
        ownerId: user.id,
        slug: await this.generateUniqueBusinessSlug(name),
        businessType: businessProfile?.businessType ?? "Other",
        category: businessProfile?.category ?? "Community",
        subcategories: [],
        email: businessProfile?.email ?? user.email,
        status: BusinessStatus.ACTIVE,
        city: "",
        localArea: "",
        highStreet: "",
        postcode: businessProfile?.postcode ?? "",
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

  /**
   * The role-specific profile Central populated for this identity. Only one
   * object is ever non-null; it is cached raw for display and debugging.
   */
  private resolveRoleProfile(mcomUser: McomUser): Record<string, unknown> | null {
    switch ((mcomUser.profileType ?? mcomUser.role ?? "").toUpperCase()) {
      case "CUSTOMER":
        return mcomUser.customerProfile ?? null;
      case "AGENT":
        return mcomUser.agentProfile ?? null;
      case "CONSULTANT":
        return mcomUser.consultantProfile ?? null;
      case "ACCOUNT_MANAGER":
        return mcomUser.accountManagerProfile ?? null;
      default:
        return (
          mcomUser.customerProfile ??
          mcomUser.agentProfile ??
          mcomUser.consultantProfile ??
          mcomUser.accountManagerProfile ??
          null
        );
    }
  }

  /** Parse an optional ISO timestamp from Central. */
  private toDate(value?: string | Date | null): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
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
    membershipTier?: string | null,
    membershipExpiresAt?: string | null,
  ): Promise<Subscription> {
    // A locally purchased plan/access pass is authoritative while it is
    // active. Central SSO sync must never silently downgrade it.
    const local = await this.prisma.userEntitlement.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
      orderBy: { startedAt: "desc" },
    });
    if (local) {
      const capabilities =
        local.capabilities && typeof local.capabilities === "object"
          ? (local.capabilities as Record<string, unknown>)
          : {};
      const features = Object.entries(capabilities)
        .filter(([, rule]) => (rule as { enabled?: boolean })?.enabled)
        .map(([key]) => key);
      const quotas = Object.fromEntries(
        Object.entries(capabilities)
          .filter(([, rule]) => {
            const r = rule as { enabled?: boolean; unlimited?: boolean; limit?: unknown };
            return r?.enabled && !r?.unlimited && typeof r?.limit === "number";
          })
          .map(([key, rule]) => [key, (rule as { limit: number }).limit]),
      );

      const payload = {
        planId: local.planVariantId ?? local.accessPassId ?? null,
        planName: local.planName,
        source: local.kind === "ACCESS_PASS" ? "access_pass" : "plan",
        status: "active",
        quotas: quotas as Prisma.InputJsonValue,
        limits: capabilities as Prisma.InputJsonValue,
        features,
        capabilities: capabilities as Prisma.InputJsonValue,
        entitlementKind: local.kind === "ACCESS_PASS" ? "access_pass" : "plan",
        isTrial: false,
        tasksToComplete: [] as unknown as Prisma.InputJsonValue,
        membershipPlanName: local.planName,
        expiresAt: local.expiresAt,
        isActive: true,
        lastSyncedAt: new Date(),
      };
      const subscription = await this.prisma.subscription.upsert({
        where: { userId },
        update: payload,
        create: { userId, ...payload },
      });
      await this.invalidateCapabilities(userId);
      return subscription;
    }

    const access = entitlement?.access;
    const plan = entitlement?.plan ?? null;
    const hasAccess = access?.hasAccess ?? false;
    const centralIsTrial = access?.accessType === "TRIAL_PROGRAMME";

    // A trial must never replace an already-active paid membership/plan/pass.
    // Central normally resolves this priority itself, but keep the guarantee
    // locally so a stale/regressed trial response cannot downgrade paid access.
    if (centralIsTrial) {
      const existing = await this.prisma.subscription.findUnique({
        where: { userId },
      });
      const hasActivePaidAccess = Boolean(
        existing &&
          existing.isActive &&
          !existing.isTrial &&
          (!existing.expiresAt || existing.expiresAt.getTime() > Date.now()),
      );
      if (hasActivePaidAccess) return existing!;
    }

    // Resolve the local plan/access-pass product behind Central's entitlement.
    // A local catalogue match gives us the authoritative capability map; the
    // generic quotas/features from Central are only a fallback.
    const resolved = entitlement
      ? await this.resolveCentralAccess(entitlement, membershipTier)
      : null;
    const capabilities = resolved?.capabilities ?? {};
    const capabilityEntries = Object.entries(capabilities);
    const enabledFeatures = capabilityEntries
      .filter(([, rule]) => (rule as { enabled?: boolean })?.enabled)
      .map(([key]) => key);
    const derivedQuotas = Object.fromEntries(
      capabilityEntries
        .filter(([, rule]) => {
          const r = rule as {
            enabled?: boolean;
            unlimited?: boolean;
            limit?: unknown;
          };
          return r?.enabled && !r?.unlimited && typeof r?.limit === "number";
        })
        .map(([key, rule]) => [key, (rule as { limit: number }).limit]),
    );

    const features = resolved
      ? enabledFeatures
      : plan?.features ?? appPlan?.features ?? [];
    const tasks = (entitlement?.trialContext?.programmeTasks ??
      []) as unknown as Prisma.InputJsonValue;

    const payload = {
      planId: plan?.planId ?? appPlan?.planId ?? null,
      planName:
        resolved?.planName ?? plan?.planName ?? appPlan?.planName ?? null,
      source: plan?.source ?? (centralIsTrial ? "trial" : appPlan?.source ?? null),
      status: plan?.status ?? (hasAccess ? "active" : "inactive"),
      quotas: (resolved
        ? derivedQuotas
        : plan?.quotas ?? appPlan?.quotas ?? {}) as Prisma.InputJsonValue,
      limits: (resolved
        ? capabilities
        : plan?.limits ?? appPlan?.limits ?? {}) as Prisma.InputJsonValue,
      features,
      capabilities: (resolved ? capabilities : {}) as Prisma.InputJsonValue,
      entitlementKind: resolved?.entitlementKind ?? null,
      isTrial: resolved?.isTrial ?? centralIsTrial,
      tasksToComplete: tasks,
      membershipPlanName:
        entitlement?.membershipContext?.membershipPlanName ??
        appPlan?.membershipPlanName ??
        null,
      expiresAt:
        resolved?.expiresAt ??
        (plan?.expiresAt ? new Date(plan.expiresAt) : null) ??
        (membershipExpiresAt ? new Date(membershipExpiresAt) : null),
      isActive: hasAccess,
      lastSyncedAt: new Date(),
    };

    const subscription = await this.prisma.subscription.upsert({
      where: { userId },
      update: payload,
      create: { userId, ...payload },
    });
    await this.invalidateCapabilities(userId);
    return subscription;
  }

  /** Clear the shared capability snapshot so the next request re-resolves. */
  private async invalidateCapabilities(userId: string): Promise<void> {
    try {
      await this.redis.del(`fd:plan:caps:${userId}`);
    } catch (error) {
      this.logger.warn(
        `Could not clear capability cache for ${userId}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Resolve Central's entitlement to a FundorDonate catalogue product.
   *
   * Central sends `plan.planId` as the ID we published:
   *  - membership → MembershipPlan (or a variant id when Central selected one)
   *  - access pass → AccessPass id
   *  - trial → `trial_<platformSlug>` (no local catalogue row)
   *
   * The local row is authoritative for capabilities. When it cannot be found
   * (e.g. an old/renamed product), we translate Central's quotas/limits into
   * our capability map instead.
   */
  private async resolveCentralAccess(
    entitlement: PlatformEntitlement,
    membershipTier?: string | null,
  ): Promise<{
    capabilities: Record<
      string,
      { enabled: boolean; limit: number | null; unlimited: boolean }
    >;
    planName: string | null;
    entitlementKind: string | null;
    expiresAt: Date | null;
    isTrial: boolean;
  } | null> {
    const plan = entitlement.plan;
    if (!entitlement.access?.hasAccess || !plan) return null;

    const features = await this.prisma.planFeature.findMany({
      where: { isActive: true },
      select: {
        key: true,
        defaultEnabled: true,
        supportsLimit: true,
        defaultLimit: true,
      },
    });

    if (plan.source === "direct") {
      const pass = await this.prisma.accessPass.findUnique({
        where: { id: plan.planId },
      });
      if (pass) {
        return {
          capabilities: mergeWithDefaults(pass.capabilities, features),
          planName: pass.name,
          entitlementKind: "access_pass",
          expiresAt: plan.expiresAt ? new Date(plan.expiresAt) : null,
          isTrial: false,
        };
      }
    }

    if (plan.source === "membership") {
      const variant = await this.findMembershipVariant(
        plan.planId,
        membershipTier,
      );
      if (variant) {
        return {
          capabilities: mergeWithDefaults(variant.capabilities, features),
          planName: variant.name ?? plan.planName,
          entitlementKind: "membership",
          // Membership bundles follow the membership term, not a per-app
          // expiry. Central sends null here; revalidation handles renewal.
          expiresAt: plan.expiresAt ? new Date(plan.expiresAt) : null,
          isTrial: false,
        };
      }
    }

    const mapped = this.capabilitiesFromCentralPlan(plan, features);
    if (plan.source === "trial") {
      return {
        capabilities:
          mapped ??
          normalizeCapabilities(
            {},
            { features, includeDefaults: true },
          ),
        planName: plan.planName ?? "Programme Trial Access",
        entitlementKind: "trial",
        expiresAt: plan.expiresAt ? new Date(plan.expiresAt) : null,
        isTrial: true,
      };
    }

    if (mapped) {
      return {
        capabilities: mapped,
        planName: plan.planName ?? null,
        entitlementKind:
          plan.source === "direct"
            ? "access_pass"
            : plan.source === "membership"
              ? "membership"
              : null,
        expiresAt: plan.expiresAt ? new Date(plan.expiresAt) : null,
        isTrial: false,
      };
    }

    return null;
  }

  private async findMembershipVariant(
    planId: string,
    membershipTier?: string | null,
  ) {
    // Central may pass the variant id when the bundled plan has variants.
    const direct = await this.prisma.membershipPlanVariant.findUnique({
      where: { id: planId },
    });
    if (direct) return direct;

    const parent = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
      include: { variants: { orderBy: { sortOrder: "asc" } } },
    });
    if (!parent) return null;

    const desired = this.mapMembershipTierToAccessLevel(membershipTier);
    return (
      parent.variants.find((variant) => variant.accessLevel === desired) ??
      parent.variants[0] ??
      null
    );
  }

  /** MembershipTier (Free/Normal/Pro/Pro+) → local plan variant. */
  private mapMembershipTierToAccessLevel(
    value?: string | null,
  ): "STANDARD" | "PRO" | "PRO_PLUS" {
    const raw = (value ?? "").toUpperCase().replace(/[\s_-]+/g, "");
    if (raw.includes("PROPLUS") || raw.includes("PRO+")) return "PRO_PLUS";
    if (raw.includes("PRO")) return "PRO";
    return "STANDARD";
  }

  /**
   * Translate MCOM's flat quotas/limits object into capability rules. MCOM
   * access passes carry the feature keys we published in `configuration`.
   */
  private capabilitiesFromCentralPlan(
    plan: NonNullable<PlatformEntitlement["plan"]>,
    features: {
      key: string;
      defaultEnabled: boolean;
      supportsLimit: boolean;
      defaultLimit: number | null;
    }[],
  ): Record<
    string,
    { enabled: boolean; limit: number | null; unlimited: boolean }
  > | null {
    const source = {
      ...(plan.quotas ?? {}),
      ...(plan.limits ?? {}),
    } as Record<string, unknown>;

    const result: Record<
      string,
      { enabled: boolean; limit: number | null; unlimited: boolean }
    > = {};
    let matched = false;

    for (const feature of features) {
      if (!(feature.key in source)) continue;
      matched = true;
      const raw = source[feature.key];

      if (feature.supportsLimit) {
        if (typeof raw === "boolean") {
          result[feature.key] = {
            enabled: raw,
            limit: null,
            unlimited: false,
          };
          continue;
        }
        const value = Number(raw);
        if (!Number.isFinite(value)) {
          result[feature.key] = {
            enabled: feature.defaultEnabled,
            limit: feature.defaultLimit,
            unlimited: false,
          };
          continue;
        }
        result[feature.key] =
          value === -1
            ? { enabled: true, limit: null, unlimited: true }
            : value > 0
              ? { enabled: true, limit: Math.floor(value), unlimited: false }
              : { enabled: false, limit: 0, unlimited: false };
        continue;
      }

      result[feature.key] = {
        enabled: Boolean(raw),
        limit: null,
        unlimited: false,
      };
    }

    return matched
      ? normalizeCapabilities(result, { features, includeDefaults: true })
      : null;
  }

  /** Normalized entitlement/subscription view for the frontend. */
  async buildLocalEntitlement(userId: string): Promise<LocalEntitlement | null> {
    const local = await this.prisma.userEntitlement.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        expiresAt: { gt: new Date() },
      },
      orderBy: { startedAt: "desc" },
    });
    if (local) {
      const capabilities =
        local.capabilities && typeof local.capabilities === "object"
          ? (local.capabilities as Record<string, unknown>)
          : {};
      const features = Object.entries(capabilities)
        .filter(([, rule]) => (rule as { enabled?: boolean })?.enabled)
        .map(([key]) => key);
      const quotas = Object.fromEntries(
        Object.entries(capabilities)
          .filter(([, rule]) => {
            const r = rule as { enabled?: boolean; unlimited?: boolean; limit?: unknown };
            return r?.enabled && !r?.unlimited && typeof r?.limit === "number";
          })
          .map(([key, rule]) => [key, (rule as { limit: number }).limit]),
      );

      return {
        planId: local.planVariantId ?? local.accessPassId ?? null,
        planName: local.planName,
        source: local.kind === "ACCESS_PASS" ? "access_pass" : "plan",
        status: "active",
        isTrial: false,
        isActive: true,
        quotas: quotas as Prisma.JsonValue,
        limits: capabilities as Prisma.JsonValue,
        features,
        capabilities: capabilities as Prisma.JsonValue,
        entitlementKind: local.kind === "ACCESS_PASS" ? "access_pass" : "plan",
        tasksToComplete: [] as unknown as Prisma.JsonValue,
        membershipPlanName: local.planName,
        expiresAt: local.expiresAt,
      };
    }

    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub) return null;
    return {
      planId: sub.planId,
      planName: sub.planName,
      source: sub.source,
      status: sub.status,
      isTrial: sub.isTrial,
      isActive:
        sub.isActive && (!sub.expiresAt || sub.expiresAt.getTime() > Date.now()),
      quotas: sub.quotas,
      limits: sub.limits,
      features: sub.features,
      capabilities: sub.capabilities,
      entitlementKind: sub.entitlementKind,
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

  /**
   * Re-read the user's identity from Central Hub when the cached snapshot is
   * older than `maxAgeMs` (default 30 minutes). Used on session hydration so
   * profile edits made in Central appear without forcing a re-login.
   *
   * Never throws: identity display falls back to the local cache when Central
   * is unreachable.
   */
  async refreshIdentityFromCentral(
    userId: string,
    maxAgeMs = 30 * 60 * 1000,
  ): Promise<User | null> {
    const cached = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { mcomUserId: true, lastSsoSyncAt: true },
    });
    if (!cached?.mcomUserId) return null;
    if (
      cached.lastSsoSyncAt &&
      Date.now() - cached.lastSsoSyncAt.getTime() < maxAgeMs
    ) {
      return null;
    }

    const accessToken = await this.getFreshCentralToken(userId);
    if (!accessToken) return null;

    try {
      const info = await this.mcomClient.getUserInfo(accessToken, 4000);
      const { user } = await this.syncFromSso({
        mcomUser: this.normalizeIdentity(info),
        entitlement: info.entitlement ?? null,
      });
      return user;
    } catch (error) {
      this.logger.warn(
        `Central identity refresh failed for user ${userId}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /** Central returns `id` on userinfo but may use `sub` in other surfaces. */
  private normalizeIdentity(raw: McomUserInfo): McomUser {
    return {
      ...raw,
      id: (raw.id ?? raw.sub ?? raw.email) as string,
      businessProfile: raw.businessProfile ?? null,
    };
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
   * BUSINESS → business. Every other Central role (CUSTOMER, AGENT,
   * CONSULTANT, ACCOUNT_MANAGER, PARTNER) is a consumer on FundOrDonate.
   * ADMIN → admin (local password login only — never SSO).
   */
  private mapRole(mcomRole?: string): { role: string; userType: string } {
    switch ((mcomRole ?? "").toUpperCase()) {
      case "ADMIN":
        return { role: "admin", userType: "admin" };
      case "BUSINESS":
        return { role: "business", userType: "business" };
      case "CUSTOMER":
      case "CONSUMER":
      case "AGENT":
      case "CONSULTANT":
      case "ACCOUNT_MANAGER":
      case "PARTNER":
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
