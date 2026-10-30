import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AccessPassCodeStatus,
  PlanEntitlementKind,
  PlanEntitlementStatus,
  PlanOrderKind,
  PlanOrderStatus,
  Prisma,
} from "@prisma/client";
import { randomBytes } from "crypto";
import { PrismaService } from "@/prisma/prisma.service";
import { McomPaymentsService } from "@/mcom/mcom-payments.service";
import {
  ConfirmPlanOrderDto,
  PurchasePlanDto,
  RedeemAccessPassDto,
} from "../dto/plan.dto";
import { mergeWithDefaults, type CapabilityMap } from "../plan.constants";
import { CapabilityService } from "./capability.service";

interface ChargeEvent {
  chargeId?: string;
  reference?: string;
  status?: string;
}

@Injectable()
export class PlanEntitlementService {
  private readonly logger = new Logger(PlanEntitlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mcomPayments: McomPaymentsService,
    private readonly capabilities: CapabilityService,
  ) {}

  // ── My entitlement ───────────────────────────────────────────────────────

  async getMine(userId: string) {
    await this.expireStale(userId);
    const effective = await this.capabilities.resolve(userId);

    const [active, history, codes, orders] = await Promise.all([
      this.prisma.userEntitlement.findFirst({
        where: { userId, status: PlanEntitlementStatus.ACTIVE },
        orderBy: { startedAt: "desc" },
        include: {
          planVariant: {
            include: { plan: { select: { id: true, name: true, badge: true } } },
          },
          accessPass: true,
        },
      }),
      this.prisma.userEntitlement.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 25,
        include: {
          planVariant: {
            include: { plan: { select: { id: true, name: true, badge: true } } },
          },
          accessPass: true,
        },
      }),
      this.prisma.accessPassCode.findMany({
        where: {
          ownerId: userId,
          status: {
            in: [
              AccessPassCodeStatus.AVAILABLE,
              AccessPassCodeStatus.ACTIVE,
            ],
          },
        },
        orderBy: { createdAt: "desc" },
        include: { accessPass: true },
      }),
      this.prisma.planOrder.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 25,
        include: {
          planVariant: {
            include: { plan: { select: { id: true, name: true } } },
          },
          accessPass: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      active,
      effective: {
        source: effective.source,
        kind: effective.kind,
        planName: effective.planName,
        expiresAt: effective.expiresAt,
        capabilities: effective.capabilities,
      },
      history,
      codes,
      orders,
    };
  }

  async getCapabilities(userId: string, version?: string) {
    const effective = await this.capabilities.resolve(userId);
    if (version && version === effective.version) {
      return {
        unchanged: true,
        version: effective.version,
        checkedAt: new Date().toISOString(),
      };
    }
    return {
      unchanged: false,
      ...effective,
    };
  }

  // ── Purchase ─────────────────────────────────────────────────────────────

  async purchase(userId: string, dto: PurchasePlanDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        userType: true,
        role: true,
        mcomUserId: true,
      },
    });
    if (!user) throw new UnauthorizedException("User no longer exists");
    if (user.userType !== "business") {
      throw new ForbiddenException(
        "Plans and access passes are available to business accounts only.",
      );
    }

    const product = await this.resolveProduct(userId, dto);
    const activationMode =
      dto.kind === PlanOrderKind.ACCESS_PASS &&
      dto.activationMode === "save_code"
        ? "save_code"
        : "immediate";

    if (dto.method === "wallet" && !user.mcomUserId) {
      throw new BadRequestException(
        "Paying with MCOM Wallet requires an account linked to MCOM Central Hub.",
      );
    }

    // Warn before replacing a different active product. Same-product renewals
    // extend the existing window and do not need confirmation.
    const active = await this.prisma.userEntitlement.findFirst({
      where: {
        userId,
        status: PlanEntitlementStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      orderBy: { startedAt: "desc" },
    });
    const sameProduct =
      active &&
      active.planVariantId === (product.variant?.id ?? null) &&
      active.accessPassId === (product.accessPass?.id ?? null);
    if (active && !sameProduct && !dto.confirmForfeit) {
      throw new ConflictException({
        statusCode: 409,
        error: "ActiveEntitlementConflict",
        message: `You already have an active ${
          active.kind === "PLAN" ? "plan" : "access pass"
        }${active.planName ? ` (${active.planName})` : ""} until ${active.expiresAt.toISOString()}. Buying this will forfeit the remaining time.`,
        details: {
          requiresForfeit: true,
          activeKind: active.kind,
          activePlanName: active.planName,
          expiresAt: active.expiresAt,
        },
      });
    }

    const reference = this.makeReference();
    const order = await this.prisma.planOrder.create({
      data: {
        userId,
        kind: dto.kind,
        status: PlanOrderStatus.PENDING,
        planVariantId: product.variant?.id ?? null,
        accessPassId: product.accessPass?.id ?? null,
        amountMinor: product.amountMinor,
        currency: product.currency,
        reference,
        paymentMethod: dto.method,
        activationMode,
        metadata: {
          ...(dto.metadata ?? {}),
          acceptedTerms: dto.acceptedTerms === true,
          forfeitAccepted: dto.confirmForfeit === true,
          productName: product.name,
        } as Prisma.InputJsonValue,
      },
    });

    const returnBase =
      this.config.get<string>("cors.origin") ?? "http://localhost:5023";

    const chargeResult = await this.mcomPayments
      .createCharge({
        amountMinor: String(product.amountMinor),
        currency: product.currency,
        method: dto.method,
        reference,
        description: `FundorDonate ${product.name} (${reference})`,
        mcomUserId: user.mcomUserId ?? undefined,
        metadata: {
          platform: "fundordonate",
          purpose: "PLAN_PURCHASE",
          planOrderId: order.id,
          planOrderReference: reference,
          kind: dto.kind,
          activationMode,
          returnUrl: `${returnBase}/plans/return?order=${order.id}`,
          cancelUrl: `${returnBase}/plans?payment=failed`,
        },
        idempotencyKey: `fundordonate-plan-${reference}`,
      })
      .catch(async (error) => {
        await this.prisma.planOrder.update({
          where: { id: order.id },
          data: { status: PlanOrderStatus.FAILED },
        });
        throw error;
      });

    const charge = chargeResult.charge;
    const updated = await this.prisma.planOrder.update({
      where: { id: order.id },
      data: {
        mcomChargeId: charge.id,
        status:
          charge.status === "paid"
            ? PlanOrderStatus.PAID
            : charge.status === "failed"
              ? PlanOrderStatus.FAILED
              : PlanOrderStatus.PENDING,
      },
    });

    let activated: any = null;
    if (charge.status === "paid") {
      activated = await this.activateOrder(order.id);
    }

    return {
      order: activated?.order ?? updated,
      activation: activated,
      chargeId: charge.id,
      status: charge.status,
      method: charge.method,
      amountMinor: charge.amountMinor,
      reference,
      clientSecret: chargeResult.clientSecret,
      publishableKey:
        this.config.get<string>("stripe.publishableKey") ||
        this.config.get<string>("STRIPE_PUBLISHABLE_KEY") ||
        "",
      approvalUrl: chargeResult.approvalUrl,
    };
  }

  async confirmOrder(userId: string, orderId: string, dto: ConfirmPlanOrderDto) {
    const order = await this.prisma.planOrder.findFirst({
      where: { id: orderId, userId },
    });
    if (!order) throw new NotFoundException("Plan order not found");

    if (order.status === PlanOrderStatus.PAID) {
      return this.activateOrder(order.id);
    }
    if (!order.mcomChargeId) {
      throw new BadRequestException("This order has no MCOM Pay charge to confirm");
    }

    const res = await this.mcomPayments.confirmCharge(order.mcomChargeId, dto);
    if (res.charge.status === "paid") {
      return this.activateOrder(order.id);
    }
    return {
      order: await this.prisma.planOrder.findUnique({ where: { id: order.id } }),
      charge: res.charge,
    };
  }

  /**
   * Called by the payment webhook. Idempotent; safe to retry.
   */
  async handleChargeEvent(event: ChargeEvent) {
    const order = await this.prisma.planOrder.findFirst({
      where: {
        OR: [
          ...(event.chargeId ? [{ mcomChargeId: event.chargeId }] : []),
          ...(event.reference ? [{ reference: event.reference }] : []),
        ],
      },
    });
    if (!order) return { handled: false };

    const status = (event.status ?? "").toLowerCase();
    if (status === "paid" || status === "succeeded") {
      const result = await this.activateOrder(order.id);
      return { handled: true, activated: true, order: result?.order ?? null };
    }
    if (status === "failed") {
      await this.prisma.planOrder.update({
        where: { id: order.id },
        data: { status: PlanOrderStatus.FAILED },
      });
      return { handled: true, activated: false };
    }
    if (status === "refunded") {
      await this.refundOrder(order.id);
      return { handled: true, refunded: true };
    }
    return { handled: true, activated: false };
  }

  // ── Access pass codes ────────────────────────────────────────────────────

  async redeemAccessPass(userId: string, dto: RedeemAccessPassDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true, role: true },
    });
    if (!user || user.userType !== "business") {
      throw new ForbiddenException(
        "Plans and access passes are available to business accounts only.",
      );
    }

    const code = dto.code.trim().toUpperCase();
    const record = await this.prisma.accessPassCode.findUnique({
      where: { code },
      include: { accessPass: true },
    });
    if (!record) throw new NotFoundException("Access pass code not found");
    if (
      record.ownerId &&
      record.ownerId !== userId
    ) {
      throw new BadRequestException("This access pass code belongs to another account");
    }

    if (record.status === AccessPassCodeStatus.EXPIRED) {
      throw new BadRequestException("This access pass code has expired");
    }
    if (record.status !== AccessPassCodeStatus.AVAILABLE) {
      throw new BadRequestException(
        record.status === AccessPassCodeStatus.ACTIVE
          ? "This access pass is already active"
          : "This access pass code has already been used",
      );
    }
    if (record.expiresAt && record.expiresAt.getTime() <= Date.now()) {
      await this.prisma.accessPassCode.update({
        where: { id: record.id },
        data: { status: AccessPassCodeStatus.EXPIRED },
      });
      throw new BadRequestException("This access pass code has expired");
    }
    if (!record.accessPass.isActive) {
      throw new BadRequestException("This access pass is no longer available");
    }

    const active = await this.prisma.userEntitlement.findFirst({
      where: {
        userId,
        status: PlanEntitlementStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      orderBy: { startedAt: "desc" },
    });
    if (active && !dto.confirmForfeit) {
      throw new ConflictException({
        statusCode: 409,
        error: "ActiveEntitlementConflict",
        message: `You already have an active ${active.kind === "PLAN" ? "plan" : "access pass"}${
          active.planName ? ` (${active.planName})` : ""
        } until ${active.expiresAt.toISOString()}. Activating this access pass will forfeit the remaining time.`,
        details: {
          requiresForfeit: true,
          activeKind: active.kind,
          activePlanName: active.planName,
          expiresAt: active.expiresAt,
        },
      });
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + record.accessPass.durationDays * 86_400_000,
    );
    const features = await this.capabilities.features();
    const capabilities = mergeWithDefaults(
      record.accessPass.capabilities,
      features,
    ) as CapabilityMap;

    const result = await this.prisma.$transaction(async (tx) => {
      await this.forfeitActive(tx, userId, now);

      const entitlement = await tx.userEntitlement.create({
        data: {
          userId,
          kind: PlanEntitlementKind.ACCESS_PASS,
          status: PlanEntitlementStatus.ACTIVE,
          accessPassId: record.accessPassId,
          orderId: record.orderId,
          source: "code_redeem",
          planName: record.accessPass.name,
          capabilities: capabilities as unknown as Prisma.InputJsonValue,
          startedAt: now,
          expiresAt,
        },
      });

      await tx.accessPassCode.update({
        where: { id: record.id },
        data: {
          status: AccessPassCodeStatus.ACTIVE,
          ownerId: record.ownerId ?? userId,
          activatedAt: now,
          entitlementExpiresAt: expiresAt,
        },
      });

      await this.syncSubscription(tx, userId, {
        planId: record.accessPassId,
        planName: record.accessPass.name,
        kind: "access_pass",
        capabilities,
        expiresAt,
      });

      return entitlement;
    });

    await this.capabilities.invalidate(userId);

    return {
      entitlement: result,
      accessPass: record.accessPass,
      expiresAt,
      forfeited: active
        ? {
            kind: active.kind,
            planName: active.planName,
            expiresAt: active.expiresAt,
          }
        : null,
    };
  }

  // ── Activation / expiry ──────────────────────────────────────────────────

  /**
   * Marks a paid order as activated. Idempotent. For `save_code` access-pass
   * orders this issues a code instead of starting an entitlement.
   */
  async activateOrder(orderId: string) {
    const order = await this.prisma.planOrder.findUnique({
      where: { id: orderId },
      include: {
        planVariant: { include: { plan: true } },
        accessPass: true,
      },
    });
    if (!order) throw new NotFoundException("Plan order not found");

    if (order.status === PlanOrderStatus.PAID && order.activatedAt) {
      return {
        order,
        code: order.accessPassCodeId
          ? await this.prisma.accessPassCode.findUnique({
              where: { id: order.accessPassCodeId },
            })
          : null,
        entitlement: null,
      };
    }

    const now = new Date();

    // Access pass bought "to keep": issue a code and don't touch entitlements.
    if (
      order.kind === PlanOrderKind.ACCESS_PASS &&
      order.activationMode === "save_code" &&
      order.accessPass
    ) {
      const code = this.generateAccessPassCode();
      const expiresAt = order.accessPass.codeValidityDays
        ? new Date(
            now.getTime() + order.accessPass.codeValidityDays * 86_400_000,
          )
        : null;

      const result = await this.prisma.$transaction(async (tx) => {
        const saved = await tx.accessPassCode.upsert({
          where: { orderId: order.id },
          update: {},
          create: {
            accessPassId: order.accessPassId!,
            code,
            status: AccessPassCodeStatus.AVAILABLE,
            ownerId: order.userId,
            orderId: order.id,
            expiresAt,
          },
        });
        const updatedOrder = await tx.planOrder.update({
          where: { id: order.id },
          data: {
            status: PlanOrderStatus.PAID,
            activatedAt: now,
            accessPassCodeId: saved.id,
          },
        });
        return { saved, updatedOrder };
      });

      return {
        order: result.updatedOrder,
        code: result.saved,
        entitlement: null,
      };
    }

    const variant = order.planVariant;
    const pass = order.accessPass;
    if (!variant && !pass) {
      throw new BadRequestException("This order has no product attached");
    }

    const features = await this.capabilities.features();
    const capabilities = mergeWithDefaults(
      variant?.capabilities ?? pass?.capabilities,
      features,
    ) as CapabilityMap;
    const durationDays = variant?.durationDays ?? pass?.durationDays ?? 0;
    if (durationDays <= 0) {
      throw new BadRequestException("This product has no valid duration");
    }

    const planName = variant
      ? `${variant.plan.name} · ${variant.name}`
      : pass?.name ?? "Access pass";

    const result = await this.prisma.$transaction(async (tx) => {
      const active = await tx.userEntitlement.findFirst({
        where: {
          userId: order.userId,
          status: PlanEntitlementStatus.ACTIVE,
          expiresAt: { gt: now },
        },
        orderBy: { startedAt: "desc" },
      });

      // Renewing the exact same product extends the existing window; anything
      // else replaces it (and forfeits the remainder).
      const isRenewal =
        active &&
        active.kind ===
          (variant
            ? PlanEntitlementKind.PLAN
            : PlanEntitlementKind.ACCESS_PASS) &&
        active.planVariantId === (variant?.id ?? null) &&
        active.accessPassId === (pass?.id ?? null);

      const startedAt =
        isRenewal && active.expiresAt > now ? active.expiresAt : now;
      const expiresAt = new Date(
        startedAt.getTime() + durationDays * 86_400_000,
      );

      if (active) {
        await tx.userEntitlement.update({
          where: { id: active.id },
          data: {
            status: PlanEntitlementStatus.FORFEITED,
            forfeitedAt: now,
          },
        });
      }

      const entitlement = await tx.userEntitlement.create({
        data: {
          userId: order.userId,
          kind: variant
            ? PlanEntitlementKind.PLAN
            : PlanEntitlementKind.ACCESS_PASS,
          status: PlanEntitlementStatus.ACTIVE,
          planVariantId: variant?.id ?? null,
          accessPassId: pass?.id ?? null,
          orderId: order.id,
          source: "purchase",
          planName,
          accessLevel: variant?.accessLevel ?? null,
          capabilities: capabilities as unknown as Prisma.InputJsonValue,
          startedAt,
          expiresAt,
        },
      });

      await this.syncSubscription(tx, order.userId, {
        planId: variant?.id ?? pass?.id ?? null,
        planName,
        kind: variant ? "plan" : "access_pass",
        capabilities,
        expiresAt,
      });

      const updatedOrder = await tx.planOrder.update({
        where: { id: order.id },
        data: {
          status: PlanOrderStatus.PAID,
          activatedAt: now,
          entitlementExpiresAt: expiresAt,
        },
      });

      return { entitlement, updatedOrder, renewed: Boolean(isRenewal) };
    });

    await this.capabilities.invalidate(order.userId);

    return {
      order: result.updatedOrder,
      entitlement: result.entitlement,
      code: null,
      renewed: result.renewed,
    };
  }

  async refundOrder(orderId: string) {
    const order = await this.prisma.planOrder.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException("Plan order not found");

    await this.prisma.$transaction(async (tx) => {
      await tx.planOrder.update({
        where: { id: orderId },
        data: { status: PlanOrderStatus.REFUNDED },
      });

      const entitlement = await tx.userEntitlement.findFirst({
        where: { orderId, status: PlanEntitlementStatus.ACTIVE },
      });
      if (entitlement) {
        await tx.userEntitlement.update({
          where: { id: entitlement.id },
          data: {
            status: PlanEntitlementStatus.CANCELLED,
            forfeitedAt: new Date(),
          },
        });
      }
      if (order.accessPassCodeId) {
        await tx.accessPassCode.updateMany({
          where: { id: order.accessPassCodeId, status: { not: AccessPassCodeStatus.ACTIVE } },
          data: { status: AccessPassCodeStatus.REVOKED },
        });
      }
      await this.clearSubscription(tx, order.userId);
    });

    await this.capabilities.invalidate(order.userId);
    return { refunded: true };
  }

  async expireStale(userId: string) {
    const now = new Date();
    const result = await this.prisma.userEntitlement.updateMany({
      where: { userId, status: PlanEntitlementStatus.ACTIVE, expiresAt: { lte: now } },
      data: { status: PlanEntitlementStatus.EXPIRED },
    });
    await this.prisma.accessPassCode.updateMany({
      where: {
        ownerId: userId,
        status: AccessPassCodeStatus.ACTIVE,
        entitlementExpiresAt: { lte: now },
      },
      data: { status: AccessPassCodeStatus.EXPIRED },
    });
    await this.prisma.accessPassCode.updateMany({
      where: {
        status: AccessPassCodeStatus.AVAILABLE,
        expiresAt: { lte: now },
      },
      data: { status: AccessPassCodeStatus.EXPIRED },
    });
    if (result.count > 0) {
      await this.capabilities.invalidate(userId);
      const remaining = await this.prisma.userEntitlement.findFirst({
        where: {
          userId,
          status: PlanEntitlementStatus.ACTIVE,
          expiresAt: { gt: now },
        },
      });
      if (!remaining) {
        const sub = await this.prisma.subscription.findUnique({
          where: { userId },
        });
        if (
          sub?.entitlementKind === "plan" ||
          sub?.entitlementKind === "access_pass"
        ) {
          await this.prisma.subscription.update({
            where: { userId },
            data: {
              status: "expired",
              isActive: false,
              capabilities: {},
              features: [],
              quotas: {},
              limits: {},
            },
          });
        }
      }
    }
    return result.count;
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async resolveProduct(userId: string, dto: PurchasePlanDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true },
    });
    const audience = "BUSINESS";

    if (dto.kind === PlanOrderKind.PLAN) {
      if (!dto.planVariantId) {
        throw new BadRequestException("planVariantId is required for a plan");
      }
      const variant = await this.prisma.membershipPlanVariant.findUnique({
        where: { id: dto.planVariantId },
        include: { plan: true },
      });
      if (!variant || !variant.isActive || !variant.plan.isActive) {
        throw new NotFoundException("Plan is not available");
      }
      if (
        variant.plan.audience !== "BOTH" &&
        variant.plan.audience !== audience
      ) {
        throw new BadRequestException(
          "This plan is not available for business accounts",
        );
      }
      return {
        variant,
        accessPass: null,
        amountMinor: variant.priceMinor,
        currency: variant.currency,
        name: `${variant.plan.name} · ${variant.name}`,
      };
    }

    if (!dto.accessPassId) {
      throw new BadRequestException("accessPassId is required for an access pass");
    }
    const pass = await this.prisma.accessPass.findUnique({
      where: { id: dto.accessPassId },
    });
    if (!pass || !pass.isActive) {
      throw new NotFoundException("Access pass is not available");
    }
    return {
      variant: null,
      accessPass: pass,
      amountMinor: pass.priceMinor,
      currency: pass.currency,
      name: pass.name,
    };
  }

  private async forfeitActive(
    tx: Prisma.TransactionClient,
    userId: string,
    now: Date,
  ) {
    const active = await tx.userEntitlement.findFirst({
      where: {
        userId,
        status: PlanEntitlementStatus.ACTIVE,
        expiresAt: { gt: now },
      },
      orderBy: { startedAt: "desc" },
    });
    if (active) {
      await tx.userEntitlement.update({
        where: { id: active.id },
        data: {
          status: PlanEntitlementStatus.FORFEITED,
          forfeitedAt: now,
        },
      });
    }
    return active;
  }

  private async syncSubscription(
    tx: Prisma.TransactionClient,
    userId: string,
    input: {
      planId: string | null;
      planName: string;
      kind: "plan" | "access_pass";
      capabilities: CapabilityMap;
      expiresAt: Date;
    },
  ) {
    const features = Object.entries(input.capabilities)
      .filter(([, rule]) => rule.enabled)
      .map(([key]) => key);
    const quotas = Object.fromEntries(
      Object.entries(input.capabilities)
        .filter(([, rule]) => rule.enabled && !rule.unlimited && rule.limit !== null)
        .map(([key, rule]) => [key, rule.limit]),
    );

    const payload = {
      planId: input.planId,
      planName: input.planName,
      source: input.kind,
      entitlementKind: input.kind,
      status: "active",
      quotas: quotas as Prisma.InputJsonValue,
      limits: input.capabilities as unknown as Prisma.InputJsonValue,
      features,
      capabilities: input.capabilities as unknown as Prisma.InputJsonValue,
      isTrial: false,
      tasksToComplete: [] as unknown as Prisma.InputJsonValue,
      membershipPlanName: input.planName,
      expiresAt: input.expiresAt,
      isActive: true,
      lastSyncedAt: new Date(),
    };

    await tx.subscription.upsert({
      where: { userId },
      update: payload,
      create: { userId, ...payload },
    });
  }

  private async clearSubscription(
    tx: Prisma.TransactionClient,
    userId: string,
  ) {
    const sub = await tx.subscription.findUnique({ where: { userId } });
    if (
      sub &&
      (sub.entitlementKind === "plan" ||
        sub.entitlementKind === "membership" ||
        sub.entitlementKind === "access_pass")
    ) {
      await tx.subscription.update({
        where: { userId },
        data: {
          status: "inactive",
          isActive: false,
          capabilities: {},
          features: [],
          quotas: {},
          limits: {},
          entitlementKind: null,
        },
      });
    }
  }

  private makeReference(): string {
    return `FD-PLAN-${Date.now().toString(36).toUpperCase()}-${randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;
  }

  private generateAccessPassCode(): string {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const block = () =>
      Array.from({ length: 4 }, () =>
        alphabet[Math.floor(Math.random() * alphabet.length)],
      ).join("");
    return `FDAP-${block()}-${block()}-${block()}`;
  }
}
