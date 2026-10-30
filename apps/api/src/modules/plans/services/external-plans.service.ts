import { BadRequestException, Injectable } from "@nestjs/common";
import { PlanAccessLevel } from "@prisma/client";
import { PlanCatalogService } from "./plan-catalog.service";
import { CreatePlanDto, PlanVariantDto, UpdatePlanDto } from "../dto/plan.dto";
import { ExternalPlanDto } from "../dto/external-plan.dto";

interface FeatureDefinition {
  key: string;
  name: string;
  supportsLimit: boolean;
  defaultEnabled: boolean;
  isActive: boolean;
}

interface CapabilityRule {
  enabled: boolean;
  limit: number | null;
  unlimited: boolean;
}

type JsonRecord = Record<string, unknown>;

const TIER_ORDER: PlanAccessLevel[] = [
  PlanAccessLevel.STANDARD,
  PlanAccessLevel.PRO,
  PlanAccessLevel.PRO_PLUS,
];

const TIER_LABEL: Record<PlanAccessLevel, string> = {
  STANDARD: "Standard",
  PRO: "Pro",
  PRO_PLUS: "Pro+",
};

const TIER_FROM_TOP_LEVEL: Record<PlanAccessLevel, keyof ExternalPlanDto> = {
  STANDARD: "monthlyPrice",
  PRO: "quarterlyPrice",
  PRO_PLUS: "annualPrice",
};

/**
 * Adapter between MCOM Console's Generic Billing API contract and
 * FundorDonate's internal plan catalogue.
 *
 * MCOM prices are major units (pounds); FundorDonate stores minor units
 * (pence). MCOM describes limits as `configuration.quotas` (with `-1` meaning
 * unlimited) and switches as `configuration.featureFlags`; FundorDonate stores
 * a single capability map of `{ enabled, limit, unlimited }`.
 */
@Injectable()
export class ExternalPlansService {
  constructor(private readonly catalog: PlanCatalogService) {}

  /** Plan schema consumed by the dynamic MCOM plan form. */
  async getSchema() {
    const features = await this.catalog.listFeatures();
    const active = features.filter((feature) => feature.isActive);

    return {
      quotas: active
        .filter((feature) => feature.supportsLimit)
        .map((feature) => ({
          key: feature.key,
          label: feature.name,
          type: "number" as const,
          unlimited: true,
        })),
      featureFlags: active
        .filter((feature) => !feature.supportsLimit)
        .map((feature) => ({
          key: feature.key,
          label: feature.name,
          type: "boolean" as const,
        })),
    };
  }

  async listPlans() {
    const [plans, features] = await Promise.all([
      this.catalog.listPlans(true),
      this.catalog.listFeatures(),
    ]);
    return plans.map((plan) => this.toExternalPlan(plan, features));
  }

  async getPlan(id: string) {
    const [plan, features] = await Promise.all([
      this.catalog.getPlan(id),
      this.catalog.listFeatures(),
    ]);
    return this.toExternalPlan(plan, features);
  }

  async createPlan(dto: ExternalPlanDto) {
    if (!dto.name?.trim()) {
      throw new BadRequestException("A plan name is required.");
    }

    const features = await this.catalog.listFeatures();
    const internal: CreatePlanDto = {
      name: dto.name.trim(),
      slug: dto.slug,
      description: dto.description ?? null,
      isActive: dto.isActive ?? true,
      variants: this.toVariantDtos(dto, features),
    };

    const plan = await this.catalog.createPlan(internal);
    return this.toExternalPlan(plan, features);
  }

  async updatePlan(id: string, dto: ExternalPlanDto) {
    const features = await this.catalog.listFeatures();
    const internal: UpdatePlanDto = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.variants?.length || this.hasTopLevelPrices(dto)
        ? { variants: this.toVariantDtos(dto, features) }
        : {}),
    };

    const plan = await this.catalog.updatePlan(id, internal);
    return this.toExternalPlan(plan, features);
  }

  deletePlan(id: string) {
    return this.catalog.deletePlan(id);
  }

  /** Access pass catalogue consumed by MCOM's access-pass bundle builder. */
  async listAccessPasses() {
    const [passes, features] = await Promise.all([
      this.catalog.listAccessPasses(false),
      this.catalog.listFeatures(),
    ]);

    return passes.map((pass) => {
      const capabilities = this.asCapabilityMap(pass.capabilities);
      return {
        id: pass.id,
        name: pass.name,
        slug: pass.slug,
        description: pass.description ?? null,
        price: pass.priceMinor / 100,
        currency: pass.currency,
        durationDays: pass.durationDays,
        features: this.displayFeatures(pass.features, capabilities, features),
        configuration: this.toConfiguration(capabilities, features),
        isActive: pass.isActive,
        purchaseEnabled: pass.isActive,
        codeRedemptionEnabled: pass.isActive,
      };
    });
  }

  // ── Internal → MCOM ─────────────────────────────────────────────────────

  private toExternalPlan(plan: any, features: FeatureDefinition[]) {
    const variants = (plan.variants ?? []).map((variant: any) =>
      this.toExternalVariant(variant, features)
    );
    const byTier = new Map(variants.map((variant: any) => [variant.tier, variant]));
    const standard = byTier.get(PlanAccessLevel.STANDARD) ?? variants[0];

    const tierPrices: Record<string, number> = {};
    const tierFeatures: Record<string, string[]> = {};
    for (const variant of variants) {
      const label = TIER_LABEL[variant.tier as PlanAccessLevel];
      if (!label) continue;
      if (variant.price != null) tierPrices[label] = variant.price;
      tierFeatures[label] = variant.features ?? [];
    }

    return {
      id: plan.id,
      name: plan.name,
      slug: plan.slug,
      description: plan.description ?? null,
      variants,
      tierPrices,
      tierFeatures,
      tierDurations: {
        Standard: 90,
        Pro: 180,
        "Pro+": 365,
      },
      monthlyPrice: tierPrices.Standard,
      quarterlyPrice: tierPrices.Pro,
      annualPrice: tierPrices["Pro+"],
      features: standard?.features ?? [],
      configuration: standard?.configuration ?? { quotas: {}, featureFlags: {} },
      isActive: plan.isActive ?? true,
      isDefault: false,
      type: "STANDARD",
      created_at: this.iso(plan.createdAt),
      updated_at: this.iso(plan.updatedAt),
    };
  }

  private toExternalVariant(variant: any, features: FeatureDefinition[]) {
    const capabilities = this.asCapabilityMap(variant.capabilities);

    return {
      id: variant.id,
      tier: variant.accessLevel as PlanAccessLevel,
      price: variant.priceMinor / 100,
      features: this.displayFeatures(variant.features, capabilities, features),
      configuration: this.toConfiguration(capabilities, features),
      isActive: variant.isActive ?? true,
    };
  }

  private toConfiguration(capabilities: CapabilityRuleMap, features: FeatureDefinition[]) {
    const quotas: Record<string, number> = {};
    const featureFlags: Record<string, boolean> = {};

    for (const feature of features) {
      if (!feature.isActive) continue;
      const rule = capabilities[feature.key];

      if (feature.supportsLimit) {
        quotas[feature.key] =
          !rule || rule.enabled === false
            ? 0
            : rule.unlimited
              ? -1
              : typeof rule.limit === "number"
                ? rule.limit
                : -1;
      } else {
        featureFlags[feature.key] = Boolean(rule?.enabled ?? feature.defaultEnabled);
      }
    }

    return { quotas, featureFlags };
  }

  private displayFeatures(
    stored: unknown,
    capabilities: CapabilityRuleMap,
    features: FeatureDefinition[]
  ): string[] {
    if (Array.isArray(stored) && stored.length > 0) {
      return stored.map(String);
    }

    return features
      .filter((feature) => feature.isActive && capabilities[feature.key]?.enabled)
      .map((feature) => feature.name);
  }

  // ── MCOM → Internal ─────────────────────────────────────────────────────

  private toVariantDtos(dto: ExternalPlanDto, features: FeatureDefinition[]): PlanVariantDto[] {
    const explicit = dto.variants ?? [];
    const variants: PlanVariantDto[] = [];

    for (const tier of TIER_ORDER) {
      const incoming = explicit.find((variant) => this.normalizeTier(variant.tier) === tier);

      const price = this.toMinor(incoming?.price ?? this.topLevelPrice(dto, tier));
      if (price === undefined) continue;

      const configuration = this.asRecord(incoming?.configuration ?? dto.configuration);
      const displayFeatures =
        incoming?.features ?? (tier === PlanAccessLevel.STANDARD ? dto.features : undefined) ?? [];

      variants.push({
        accessLevel: tier,
        priceMinor: price,
        currency: "GBP",
        isActive: incoming?.isActive ?? dto.isActive ?? true,
        features: displayFeatures,
        capabilities: this.toCapabilities(configuration, features),
      });
    }

    return variants;
  }

  private toCapabilities(
    configuration: JsonRecord | undefined,
    features: FeatureDefinition[]
  ): Record<string, CapabilityRule> | undefined {
    if (!configuration) return undefined;

    const quotas = this.asRecord(configuration.quotas) ?? {};
    const flags = this.asRecord(configuration.featureFlags) ?? {};
    const result: Record<string, CapabilityRule> = {};

    for (const feature of features) {
      if (!feature.isActive) continue;

      if (feature.supportsLimit) {
        const quota = quotas[feature.key];
        if (quota !== undefined && quota !== null) {
          const value = Number(quota);
          if (Number.isFinite(value)) {
            result[feature.key] =
              value === -1
                ? { enabled: true, unlimited: true, limit: null }
                : value > 0
                  ? {
                      enabled: true,
                      unlimited: false,
                      limit: Math.floor(value),
                    }
                  : { enabled: false, unlimited: false, limit: 0 };
            continue;
          }
        }

        const flag = flags[feature.key];
        if (flag !== undefined) {
          result[feature.key] = {
            enabled: Boolean(flag),
            unlimited: false,
            limit: null,
          };
        }
        continue;
      }

      const flag = flags[feature.key] ?? quotas[feature.key];
      if (flag !== undefined) {
        result[feature.key] = {
          enabled: Boolean(flag),
          unlimited: false,
          limit: null,
        };
      }
    }

    return result;
  }

  private normalizeTier(tier?: string): PlanAccessLevel | null {
    if (!tier) return null;
    const normalized = tier
      .trim()
      .toUpperCase()
      .replace(/[\s-]+/g, "_");

    if (normalized === PlanAccessLevel.STANDARD) return PlanAccessLevel.STANDARD;
    if (normalized === PlanAccessLevel.PRO) return PlanAccessLevel.PRO;
    if (normalized === "PRO_PLUS" || normalized === "PRO+") {
      return PlanAccessLevel.PRO_PLUS;
    }
    return null;
  }

  private topLevelPrice(dto: ExternalPlanDto, tier: PlanAccessLevel): number | undefined {
    const key = TIER_FROM_TOP_LEVEL[tier];
    const value = dto[key];
    return typeof value === "number" ? value : undefined;
  }

  private hasTopLevelPrices(dto: ExternalPlanDto): boolean {
    return TIER_ORDER.some((tier) => this.topLevelPrice(dto, tier) !== undefined);
  }

  private toMinor(value: unknown): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return undefined;
    return Math.round(numeric * 100);
  }

  private asRecord(value: unknown): JsonRecord | undefined {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as JsonRecord)
      : undefined;
  }

  private asCapabilityMap(value: unknown): CapabilityRuleMap {
    return (this.asRecord(value) as CapabilityRuleMap | undefined) ?? {};
  }

  private iso(value: unknown): string | undefined {
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string") return value;
    return undefined;
  }
}

type CapabilityRuleMap = Record<string, CapabilityRule>;
