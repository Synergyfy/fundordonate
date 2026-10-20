import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma/prisma.service";
import {
  McomPaymentsService,
  McomPaymentsError,
  McomWalletBalance,
  McomWebhookPayload,
} from "@/mcom/mcom-payments.service";
import {
  ChargePurposeType,
  CreateChargeDto,
  PaymentMethod,
} from "./dto/create-charge.dto";
import { ConfirmChargeDto } from "./dto/confirm-charge.dto";
import { ContributionStatus, ContributionType } from "@prisma/client";
import { RewardIssueQueueService } from "@/modules/rewards/services/reward-issue-queue.service";
import { RewardRevokeQueueService } from "@/modules/rewards/services/reward-revoke-queue.service";

/**
 * Placeholder MCOM ids written by an older auto-link routine (`mcom_<localId>`)
 * are not real Central Hub identities, so treat them as unlinked.
 */
function isRealMcomLink(
  localUserId: string,
  mcomUserId: string | null | undefined,
): mcomUserId is string {
  return Boolean(mcomUserId) && mcomUserId !== `mcom_${localUserId}`;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mcomPayments: McomPaymentsService,
    private readonly rewardIssuanceQueue: RewardIssueQueueService,
    private readonly rewardRevokeQueue: RewardRevokeQueueService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Fetch current user's MCOM Central Hub wallet balance.
   *
   * A failed lookup is never reported as a real zero balance: an unlinked
   * account and an unreachable Central Hub both surface as explicit errors so
   * the UI can say "unavailable" instead of "insufficient".
   */
  async getWalletBalance(userId: string): Promise<McomWalletBalance> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, mcomUserId: true },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!isRealMcomLink(user.id, user.mcomUserId)) {
      throw new BadRequestException(
        "Your account isn't linked to an MCOM Central Hub wallet yet. Sign in through MCOM Central Hub to use your wallet balance.",
      );
    }
    const mcomUserId = user.mcomUserId;

    try {
      return await this.mcomPayments.getBalance(mcomUserId);
    } catch (err) {
      this.logger.warn(
        `Wallet balance lookup failed for user ${userId} (${mcomUserId}): ${
          (err as Error).message
        }`,
      );
      // 400/404/409/422 from Central Hub mean the linked wallet doesn't exist
      // there — report that accurately rather than as a connectivity failure.
      // Auth (401/403) and rate-limit (429) failures remain platform errors.
      if (
        err instanceof McomPaymentsError &&
        [400, 404, 409, 422].includes(err.httpStatus)
      ) {
        throw new BadRequestException(
          "Your MCOM wallet could not be found on Central Hub. Sign in with MCOM Central Hub and try again.",
        );
      }
      throw new ServiceUnavailableException(
        "We couldn't reach MCOM Central Hub to check your wallet balance. Please try again.",
      );
    }
  }

  /**
   * Create an MCOM Pay charge (Stripe, PayPal, or MCOM Wallet).
   */
  async createCharge(userId: string | null, dto: CreateChargeDto) {
    let mcomUserId: string | undefined;

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, mcomUserId: true },
      });
      mcomUserId =
        user && isRealMcomLink(user.id, user.mcomUserId)
          ? user.mcomUserId
          : undefined;
    }

    if (dto.method === PaymentMethod.WALLET) {
      if (!mcomUserId) {
        throw new BadRequestException(
          "Paying with MCOM Wallet requires an account linked to MCOM Central Hub.",
        );
      }
    }

    let campaign = null;
    let businessId: string | undefined = undefined;

    if (dto.type === ChargePurposeType.SELF_FUNDING) {
      if (!userId) {
        throw new UnauthorizedException("Authentication required for self-funding");
      }
      if (!dto.campaignId) {
        throw new BadRequestException("Campaign ID is required for self-funding");
      }
      // Query-level ownership enforcement: Only the owner of the business campaign can self-fund
      campaign = await this.prisma.businessCampaign.findFirst({
        where: {
          id: dto.campaignId,
          business: {
            ownerId: userId,
          },
        },
        include: { business: true },
      });
      if (!campaign) {
        // Return 404 rather than 403 to prevent ID enumeration
        throw new NotFoundException("Campaign not found");
      }
      businessId = campaign.businessId;
    } else if (dto.campaignId) {
      campaign = await this.prisma.businessCampaign.findUnique({
        where: { id: dto.campaignId },
        include: { business: true },
      });
      if (!campaign) {
        throw new NotFoundException("Campaign not found");
      }
      // Never trust client-supplied businessId; strictly bind to campaign's parent business
      businessId = campaign.businessId;
    } else if (dto.businessId) {
      const biz = await this.prisma.business.findUnique({
        where: { id: dto.businessId },
      });
      if (!biz) {
        throw new NotFoundException("Business not found");
      }
      businessId = biz.id;
    }

    // Generate deterministic business reference
    const typePrefix = dto.type.slice(0, 3).toUpperCase();
    const reference = `FD-${typePrefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(
      100 + Math.random() * 900,
    )}`;

    const amountMinorStr = String(Math.round(dto.amountMinor));

    // If tied to a business/campaign, create an initial PENDING contribution record
    let contribution = null;
    if (businessId && campaign) {
      const contribType =
        dto.type === ChargePurposeType.SELF_FUNDING
          ? ContributionType.SELF_FUNDING
          : ContributionType.ONLINE;

      contribution = await this.prisma.contribution.create({
        data: {
          businessId,
          campaignId: campaign.id,
          backerId: userId ?? null,
          type: contribType,
          status: ContributionStatus.PENDING,
          amount: Math.round(dto.amountMinor),
          reference,
          gateway: dto.method === PaymentMethod.WALLET ? "mcom_wallet" : dto.method,
          metadata: {
            chargePurpose: dto.type,
            notes: dto.notes ?? null,
            isAnonymous: dto.isAnonymous ?? false,
            rewardId: dto.rewardId ?? null,
            customMetadata: dto.metadata ?? {},
          } as any,
        },
      });
    }

    // Call MCOM Central Hub to create the charge
    const chargeResult = await this.mcomPayments.createCharge({
      amountMinor: amountMinorStr,
      currency: "GBP",
      method: dto.method,
      reference,
      description:
        dto.description ||
        `FundorDonate ${dto.type}${campaign ? ` - ${campaign.title}` : ""} (${reference})`,
      mcomUserId,
      metadata: {
        platform: "fundordonate",
        contributionId: contribution?.id ?? null,
        campaignId: campaign?.id ?? null,
        purpose: dto.type,
        returnUrl: `${this.config.get<string>("cors.origin") ?? "http://localhost:5023"}/payment/return`,
        cancelUrl: `${this.config.get<string>("cors.origin") ?? "http://localhost:5023"}/payment-failed`,
        customMetadata: dto.metadata ?? {},
      },
      idempotencyKey: `fundordonate-charge-${reference}`,
    });

    const charge = chargeResult.charge;

    // Attach Central charge ID to local contribution
    if (contribution) {
      await this.prisma.contribution.update({
        where: { id: contribution.id },
        data: {
          mcomChargeId: charge.id,
          paymentIntentId: charge.providerRef ?? null,
        },
      });

      // If method is wallet, it settles immediately (status = paid)
      if (charge.status === "paid") {
        await this.activatePaidContribution(contribution.id, charge);
      }
    }

    return {
      chargeId: charge.id,
      status: charge.status,
      method: charge.method,
      amountMinor: charge.amountMinor,
      feeMinor: charge.feeMinor,
      netMinor: charge.netMinor,
      reference,
      clientSecret: chargeResult.clientSecret,
      publishableKey:
        this.config.get<string>("stripe.publishableKey") ||
        this.config.get<string>("STRIPE_PUBLISHABLE_KEY") ||
        "",
      approvalUrl: chargeResult.approvalUrl,
      contributionId: contribution?.id ?? null,
    };
  }

  /**
   * Confirm charge server-side after front-end Stripe/PayPal completion.
   */
  async confirmCharge(chargeId: string, dto: ConfirmChargeDto) {
    const res = await this.mcomPayments.confirmCharge(chargeId, dto);
    const charge = res.charge;

    if (charge.status === "paid") {
      const contribution = await this.prisma.contribution.findUnique({
        where: { mcomChargeId: chargeId },
      });
      if (contribution && contribution.status !== ContributionStatus.COMPLETED) {
        await this.activatePaidContribution(contribution.id, charge);
      }
    }

    return res;
  }

  /**
   * Server-to-server webhook handler for Central Hub lifecycle events.
   */
  async processWebhook(rawBody: Buffer, signature: string) {
    const isValid = this.mcomPayments.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      this.logger.warn("Webhook rejected: Invalid MCOM HMAC signature");
      throw new UnauthorizedException("Invalid webhook signature");
    }

    let payload: McomWebhookPayload;
    try {
      payload = JSON.parse(rawBody.toString("utf8"));
    } catch {
      throw new BadRequestException("Invalid webhook JSON payload");
    }

    this.logger.log(`Received MCOM webhook event: ${payload.event} for charge ${payload.data.chargeId}`);

    if (payload.event === "payment.succeeded") {
      const chargeData = payload.data;
      const contribution = await this.prisma.contribution.findFirst({
        where: {
          OR: [
            { mcomChargeId: chargeData.chargeId },
            { reference: chargeData.reference },
          ],
        },
      });

      if (contribution && contribution.status !== ContributionStatus.COMPLETED) {
        await this.activatePaidContribution(contribution.id, chargeData);
      }
    } else if (payload.event === "payment.refunded") {
      const chargeData = payload.data;
      const contribution = await this.prisma.contribution.findFirst({
        where: {
          OR: [
            { mcomChargeId: chargeData.chargeId },
            { reference: chargeData.reference },
          ],
        },
      });

      if (contribution && contribution.status === ContributionStatus.COMPLETED) {
        await this.revertContribution(contribution.id);
      }
    }

    return { received: true };
  }

  /**
   * Atomically marks a contribution COMPLETED and updates campaign raised totals.
   */
  private async activatePaidContribution(
    contributionId: string,
    chargeDetails: { id?: string; chargeId?: string; feeMinor?: string; netMinor?: string },
  ) {
    await this.prisma.$transaction(async (tx) => {
      const c = await tx.contribution.findUnique({
        where: { id: contributionId },
        include: { campaign: true },
      });

      if (!c || c.status === ContributionStatus.COMPLETED) {
        return;
      }

      await tx.contribution.update({
        where: { id: contributionId },
        data: {
          status: ContributionStatus.COMPLETED,
          mcomChargeId: chargeDetails.id || chargeDetails.chargeId || c.mcomChargeId,
        },
      });

      if (c.campaignId) {
        const isSelfFund = c.type === ContributionType.SELF_FUNDING;

        const previousCount = c.backerId
          ? await tx.contribution.count({
              where: {
                campaignId: c.campaignId,
                backerId: c.backerId,
                status: ContributionStatus.COMPLETED,
                id: { not: contributionId },
              },
            })
          : 0;
        const isNewBacker = !isSelfFund && previousCount === 0;

        // Note: self-funding no longer stamps `rewardTriggered` — the campaign
        // runner is not eligible for rewards from their own campaign.
        await tx.businessCampaign.update({
          where: { id: c.campaignId },
          data: {
            raisedAmount: { increment: c.amount },
            ...(isNewBacker ? { backerCount: { increment: 1 } } : {}),
            businessContribution: isSelfFund ? { increment: c.amount } : undefined,
          },
        });
      }
    });

    // Queue reward evaluation so a slow/unavailable MCOM Rewards can never
    // block or fail payment activation (retried with backoff; idempotent).
    await this.rewardIssuanceQueue.enqueueContribution(contributionId);

    this.logger.log(`Contribution ${contributionId} activated successfully.`);
  }

  /**
   * Atomically marks a contribution REFUNDED and decrements campaign raised totals.
   */
  private async revertContribution(contributionId: string) {
    await this.prisma.$transaction(async (tx) => {
      const c = await tx.contribution.findUnique({
        where: { id: contributionId },
      });

      if (!c || c.status === ContributionStatus.REFUNDED) {
        return;
      }

      await tx.contribution.update({
        where: { id: contributionId },
        data: { status: ContributionStatus.REFUNDED },
      });

      if (c.campaignId) {
        const remainingCount = c.backerId
          ? await tx.contribution.count({
              where: {
                campaignId: c.campaignId,
                backerId: c.backerId,
                status: ContributionStatus.COMPLETED,
                id: { not: contributionId },
              },
            })
          : 0;
        const shouldDecrement = c.backerId && remainingCount === 0;

        await tx.businessCampaign.update({
          where: { id: c.campaignId },
          data: {
            raisedAmount: { decrement: c.amount },
            ...(shouldDecrement ? { backerCount: { decrement: 1 } } : {}),
          },
        });
      }
    });

    // Revoke any reward issued for this contribution (durable, idempotent).
    await this.rewardRevokeQueue.enqueueContribution(contributionId);

    this.logger.log(`Contribution ${contributionId} refunded successfully.`);
  }
}
