import { ForbiddenException, Inject, Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";
import type Redis from "ioredis";
import { PrismaService } from "@/prisma/prisma.service";
import { REDIS_CLIENT } from "@/redis/redis.constants";
import {
  FEATURES,
  mergeWithDefaults,
  normalizeCapabilities,
  type CapabilityMap,
  type CapabilityRule,
} from "../plan.constants";

export interface EffectiveCapabilities {
  source: "plan" | "access_pass" | "mcom" | "default";
  kind: string | null;
  planName: string | null;
  expiresAt: Date | null;
  capabilities: CapabilityMap;
  /** Stable hash of the effective snapshot. Used for lightweight client checks. */
  version: string;
}

interface FeatureRow {
  key: string;
  name: string;
  defaultEnabled: boolean;
  supportsLimit: boolean;
  defaultLimit: number | null;
}

/**
 * Resolves the capabilities a user currently has and enforces feature gates.
 *
 * Resolution order:
 *  1. an ACTIVE local entitlement (plan or access pass) — authoritative;
 *  2. an active MCOM Central subscription (legacy features[] mapped to caps);
 *  3. the per-feature defaults configured by an admin (freemium baseline).
 */
@Injectable()
export class CapabilityService {
  private readonly logger = new Logger(CapabilityService.name);
  private featureCache: { at: number; rows: FeatureRow[] } | null = null;
  /**
   * Very short in-process cache. Most requests in a dashboard session reuse the
   * same snapshot; explicit invalidation happens on purchase/activation.
   */
  private readonly localCache = new Map<
    string,
    { at: number; value: EffectiveCapabilities }
  >();
  private readonly LOCAL_TTL_MS = 20_000;
  private readonly REDIS_TTL_SECONDS = 300;
  private readonly REDIS_PREFIX = "fd:plan:caps:";

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async features(): Promise<FeatureRow[]> {
    const now = Date.now();
    if (this.featureCache && now - this.featureCache.at < 30_000) {
      return this.featureCache.rows;
    }
    const rows = await this.prisma.planFeature.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: {
        key: true,
        name: true,
        defaultEnabled: true,
        supportsLimit: true,
        defaultLimit: true,
      },
    });
    this.featureCache = { at: now, rows };
    return rows;
  }

  /** Drop all caches after admin edits to feature defaults. */
  invalidateFeatureCache(): void {
    this.featureCache = null;
    void this.invalidateAll();
  }

  /** Drop one user's cached capabilities (call after activation/forfeit/refund). */
  async invalidate(userId: string): Promise<void> {
    this.localCache.delete(userId);
    try {
      await this.redis.del(`${this.REDIS_PREFIX}${userId}`);
    } catch (error) {
      this.logger.warn(
        `Could not clear capability cache for ${userId}: ${(error as Error).message}`,
      );
    }
  }

  /** Drop every cached capability snapshot (feature/default edits). */
  async invalidateAll(): Promise<void> {
    this.localCache.clear();
    try {
      let cursor = "0";
      do {
        const [next, keys] = await this.redis.scan(
          cursor,
          "MATCH",
          `${this.REDIS_PREFIX}*`,
          "COUNT",
          200,
        );
        cursor = next;
        if (keys.length) await this.redis.del(...keys);
      } while (cursor !== "0");
    } catch (error) {
      this.logger.warn(
        `Could not clear capability caches: ${(error as Error).message}`,
      );
    }
  }

  async resolve(userId: string): Promise<EffectiveCapabilities> {
    const local = this.localCache.get(userId);
    if (local && Date.now() - local.at < this.LOCAL_TTL_MS) {
      if (!this.isExpired(local.value)) return local.value;
      this.localCache.delete(userId);
    }

    const redisKey = `${this.REDIS_PREFIX}${userId}`;
    try {
      const cached = await this.redis.get(redisKey);
      if (cached) {
        const value = this.hydrate(JSON.parse(cached));
        if (!this.isExpired(value)) {
          this.localCache.set(userId, { at: Date.now(), value });
          return value;
        }
        await this.redis.del(redisKey);
      }
    } catch (error) {
      this.logger.warn(
        `Could not read capability cache for ${userId}: ${(error as Error).message}`,
      );
    }

    const value = this.withVersion(await this.resolveFromDatabase(userId));
    this.localCache.set(userId, { at: Date.now(), value });
    try {
      await this.redis.setex(
        redisKey,
        this.REDIS_TTL_SECONDS,
        JSON.stringify(value),
      );
    } catch (error) {
      this.logger.warn(
        `Could not write capability cache for ${userId}: ${(error as Error).message}`,
      );
    }
    return value;
  }

  private async resolveFromDatabase(
    userId: string,
  ): Promise<Omit<EffectiveCapabilities, "version">> {
    const now = new Date();
    const features = await this.features();

    const entitlement = await this.prisma.userEntitlement.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        expiresAt: { gt: now },
      },
      orderBy: { startedAt: "desc" },
    });

    if (entitlement) {
      return {
        source:
          entitlement.kind === "ACCESS_PASS" ? "access_pass" : "plan",
        kind: entitlement.kind,
        planName: entitlement.planName,
        expiresAt: entitlement.expiresAt,
        capabilities: mergeWithDefaults(entitlement.capabilities, features),
      };
    }

    // Lazily expire anything whose window has elapsed.
    await this.prisma.userEntitlement.updateMany({
      where: {
        userId,
        status: "ACTIVE",
        expiresAt: { lte: now },
      },
      data: { status: "EXPIRED" },
    });

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });
    if (
      subscription?.isActive &&
      (!subscription.expiresAt || subscription.expiresAt > now)
    ) {
      const stored =
        subscription.capabilities &&
        typeof subscription.capabilities === "object" &&
        !Array.isArray(subscription.capabilities) &&
        Object.keys(subscription.capabilities as Record<string, unknown>).length >
          0
          ? subscription.capabilities
          : null;

      if (stored) {
        return {
          source: "mcom",
          kind: subscription.entitlementKind ?? null,
          planName: subscription.planName,
          expiresAt: subscription.expiresAt,
          capabilities: mergeWithDefaults(stored, features),
        };
      }

      // Legacy MCOM entitlement: map a flat feature list to capabilities.
      const enabled = new Set(subscription.features ?? []);
      const capabilities = normalizeCapabilities(
        Object.fromEntries(
          features.map((f) => [
            f.key,
            {
              enabled:
                enabled.has(f.key) ||
                enabled.has(f.key.split(".")[0]) ||
                enabled.has(f.key.toUpperCase()),
              unlimited: true,
              limit: f.defaultLimit,
            },
          ]),
        ),
        { features, includeDefaults: true },
      );
      return {
        source: "mcom",
        kind: subscription.entitlementKind ?? null,
        planName: subscription.planName,
        expiresAt: subscription.expiresAt,
        capabilities,
      };
    }

    return {
      source: "default",
      kind: null,
      planName: null,
      expiresAt: null,
      capabilities: normalizeCapabilities({}, { features, includeDefaults: true }),
    };
  }

  private isExpired(value: EffectiveCapabilities): boolean {
    return Boolean(value.expiresAt && value.expiresAt.getTime() <= Date.now());
  }

  private withVersion(
    value: Omit<EffectiveCapabilities, "version">,
  ): EffectiveCapabilities {
    const hash = createHash("sha256")
      .update(
        JSON.stringify({
          source: value.source,
          kind: value.kind,
          planName: value.planName,
          expiresAt: value.expiresAt?.toISOString() ?? null,
          capabilities: value.capabilities,
        }),
      )
      .digest("hex")
      .slice(0, 16);
    return { ...value, version: hash };
  }

  private hydrate(raw: unknown): EffectiveCapabilities {
    const value = raw as Omit<EffectiveCapabilities, "version"> & {
      expiresAt: string | null;
    };
    return {
      source: value.source,
      kind: value.kind,
      planName: value.planName,
      expiresAt: value.expiresAt ? new Date(value.expiresAt) : null,
      capabilities: value.capabilities,
      version: (value as { version?: string }).version ?? this.withVersion(value).version,
    };
  }

  async getRule(userId: string, featureKey: string): Promise<CapabilityRule> {
    const effective = await this.resolve(userId);
    return (
      effective.capabilities[featureKey] ?? {
        enabled: false,
        limit: null,
        unlimited: false,
      }
    );
  }

  async isEnabled(userId: string, featureKey: string): Promise<boolean> {
    const effective = await this.resolve(userId);
    return Boolean(effective.capabilities[featureKey]?.enabled);
  }

  /**
   * Numeric quota for a feature. `null` means unlimited (or the feature itself
   * does not carry a quota).
   */
  async getLimit(userId: string, featureKey: string): Promise<number | null> {
    const effective = await this.resolve(userId);
    const rule = effective.capabilities[featureKey];
    if (!rule) return null;
    if (rule.unlimited) return null;
    return typeof rule.limit === "number" ? rule.limit : null;
  }

  /** Throws 403 when the user's current plan lacks the feature. */
  async assertFeature(userId: string, featureKey: string): Promise<void> {
    const effective = await this.resolve(userId);
    const rule = effective.capabilities[featureKey];
    if (rule?.enabled) return;

    const feature = await this.prisma.planFeature.findUnique({
      where: { key: featureKey },
      select: { name: true },
    });
    const label = feature?.name ?? featureKey;
    throw new ForbiddenException({
      statusCode: 403,
      error: "FeatureNotAvailable",
      message: `Your current plan does not include ${label}. Upgrade your plan to unlock it.`,
      details: {
        feature: featureKey,
        featureName: label,
        source: effective.source,
        planName: effective.planName,
        expiresAt: effective.expiresAt,
      },
    });
  }

  /**
   * Enforce a quota. Returns the current count and the configured limit so the
   * caller can put a helpful message in the error.
   */
  async assertWithinLimit(
    userId: string,
    featureKey: string,
    currentCount: number,
    label: string,
  ): Promise<void> {
    const effective = await this.resolve(userId);
    const rule = effective.capabilities[featureKey];
    if (!rule?.enabled) {
      await this.assertFeature(userId, featureKey);
      return;
    }
    if (rule.unlimited) return;
    const limit = typeof rule.limit === "number" ? rule.limit : null;
    if (limit === null) return;
    if (currentCount >= limit) {
      throw new ForbiddenException({
        statusCode: 403,
        error: "PlanLimitReached",
        message:
          limit === 0
            ? `Your current plan does not allow ${label}.`
            : `Your current plan allows ${limit} ${label}${limit === 1 ? "" : "s"}. Upgrade to add more.`,
        details: {
          feature: featureKey,
          featureName: label,
          limit,
          currentCount,
          source: effective.source,
          planName: effective.planName,
        },
      });
    }
  }

  /** Convenience helpers used by campaign/reward services. */
  async assertCampaignCreation(userId: string): Promise<void> {
    await this.assertFeature(userId, FEATURES.CAMPAIGN_CREATION);
  }
}
