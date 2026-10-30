import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PlanAccessLevel, Prisma, PlanAudience } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import {
  PLAN_FEATURE_CATALOGUE,
  normalizeCapabilities,
} from "../plan.constants";
import {
  AdminPlanOrdersQueryDto,
  CreateAccessPassDto,
  CreatePlanDto,
  PlanVariantDto,
  UpdateAccessPassDto,
  UpdatePlanDto,
  UpdatePlanFeatureDto,
  UpdatePlanVariantDto,
} from "../dto/plan.dto";
import { CapabilityService } from "./capability.service";

/** Durations are fixed by access level and cannot be edited by admins. */
const ACCESS_LEVEL_DURATION: Record<PlanAccessLevel, number> = {
  STANDARD: 90,
  PRO: 180,
  PRO_PLUS: 365,
};

const ACCESS_LEVEL_LABEL: Record<PlanAccessLevel, string> = {
  STANDARD: "Standard",
  PRO: "Pro",
  PRO_PLUS: "Pro+",
};

/** Variant names are generated from the plan name, never admin input. */
function variantName(planName: string, accessLevel: PlanAccessLevel): string {
  return `${planName.trim()} ${ACCESS_LEVEL_LABEL[accessLevel]}`.trim();
}

@Injectable()
export class PlanCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly capabilities: CapabilityService,
  ) {}

  // ── Feature catalogue ────────────────────────────────────────────────────

  /** Materialise any code-defined feature that is missing from the database. */
  async ensureFeatureCatalogue(): Promise<void> {
    const existing = await this.prisma.planFeature.findMany({
      select: { key: true },
    });
    const known = new Set(existing.map((f) => f.key));
    const missing = PLAN_FEATURE_CATALOGUE.filter((f) => !known.has(f.key));
    if (missing.length === 0) return;

    await this.prisma.planFeature.createMany({
      data: missing.map((f) => ({
        key: f.key,
        name: f.name,
        description: f.description,
        category: f.category,
        sortOrder: f.sortOrder,
        defaultEnabled: f.defaultEnabled,
        supportsLimit: f.supportsLimit,
        defaultLimit: f.defaultLimit,
      })),
      skipDuplicates: true,
    });
    this.capabilities.invalidateFeatureCache();
  }

  async listFeatures() {
    await this.ensureFeatureCatalogue();
    return this.prisma.planFeature.findMany({
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
  }

  async updateFeature(key: string, dto: UpdatePlanFeatureDto) {
    const feature = await this.prisma.planFeature.findUnique({ where: { key } });
    if (!feature) throw new NotFoundException(`Feature ${key} not found`);

    const updated = await this.prisma.planFeature.update({
      where: { key },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.category !== undefined ? { category: dto.category } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        ...(dto.defaultEnabled !== undefined
          ? { defaultEnabled: dto.defaultEnabled }
          : {}),
        ...(dto.supportsLimit !== undefined
          ? { supportsLimit: dto.supportsLimit }
          : {}),
        ...(dto.defaultLimit !== undefined
          ? { defaultLimit: dto.defaultLimit }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
    this.capabilities.invalidateFeatureCache();
    return updated;
  }

  // ── Membership plans ─────────────────────────────────────────────────────

  async listPlans(includeInactive = false) {
    const plans = await this.prisma.membershipPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        variants: {
          where: includeInactive ? {} : { isActive: true },
          orderBy: [{ sortOrder: "asc" }, { durationDays: "asc" }],
          include: {
            _count: { select: { entitlements: true, orders: true } },
          },
        },
      },
    });
    return plans.map((plan) => this.toPlanView(plan));
  }

  async getPlan(id: string) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id },
      include: {
        variants: {
          orderBy: [{ sortOrder: "asc" }, { durationDays: "asc" }],
          include: {
            _count: { select: { entitlements: true, orders: true } },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException("Plan not found");
    return this.toPlanView(plan);
  }

  async createPlan(dto: CreatePlanDto) {
    const slug = await this.uniqueSlug("plan", dto.slug ?? dto.name);
    const features = await this.capabilities.features();

    const plan = await this.prisma.membershipPlan.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description ?? null,
        audience: dto.audience ?? PlanAudience.BOTH,
        badge: dto.badge ?? null,
        color: dto.color ?? null,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
        variants: dto.variants?.length
          ? {
              create: dto.variants.map((variant, index) =>
                this.variantCreateData(
                  variant,
                  features,
                  index,
                  dto.name.trim(),
                ),
              ),
            }
          : undefined,
      },
      include: { variants: true },
    });
    return this.getPlan(plan.id);
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const existing = await this.prisma.membershipPlan.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Plan not found");
    const features = await this.capabilities.features();

    await this.prisma.$transaction(async (tx) => {
      await tx.membershipPlan.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.slug !== undefined && dto.slug !== existing.slug
            ? { slug: await this.uniqueSlug("plan", dto.slug, id) }
            : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
          ...(dto.audience !== undefined ? { audience: dto.audience } : {}),
          ...(dto.badge !== undefined ? { badge: dto.badge } : {}),
          ...(dto.color !== undefined ? { color: dto.color } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        },
      });

      if (dto.variants?.length) {
        for (const [index, variant] of dto.variants.entries()) {
          await tx.membershipPlanVariant.upsert({
            where: {
              planId_accessLevel: {
                planId: id,
                accessLevel: variant.accessLevel,
              },
            },
            update: this.variantUpdateData(
              variant,
              features,
              index,
              variant.accessLevel,
              dto.name?.trim() || existing.name,
            ),
            create: {
              planId: id,
              ...this.variantCreateData(
                variant,
                features,
                index,
                dto.name?.trim() || existing.name,
              ),
            },
          });
        }
      }
    });

    return this.getPlan(id);
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id },
      include: {
        variants: {
          select: {
            id: true,
            _count: { select: { orders: true, entitlements: true } },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException("Plan not found");

    const inUse = plan.variants.some(
      (v) => v._count.orders > 0 || v._count.entitlements > 0,
    );
    if (inUse) {
      await this.prisma.membershipPlan.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        deleted: false,
        archived: true,
        message:
          "This plan has purchases attached, so it was archived instead of deleted.",
      };
    }

    await this.prisma.membershipPlan.delete({ where: { id } });
    return { deleted: true, archived: false };
  }

  async createVariant(planId: string, dto: PlanVariantDto) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException("Plan not found");
    const features = await this.capabilities.features();

    const existing = await this.prisma.membershipPlanVariant.findUnique({
      where: {
        planId_accessLevel: { planId, accessLevel: dto.accessLevel },
      },
    });
    if (existing) {
      throw new BadRequestException(
        `${plan.name} already has a ${dto.accessLevel} variant.`,
      );
    }

    await this.prisma.membershipPlanVariant.create({
      data: {
        planId,
        ...this.variantCreateData(dto, features, 0, plan.name),
      },
    });
    return this.getPlan(planId);
  }

  async updateVariant(
    planId: string,
    variantId: string,
    dto: UpdatePlanVariantDto,
  ) {
    const variant = await this.prisma.membershipPlanVariant.findFirst({
      where: { id: variantId, planId },
      include: { plan: { select: { name: true } } },
    });
    if (!variant) throw new NotFoundException("Plan variant not found");
    const features = await this.capabilities.features();

    await this.prisma.membershipPlanVariant.update({
      where: { id: variantId },
      data: this.variantUpdateData(
        dto,
        features,
        0,
        dto.accessLevel ?? variant.accessLevel,
        variant.plan.name,
      ),
    });
    return this.getPlan(planId);
  }

  async deleteVariant(planId: string, variantId: string) {
    const variant = await this.prisma.membershipPlanVariant.findFirst({
      where: { id: variantId, planId },
      include: {
        _count: { select: { orders: true, entitlements: true } },
      },
    });
    if (!variant) throw new NotFoundException("Plan variant not found");

    if (variant._count.orders > 0 || variant._count.entitlements > 0) {
      await this.prisma.membershipPlanVariant.update({
        where: { id: variantId },
        data: { isActive: false },
      });
      return { deleted: false, archived: true };
    }
    await this.prisma.membershipPlanVariant.delete({ where: { id: variantId } });
    return { deleted: true, archived: false };
  }

  // ── Access passes ────────────────────────────────────────────────────────

  async listAccessPasses(includeInactive = false) {
    const passes = await this.prisma.accessPass.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { codes: true, orders: true, entitlements: true } },
      },
    });
    return passes.map((pass) => ({
      ...pass,
      count: pass._count,
    }));
  }

  async getAccessPass(id: string) {
    const pass = await this.prisma.accessPass.findUnique({
      where: { id },
      include: {
        _count: { select: { codes: true, orders: true, entitlements: true } },
      },
    });
    if (!pass) throw new NotFoundException("Access pass not found");
    return pass;
  }

  async createAccessPass(dto: CreateAccessPassDto) {
    const features = await this.capabilities.features();
    const slug = await this.uniqueSlug("pass", dto.slug ?? dto.name);
    const pass = await this.prisma.accessPass.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description ?? null,
        durationDays: dto.durationDays,
        priceMinor: dto.priceMinor,
        currency: dto.currency ?? "GBP",
        capabilities: normalizeCapabilities(dto.capabilities, {
          features,
          includeDefaults: true,
        }) as unknown as Prisma.InputJsonValue,
        features: dto.features ?? [],
        codeValidityDays: dto.codeValidityDays ?? null,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    return this.getAccessPass(pass.id);
  }

  async updateAccessPass(id: string, dto: UpdateAccessPassDto) {
    const existing = await this.prisma.accessPass.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Access pass not found");
    const features = await this.capabilities.features();

    await this.prisma.accessPass.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.slug !== undefined && dto.slug !== existing.slug
          ? { slug: await this.uniqueSlug("pass", dto.slug, id) }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.durationDays !== undefined
          ? { durationDays: dto.durationDays }
          : {}),
        ...(dto.priceMinor !== undefined ? { priceMinor: dto.priceMinor } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.capabilities !== undefined
          ? {
              capabilities: normalizeCapabilities(dto.capabilities, {
                features,
                includeDefaults: true,
              }) as unknown as Prisma.InputJsonValue,
            }
          : {}),
        ...(dto.features !== undefined ? { features: dto.features } : {}),
        ...(dto.codeValidityDays !== undefined
          ? { codeValidityDays: dto.codeValidityDays }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
    return this.getAccessPass(id);
  }

  async deleteAccessPass(id: string) {
    const pass = await this.prisma.accessPass.findUnique({
      where: { id },
      include: {
        _count: { select: { codes: true, orders: true, entitlements: true } },
      },
    });
    if (!pass) throw new NotFoundException("Access pass not found");

    if (
      pass._count.codes > 0 ||
      pass._count.orders > 0 ||
      pass._count.entitlements > 0
    ) {
      await this.prisma.accessPass.update({
        where: { id },
        data: { isActive: false },
      });
      return { deleted: false, archived: true };
    }
    await this.prisma.accessPass.delete({ where: { id } });
    return { deleted: true, archived: false };
  }

  // ── Public catalogue ─────────────────────────────────────────────────────

  async getCatalog(audience?: PlanAudience) {
    await this.ensureFeatureCatalogue();
    const [plans, passes, features] = await Promise.all([
      this.prisma.membershipPlan.findMany({
        where: {
          isActive: true,
          ...(audience && audience !== PlanAudience.BOTH
            ? { audience: { in: [audience, PlanAudience.BOTH] } }
            : {}),
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          variants: {
            where: { isActive: true },
            orderBy: [{ sortOrder: "asc" }, { durationDays: "asc" }],
          },
        },
      }),
      this.prisma.accessPass.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      this.prisma.planFeature.findMany({
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
      }),
    ]);

    return {
      plans: plans.map((plan) => this.toPlanView(plan)),
      accessPasses: passes,
      features,
    };
  }

  // ── Admin reporting ──────────────────────────────────────────────────────

  async listOrders(query: AdminPlanOrdersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.PlanOrderWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.kind ? { kind: query.kind } : {}),
      ...(query.search
        ? {
            OR: [
              { reference: { contains: query.search, mode: "insensitive" } },
              { userId: query.search },
            ],
          }
        : {}),
    };

    const [total, orders] = await Promise.all([
      this.prisma.planOrder.count({ where }),
      this.prisma.planOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          planVariant: {
            include: { plan: { select: { id: true, name: true } } },
          },
          accessPass: { select: { id: true, name: true } },
        },
      }),
    ]);

    const userIds = [...new Set(orders.map((o) => o.userId))];
    const users = userIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            userType: true,
          },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      items: orders.map((order) => ({
        ...order,
        user: userMap.get(order.userId) ?? null,
        product:
          order.planVariant?.plan.name && order.planVariant.name
            ? `${order.planVariant.plan.name} · ${order.planVariant.name}`
            : order.accessPass?.name ?? "Plan",
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async listAccessPassCodes(params: {
    page?: number;
    limit?: number;
    status?: string;
    accessPassId?: string;
    search?: string;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where: Prisma.AccessPassCodeWhereInput = {
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.accessPassId ? { accessPassId: params.accessPassId } : {}),
      ...(params.search
        ? {
            OR: [
              { code: { contains: params.search, mode: "insensitive" } },
              { ownerId: params.search },
            ],
          }
        : {}),
    };
    const [total, codes] = await Promise.all([
      this.prisma.accessPassCode.count({ where }),
      this.prisma.accessPassCode.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { accessPass: { select: { id: true, name: true } } },
      }),
    ]);

    const ownerIds = [...new Set(codes.map((c) => c.ownerId).filter(Boolean))] as string[];
    const owners = ownerIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: ownerIds } },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        })
      : [];
    const ownerMap = new Map(owners.map((u) => [u.id, u]));

    return {
      items: codes.map((code) => ({
        ...code,
        owner: code.ownerId ? ownerMap.get(code.ownerId) ?? null : null,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private toPlanView(plan: {
    variants: {
      _count?: { entitlements: number; orders: number };
      [key: string]: unknown;
    }[];
    [key: string]: unknown;
  }) {
    return {
      ...plan,
      variants: plan.variants.map((variant) => {
        const { _count, ...rest } = variant;
        return {
          ...rest,
          counts: _count ?? { entitlements: 0, orders: 0 },
        };
      }),
    };
  }

  private variantCreateData(
    dto: PlanVariantDto,
    features: { key: string; defaultEnabled: boolean; supportsLimit: boolean; defaultLimit: number | null }[],
    index: number,
    planName: string,
  ) {
    return {
      accessLevel: dto.accessLevel,
      name: variantName(planName, dto.accessLevel),
      description: dto.description ?? null,
      durationDays: ACCESS_LEVEL_DURATION[dto.accessLevel],
      priceMinor: dto.priceMinor,
      currency: dto.currency ?? "GBP",
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? index * 10,
      capabilities: normalizeCapabilities(dto.capabilities, {
        features,
        includeDefaults: true,
      }) as unknown as Prisma.InputJsonValue,
      features: dto.features ?? [],
    };
  }

  private variantUpdateData(
    dto: UpdatePlanVariantDto,
    features: { key: string; defaultEnabled: boolean; supportsLimit: boolean; defaultLimit: number | null }[],
    index: number,
    accessLevel: PlanAccessLevel,
    planName: string,
  ) {
    return {
      ...(dto.accessLevel !== undefined
        ? { accessLevel: dto.accessLevel }
        : {}),
      name: variantName(planName, accessLevel),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      durationDays: ACCESS_LEVEL_DURATION[accessLevel],
      ...(dto.priceMinor !== undefined ? { priceMinor: dto.priceMinor } : {}),
      ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      ...(dto.capabilities !== undefined
        ? {
            capabilities: normalizeCapabilities(dto.capabilities, {
              features,
              includeDefaults: true,
            }) as unknown as Prisma.InputJsonValue,
          }
        : {}),
      ...(dto.features !== undefined ? { features: dto.features } : {}),
      ...(dto.sortOrder === undefined && index ? { sortOrder: index * 10 } : {}),
    };
  }

  private async uniqueSlug(
    kind: "plan" | "pass",
    value: string,
    ignoreId?: string,
  ): Promise<string> {
    const base =
      value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 110) || `${kind}-${Date.now().toString(36)}`;

    let slug = base;
    let counter = 1;
    while (true) {
      const found =
        kind === "plan"
          ? await this.prisma.membershipPlan.findUnique({ where: { slug } })
          : await this.prisma.accessPass.findUnique({ where: { slug } });
      if (!found || found.id === ignoreId) return slug;
      slug = `${base}-${counter++}`;
    }
  }
}
