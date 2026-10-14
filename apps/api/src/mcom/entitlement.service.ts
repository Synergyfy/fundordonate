import { Injectable, Logger } from "@nestjs/common";
import { Prisma, type Subscription, type User } from "@prisma/client";
import { randomBytes } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { TokenCipher } from "../common/crypto/token-cipher";
import type {
  McomAppPlan,
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

    return { user, isNewUser };
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
