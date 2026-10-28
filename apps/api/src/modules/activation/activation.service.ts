import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import {
  BusinessCampaignStatus,
  ContributionStatus,
  HubLocationType,
  PreferredAudience,
  Prisma,
} from "@prisma/client";
import Redis from "ioredis";
import { PrismaService } from "@/prisma/prisma.service";
import { REDIS_CLIENT } from "@/redis/redis.constants";

export type RuleLogic = "AND" | "OR";
export type RuleAudience = "all" | "business" | "consumer";
export type RuleType =
  | "campaign_coverage"
  | "campaign_participation"
  | "local_area_activity"
  | "high_street_activity"
  | "contribution";

export interface ActivationRule {
  id: string;
  label: string;
  type: RuleType;
  threshold: number;
  unit: "%" | "count";
  enabled: boolean;
  audience?: RuleAudience;
  businessThreshold?: number;
  consumerThreshold?: number;
}

export interface RuleEvaluation {
  id: string;
  label: string;
  type: RuleType;
  audience: RuleAudience;
  unit: "%" | "count";
  threshold: number;
  actual: number;
  passed: boolean;
  segments?: Array<{
    audience: "business" | "consumer";
    actual: number;
    threshold: number;
    passed: boolean;
  }>;
}

export interface RuleSetEvaluation {
  logic: RuleLogic;
  passed: boolean;
  enabled: number;
  rules: RuleEvaluation[];
}

export interface CityMetrics {
  localAreas: number;
  highStreets: number;
  activeCampaigns: number;
  qualifyingCampaigns: number;
  fundingRaised: number;
  fundingTarget: number;
  fundingProgress: number;
  coveragePct: number;
  participationPct: number;
  localAreaActivityPct: number;
  highStreetActivityPct: number;
}

export type PublicStatusKey = "NEEDS_ACTIVATION" | "MAKING_PROGRESS" | "ACTIVE";

export interface CityActivationEvaluation {
  cityId: string;
  cityName: string;
  currentStatus: PublicStatusKey;
  nextStatus: PublicStatusKey;
  changed: boolean;
  applied: boolean;
  skippedReason?: string;
  rulesSource: "configured" | "default";
  metrics: CityMetrics;
  makingProgress: RuleSetEvaluation;
  active: RuleSetEvaluation;
  evaluatedAt: string;
}

const AREA_TYPES: HubLocationType[] = [
  HubLocationType.BOROUGH,
  HubLocationType.DISTRICT,
  HubLocationType.LOCAL_AREA,
];

const STREET_TYPES: HubLocationType[] = [
  HubLocationType.HIGH_STREET,
  HubLocationType.COMMERCIAL_AREA,
];

/**
 * Default rule sets mirror the Add City wizard defaults. They are used for
 * legacy cities that were created before activation rules were stored.
 */
const DEFAULT_MAKING_PROGRESS_RULES: ActivationRule[] = [
  { id: "mp-campaign-coverage", label: "Campaign Coverage", type: "campaign_coverage", threshold: 30, unit: "%", enabled: true, audience: "all" },
  { id: "mp-campaign-participation", label: "Campaigns with Qualifying Activity", type: "campaign_participation", threshold: 30, unit: "%", enabled: true, audience: "all" },
  { id: "mp-local-area-activity", label: "Local Areas with Active/Progressing Campaigns", type: "local_area_activity", threshold: 3, unit: "count", enabled: true, audience: "all" },
  { id: "mp-high-street-activity", label: "High Streets with Qualifying Campaigns", type: "high_street_activity", threshold: 25, unit: "%", enabled: false, audience: "all" },
  { id: "mp-contribution", label: "Contribution Progress", type: "contribution", threshold: 20, unit: "%", enabled: false, audience: "all" },
];

const DEFAULT_ACTIVE_RULES: ActivationRule[] = [
  { id: "a-campaign-coverage", label: "Campaign Coverage", type: "campaign_coverage", threshold: 70, unit: "%", enabled: true, audience: "all" },
  { id: "a-campaign-participation", label: "Qualifying Participation", type: "campaign_participation", threshold: 50, unit: "%", enabled: true, audience: "all" },
  { id: "a-local-area-activity", label: "Local Areas with Qualifying Activity", type: "local_area_activity", threshold: 50, unit: "%", enabled: true, audience: "all" },
  { id: "a-high-street-activity", label: "High Streets with Qualifying Campaigns", type: "high_street_activity", threshold: 40, unit: "%", enabled: false, audience: "all" },
  { id: "a-contribution", label: "Contribution Target", type: "contribution", threshold: 50, unit: "%", enabled: false, audience: "all" },
];

interface ScopedCampaign {
  id: string;
  locationId: string | null;
  audience: "business" | "consumer" | "both";
  raisedAmount: number;
  targetAmount: number;
  qualifies: boolean;
}

interface LocationNode {
  id: string;
  parentId: string | null;
  type: HubLocationType;
  name: string;
}

@Injectable()
export class ActivationService {
  private readonly logger = new Logger(ActivationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Evaluates every active city. Used by the admin "run now" endpoint and as a
   * synchronous fallback for manual triggers.
   */
  async evaluateAll(options: { apply: boolean } = { apply: true }) {
    const cities = await this.prisma.hubLocation.findMany({
      where: { type: HubLocationType.CITY, deletedAt: null },
      select: { id: true },
      orderBy: { name: "asc" },
    });

    const results: CityActivationEvaluation[] = [];
    for (const city of cities) {
      try {
        results.push(await this.evaluateCity(city.id, options));
      } catch (err: any) {
        this.logger.error(`Activation evaluation failed for city ${city.id}: ${err.message}`);
      }
    }

    return {
      evaluated: results.length,
      promoted: results.filter((r) => r.applied && r.changed).length,
      cities: results,
    };
  }

  /**
   * Evaluates a single city against its configured (or default) activation
   * rules using all active campaigns attributed to the city subtree.
   *
   * Promotion is forward-only: PENDING → MAKING_PROGRESS → ACTIVE. The job
   * never demotes a city or overrides an explicit admin status override.
   */
  async evaluateCity(
    cityId: string,
    options: { apply: boolean } = { apply: true },
  ): Promise<CityActivationEvaluation> {
    const city = await this.prisma.hubLocation.findUnique({
      where: { id: cityId },
      select: {
        id: true,
        name: true,
        type: true,
        targetAmount: true,
        activationStatus: true,
        statusOverride: true,
        isActive: true,
        metadata: true,
        deletedAt: true,
      },
    });

    if (!city || city.type !== HubLocationType.CITY) {
      throw new NotFoundException(`City ${cityId} not found`);
    }

    const config = await this.getAutomationConfig();
    const evaluatedAt = new Date().toISOString();
    const meta = (city.metadata as Record<string, any>) ?? {};

    const currentStatus = this.normaliseStatus(city.activationStatus);
    const rulesSource: "configured" | "default" =
      Array.isArray(meta.makingProgressRules) || Array.isArray(meta.activeRules)
        ? "configured"
        : "default";

    const makingProgressRules = this.normaliseRules(
      meta.makingProgressRules,
      DEFAULT_MAKING_PROGRESS_RULES,
    );
    const activeRules = this.normaliseRules(meta.activeRules, DEFAULT_ACTIVE_RULES);
    const makingProgressLogic: RuleLogic =
      meta.makingProgressLogic === "OR" ? "OR" : "AND";
    const activeLogic: RuleLogic = meta.activeLogic === "OR" ? "OR" : "AND";

    const locations = await this.prisma.hubLocation.findMany({
      where: { deletedAt: null, isActive: true },
      select: { id: true, parentId: true, type: true, name: true },
    });
    const locationById = new Map(locations.map((location) => [location.id, location]));
    const nodeById = new Map<string, LocationNode>(
      locations.map((location) => [
        location.id,
        {
          id: location.id,
          parentId: location.parentId,
          type: location.type,
          name: location.name,
        },
      ]),
    );

    const citySubtree = locations.filter(
      (location) => this.cityIdFor(location.id, nodeById) === city.id,
    );
    const areaIds = new Set(
      citySubtree
        .filter((location) => AREA_TYPES.includes(location.type))
        .map((location) => location.id),
    );
    const streetIds = new Set(
      citySubtree
        .filter((location) => STREET_TYPES.includes(location.type))
        .map((location) => location.id),
    );
    const streetToArea = new Map<string, string>();
    for (const street of citySubtree) {
      if (!STREET_TYPES.includes(street.type) || !street.parentId) continue;
      const parent = locationById.get(street.parentId);
      if (parent && AREA_TYPES.includes(parent.type)) {
        streetToArea.set(street.id, parent.id);
      }
    }

    const campaigns = await this.loadCityCampaigns(city.id, nodeById);

    const metrics = this.computeMetrics(
      Number(city.targetAmount) || 0,
      campaigns,
      areaIds,
      streetIds,
      streetToArea,
    );

    // ── Evaluate rule sets ──
    const mpRules = makingProgressRules.filter((rule) => rule.enabled);
    const activeEnabledRules = activeRules.filter((rule) => rule.enabled);

    const mpEval = this.evaluateRuleSet(
      mpRules,
      makingProgressLogic,
      (rule) => this.actualForRule(rule, metrics, campaigns, areaIds, streetIds, streetToArea),
    );
    const activeEval = this.evaluateRuleSet(
      activeEnabledRules,
      activeLogic,
      (rule) => this.actualForRule(rule, metrics, campaigns, areaIds, streetIds, streetToArea),
    );

    // ── Decide next status (forward-only) ──
    // Active requires the Making Progress rules to be satisfied too (unless no
    // Making Progress rules are enabled, in which case that gate is skipped).
    const mpSatisfied = mpEval.enabled === 0 ? true : mpEval.passed;
    let nextStatus = currentStatus;
    if (activeEval.passed && mpSatisfied) {
      nextStatus = "ACTIVE";
    } else if (currentStatus === "NEEDS_ACTIVATION" && mpSatisfied) {
      nextStatus = "MAKING_PROGRESS";
    }

    const statusOverride = (city.statusOverride ?? "").trim();
    let skippedReason: string | undefined;
    if (statusOverride) {
      skippedReason = "Manual status override is set.";
      nextStatus = currentStatus;
    } else if (!city.isActive) {
      skippedReason = "City is deactivated.";
      nextStatus = currentStatus;
    } else if (!config.enabled) {
      skippedReason = "Automatic activation is disabled in roll-up settings.";
      nextStatus = currentStatus;
    } else if (!config.autoPromoteStatus) {
      skippedReason = "Auto-promote status is turned off in roll-up settings.";
      nextStatus = currentStatus;
    }

    const changed = nextStatus !== currentStatus;
    const applied = options.apply && changed && !skippedReason;

    const evaluation: CityActivationEvaluation = {
      cityId: city.id,
      cityName: city.name,
      currentStatus,
      nextStatus,
      changed,
      applied,
      skippedReason,
      rulesSource,
      metrics,
      makingProgress: mpEval,
      active: activeEval,
      evaluatedAt,
    };

    if (options.apply) {
      const nextActivationStatus =
        nextStatus === "ACTIVE"
          ? "ACTIVATED"
          : nextStatus === "MAKING_PROGRESS"
            ? "IN_PROGRESS"
            : "PENDING";

      await this.prisma.hubLocation.update({
        where: { id: city.id },
        data: {
          ...(applied ? { activationStatus: nextActivationStatus } : {}),
          metadata: {
            ...meta,
            activationEvaluation: {
              evaluatedAt,
              statusBefore: currentStatus,
              statusAfter: nextStatus,
              applied,
              rulesSource,
              makingProgress: mpEval,
              active: activeEval,
              metrics,
            },
            activationEvaluatedAt: evaluatedAt,
          } as unknown as Prisma.InputJsonValue,
        },
      });

      if (applied) {
        await this.invalidateLocationCache();
        this.logger.log(
          `City ${city.name} promoted ${currentStatus} → ${nextStatus} (${rulesSource} rules)`,
        );
      }
    }

    return evaluation;
  }

  // ───────────────────────────── Data loading ─────────────────────────────

  private async loadCityCampaigns(
    cityId: string,
    nodeById: Map<string, LocationNode>,
  ): Promise<ScopedCampaign[]> {
    const campaigns = await this.prisma.businessCampaign.findMany({
      where: { status: BusinessCampaignStatus.ACTIVE },
      select: {
        id: true,
        raisedAmount: true,
        targetAmount: true,
        audience: true,
        business: { select: { locationId: true, preferredAudience: true } },
        locations: {
          where: { scope: "PRIMARY" },
          select: { locationId: true },
          take: 1,
        },
        contributions: {
          where: { status: ContributionStatus.COMPLETED },
          select: { id: true },
          take: 1,
        },
      },
    });

    const results: ScopedCampaign[] = [];
    for (const campaign of campaigns) {
      const primaryLocationId =
        campaign.locations[0]?.locationId ?? campaign.business?.locationId ?? null;
      if (!primaryLocationId) continue;
      if (this.cityIdFor(primaryLocationId, nodeById) !== cityId) continue;

      results.push({
        id: campaign.id,
        locationId: primaryLocationId,
        audience: this.normaliseAudience(
          campaign.audience ?? campaign.business?.preferredAudience ?? null,
        ),
        raisedAmount: Number(campaign.raisedAmount) || 0,
        targetAmount: Number(campaign.targetAmount) || 0,
        qualifies: campaign.contributions.length > 0,
      });
    }
    return results;
  }

  private computeMetrics(
    cityTarget: number,
    campaigns: ScopedCampaign[],
    areaIds: Set<string>,
    streetIds: Set<string>,
    streetToArea: Map<string, string>,
  ): CityMetrics {
    const all = this.metricsForAudience(
      campaigns,
      "all",
      cityTarget,
      areaIds,
      streetIds,
      streetToArea,
    );
    return {
      localAreas: areaIds.size,
      highStreets: streetIds.size,
      activeCampaigns: campaigns.length,
      qualifyingCampaigns: campaigns.filter((campaign) => campaign.qualifies).length,
      fundingRaised: all.fundingRaised,
      fundingTarget: all.fundingTarget,
      fundingProgress: all.contributionPct,
      coveragePct: all.coveragePct,
      participationPct: all.participationPct,
      localAreaActivityPct: all.localAreaActivityPct,
      highStreetActivityPct: all.highStreetActivityPct,
    };
  }

  private metricsForAudience(
    campaigns: ScopedCampaign[],
    audience: RuleAudience,
    cityTarget: number,
    areaIds: Set<string>,
    streetIds: Set<string>,
    streetToArea: Map<string, string>,
  ) {
    const filtered = campaigns.filter((campaign) => this.audienceMatches(campaign.audience, audience));

    const streetsWithCampaign = new Set<string>();
    const streetsWithQualifying = new Set<string>();
    const areasWithCampaign = new Set<string>();
    const areasWithQualifying = new Set<string>();

    for (const campaign of filtered) {
      const locationId = campaign.locationId;
      if (!locationId) continue;

      const directStreet = streetIds.has(locationId) ? locationId : null;
      const directArea = areaIds.has(locationId) ? locationId : null;
      const areaViaStreet = directStreet ? streetToArea.get(directStreet) ?? null : null;

      if (directStreet) {
        streetsWithCampaign.add(directStreet);
        if (campaign.qualifies) streetsWithQualifying.add(directStreet);
      }
      const areaId = directArea ?? areaViaStreet;
      if (areaId) {
        areasWithCampaign.add(areaId);
        if (campaign.qualifies) areasWithQualifying.add(areaId);
      }
    }

    const streetCount = streetIds.size;
    const areaCount = areaIds.size;

    const coveragePct =
      areaCount > 0
        ? this.pct(areasWithCampaign.size, areaCount)
        : streetCount > 0
          ? this.pct(streetsWithCampaign.size, streetCount)
          : filtered.length > 0
            ? 100
            : 0;

    const participationPct =
      filtered.length > 0 ? this.pct(filtered.filter((c) => c.qualifies).length, filtered.length) : 0;

    const localAreaActivityPct =
      areaCount > 0 ? this.pct(areasWithCampaign.size, areaCount) : 0;

    const highStreetActivityPct =
      streetCount > 0 ? this.pct(streetsWithQualifying.size, streetCount) : 0;

    const fundingRaised = filtered.reduce((sum, campaign) => sum + campaign.raisedAmount, 0);
    const campaignTarget = filtered.reduce((sum, campaign) => sum + campaign.targetAmount, 0);
    const fundingTarget = cityTarget > 0 ? cityTarget : campaignTarget;
    const contributionPct =
      fundingTarget > 0 ? this.pct(fundingRaised, fundingTarget) : 0;

    return {
      coveragePct,
      participationPct,
      localAreaActivityCount: areasWithCampaign.size,
      localAreaActivityPct,
      localAreaQualifyingCount: areasWithQualifying.size,
      highStreetActivityPct,
      fundingRaised,
      fundingTarget,
      contributionPct,
    };
  }

  // ───────────────────────────── Rule evaluation ─────────────────────────────

  private evaluateRuleSet(
    rules: ActivationRule[],
    logic: RuleLogic,
    actualFor: (rule: ActivationRule) => number,
  ): RuleSetEvaluation {
    const results: RuleEvaluation[] = rules.map((rule) => this.evaluateRule(rule, actualFor));

    const passed =
      results.length === 0
        ? false
        : logic === "AND"
          ? results.every((result) => result.passed)
          : results.some((result) => result.passed);

    return { logic, passed, enabled: results.length, rules: results };
  }

  private evaluateRule(
    rule: ActivationRule,
    actualFor: (rule: ActivationRule) => number,
  ): RuleEvaluation {
    const audience: RuleAudience = rule.audience ?? "all";

    if (
      audience === "all" &&
      (rule.businessThreshold !== undefined || rule.consumerThreshold !== undefined)
    ) {
      const businessThreshold = rule.businessThreshold ?? rule.threshold;
      const consumerThreshold = rule.consumerThreshold ?? rule.threshold;
      const businessActual = actualFor({ ...rule, audience: "business" });
      const consumerActual = actualFor({ ...rule, audience: "consumer" });

      const segments = [
        {
          audience: "business" as const,
          actual: this.round(businessActual),
          threshold: businessThreshold,
          passed: businessActual >= businessThreshold,
        },
        {
          audience: "consumer" as const,
          actual: this.round(consumerActual),
          threshold: consumerThreshold,
          passed: consumerActual >= consumerThreshold,
        },
      ];
      const failing = segments.find((segment) => !segment.passed) ?? segments[0];

      return {
        id: rule.id,
        label: rule.label,
        type: rule.type,
        audience,
        unit: rule.unit,
        threshold: failing.threshold,
        actual: failing.actual,
        passed: segments.every((segment) => segment.passed),
        segments,
      };
    }

    const actual = actualFor(rule);
    return {
      id: rule.id,
      label: rule.label,
      type: rule.type,
      audience,
      unit: rule.unit,
      threshold: rule.threshold,
      actual: this.round(actual),
      passed: actual >= rule.threshold,
    };
  }

  private actualForRule(
    rule: ActivationRule,
    metrics: CityMetrics,
    campaigns: ScopedCampaign[],
    areaIds: Set<string>,
    streetIds: Set<string>,
    streetToArea: Map<string, string>,
  ): number {
    const audience = rule.audience ?? "all";
    const audienceMetrics = this.metricsForAudience(
      campaigns,
      audience,
      metrics.fundingTarget,
      areaIds,
      streetIds,
      streetToArea,
    );

    switch (rule.type) {
      case "campaign_coverage":
        return audienceMetrics.coveragePct;
      case "campaign_participation":
        return audienceMetrics.participationPct;
      case "local_area_activity":
        return rule.unit === "count"
          ? audienceMetrics.localAreaActivityCount
          : audienceMetrics.localAreaActivityPct;
      case "high_street_activity":
        return audienceMetrics.highStreetActivityPct;
      case "contribution":
        return audienceMetrics.contributionPct;
      default:
        return 0;
    }
  }

  // ───────────────────────────── Helpers ─────────────────────────────

  private async getAutomationConfig() {
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key: "locations_rollup_config" },
      select: { value: true },
    });
    const value = (setting?.value as Record<string, any>) ?? {};
    return {
      enabled: value.enabled !== false,
      autoPromoteStatus: value.autoPromoteStatus !== false,
    };
  }

  private normaliseRules(raw: unknown, fallback: ActivationRule[]): ActivationRule[] {
    if (!Array.isArray(raw) || raw.length === 0) {
      return fallback.map((rule) => ({ ...rule }));
    }
    return raw
      .filter((rule): rule is Record<string, any> => Boolean(rule) && typeof rule === "object")
      .map((rule, index) => ({
        id: typeof rule.id === "string" ? rule.id : `rule-${index}`,
        label: typeof rule.label === "string" ? rule.label : "Rule",
        type: this.normaliseRuleType(rule.type),
        threshold: Number(rule.threshold) || 0,
        unit: rule.unit === "count" ? "count" : "%",
        enabled: rule.enabled !== false,
        audience: this.normaliseRuleAudience(rule.audience),
        businessThreshold:
          rule.businessThreshold !== undefined ? Number(rule.businessThreshold) || 0 : undefined,
        consumerThreshold:
          rule.consumerThreshold !== undefined ? Number(rule.consumerThreshold) || 0 : undefined,
      }));
  }

  private normaliseRuleType(value: unknown): RuleType {
    const allowed: RuleType[] = [
      "campaign_coverage",
      "campaign_participation",
      "local_area_activity",
      "high_street_activity",
      "contribution",
    ];
    return allowed.includes(value as RuleType) ? (value as RuleType) : "campaign_coverage";
  }

  private normaliseRuleAudience(value: unknown): RuleAudience {
    return value === "business" || value === "consumer" ? value : "all";
  }

  private normaliseStatus(value: string | null | undefined): PublicStatusKey {
    const status = (value ?? "").toUpperCase();
    if (status === "ACTIVE" || status === "ACTIVATED" || status === "ACTIVE_OPERATION") {
      return "ACTIVE";
    }
    if (
      status === "MAKING_PROGRESS" ||
      status === "IN_PROGRESS" ||
      status === "PREPARING" ||
      status === "LAUNCHING"
    ) {
      return "MAKING_PROGRESS";
    }
    return "NEEDS_ACTIVATION";
  }

  private normaliseAudience(value: unknown): "business" | "consumer" | "both" {
    if (value === PreferredAudience.BUSINESS || value === "BUSINESS") return "business";
    if (value === PreferredAudience.CONSUMER || value === "CONSUMER") return "consumer";
    return "both";
  }

  private audienceMatches(
    campaignAudience: "business" | "consumer" | "both",
    target: RuleAudience,
  ) {
    if (target === "all") return true;
    return campaignAudience === "both" || campaignAudience === target;
  }

  /** Walks up the hierarchy and returns the owning city id (or null). */
  private cityIdFor(locationId: string, nodeById: Map<string, LocationNode>): string | null {
    let current: string | null = locationId;
    let guard = 0;
    while (current && guard < 20) {
      const node = nodeById.get(current);
      if (!node) return null;
      if (node.type === HubLocationType.CITY) return node.id;
      current = node.parentId;
      guard += 1;
    }
    return null;
  }

  private pct(numerator: number, denominator: number) {
    if (denominator <= 0) return 0;
    return Math.round((numerator / denominator) * 1000) / 10;
  }

  private round(value: number) {
    return Math.round(value * 10) / 10;
  }

  private async invalidateLocationCache() {
    try {
      await this.redis.del(
        "admin:locations:tree",
        "hub:location:tree",
        "hub:cities:all",
        "hub:summary:national",
      );
    } catch (err: any) {
      this.logger.warn(`Failed to invalidate locations cache: ${err.message}`);
    }
  }
}
