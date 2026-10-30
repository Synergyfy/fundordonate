/**
 * Reward fulfilment helpers.
 *
 * MCOM Rewards is the source of truth for how a reward is delivered. FundOrDonate
 * must never infer Mall vs Central from the cosmetic `rewardType`; it uses the
 * provider's `fulfilmentKind` and mirrors the provider's fulfilment fields.
 *
 * These helpers are intentionally pure so they can be unit-tested and reused by
 * the trigger engine, the issuance mirror, and the consumer/public APIs.
 */

import type {
  McomFulfilmentKind,
  McomFulfilmentProvider,
  McomRewardIssuance,
} from "@/mcom/rewards-client.service";

/** Fulfilment kinds that a consumer must never receive. */
export const CENTRAL_ONLY_FULFILMENT_KINDS = [
  "CENTRAL_MEMBERSHIP",
  "CENTRAL_ACCESS_PASS",
  "CENTRAL_COUPON",
] as const;

/** Fulfilment kinds delivered through MCOM Mall. */
export const MALL_FULFILMENT_KINDS = [
  "MALL_GIFT_CARD",
  "MALL_VOUCHER",
  "MALL_COUPON",
  "MALL_DISCOUNT",
] as const;

export const INELIGIBLE_AUDIENCE = "INELIGIBLE_AUDIENCE";

export interface RewardInstructionLink {
  label: string;
  url: string;
}

export interface RewardInstructions {
  headline: string;
  body: string;
  code?: string | null;
  links: RewardInstructionLink[];
  note?: string | null;
}

export interface FulfilmentScope {
  mode?: string | null;
  listingIds?: string[] | null;
  productIds?: string[] | null;
  serviceIds?: string[] | null;
  businessId?: string | null;
  [key: string]: unknown;
}

export interface FulfilmentContext {
  fulfilmentProvider?: McomFulfilmentProvider | null;
  fulfilmentKind?: McomFulfilmentKind | null;
  code?: string | null;
  deepLink?: string | null;
  scope?: FulfilmentScope | null;
  businessId?: string | null;
  businessName?: string | null;
  centralReference?: string | null;
  expiresAt?: string | null;
  fulfilmentStatus?: string | null;
  fulfilmentError?: string | null;
  metadata?: Record<string, unknown> | null;
  mallWebUrl: string;
  centralWebUrl: string;
}

export function normaliseFulfilmentKind(
  kind?: string | null,
): string | null {
  return kind ? kind.trim().toUpperCase() : null;
}

export function isCentralFulfilmentKind(kind?: string | null): boolean {
  const normalised = normaliseFulfilmentKind(kind);
  return !!normalised && CENTRAL_ONLY_FULFILMENT_KINDS.includes(normalised as never);
}

export function isMallFulfilmentKind(kind?: string | null): boolean {
  const normalised = normaliseFulfilmentKind(kind);
  return !!normalised && MALL_FULFILMENT_KINDS.includes(normalised as never);
}

/** True when the provider explicitly marks the reward as consumer-eligible. */
export function isExplicitlyConsumerEligible(
  consumerEligible?: boolean | null,
): boolean {
  return consumerEligible === true;
}

/**
 * Whether a consumer may win a reward.
 *
 * Explicit provider eligibility wins. Central kinds are always business-only,
 * even if the provider accidentally marks them consumer-eligible. When the
 * provider has not exposed eligibility/kind yet we degrade conservatively only
 * for known Central kinds — we do not guess from `rewardType`.
 */
export function consumerCanWin(input: {
  fulfilmentKind?: string | null;
  consumerEligible?: boolean | null;
}): boolean {
  if (input.consumerEligible === false) return false;
  if (isCentralFulfilmentKind(input.fulfilmentKind)) return false;
  return true;
}

/** Whether a business may win a reward. Business-owned Central rewards are OK. */
export function businessCanWin(input: {
  fulfilmentKind?: string | null;
  businessEligible?: boolean | null;
}): boolean {
  if (input.businessEligible === false) return false;
  if (normaliseFulfilmentKind(input.fulfilmentKind) === "POINT_OFFER") return false;
  return true;
}

/** Human "what you get" copy for a fulfilment kind. */
export function fulfilmentKindLabel(kind?: string | null): string {
  switch (normaliseFulfilmentKind(kind)) {
    case "MALL_GIFT_CARD":
      return "Mall gift card";
    case "MALL_VOUCHER":
      return "Mall voucher";
    case "MALL_COUPON":
      return "Mall coupon";
    case "MALL_DISCOUNT":
      return "Mall discount";
    case "CENTRAL_MEMBERSHIP":
      return "MCOM membership";
    case "CENTRAL_ACCESS_PASS":
      return "MCOM access pass";
    case "CENTRAL_COUPON":
      return "MCOM Central coupon";
    default:
      return "Reward";
  }
}

/** Short "what you get" line used on reward cards. */
export function fulfilmentSummary(kind?: string | null): string {
  switch (normaliseFulfilmentKind(kind)) {
    case "MALL_GIFT_CARD":
      return "Spend this gift card on MCOM Mall.";
    case "MALL_VOUCHER":
      return "Use this voucher at MCOM Mall checkout.";
    case "MALL_COUPON":
      return "Use this coupon at MCOM Mall checkout.";
    case "MALL_DISCOUNT":
      return "Applied automatically at MCOM Mall checkout.";
    case "CENTRAL_MEMBERSHIP":
      return "Your MCOM membership will be activated.";
    case "CENTRAL_ACCESS_PASS":
      return "Redeem this access pass in MCOM Central.";
    case "CENTRAL_COUPON":
      return "Use this coupon in MCOM Central (not valid on Mall).";
    default:
      return "Reward issued by MCOM Rewards.";
  }
}

function trimBase(url: string): string {
  return (url ?? "").replace(/\/+$/, "");
}

function withRewardCode(url: string, code?: string | null): string {
  if (!code) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}reward=${encodeURIComponent(code)}`;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && !!item)
    : [];
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function mallLinks(ctx: FulfilmentContext): RewardInstructionLink[] {
  const base = trimBase(ctx.mallWebUrl);
  const code = ctx.code ?? null;
  const scope = ctx.scope ?? null;
  const mode = (scope?.mode ?? "").toUpperCase();

  // A provider-rendered deep link is authoritative — never reconstruct it.
  if (ctx.deepLink) {
    return [{ label: "Open reward", url: ctx.deepLink }];
  }

  // Business-bound reward: link to the business storefront.
  const businessId = ctx.businessId ?? scope?.businessId ?? null;
  if (businessId) {
    return [
      {
        label: ctx.businessName
          ? `Shop at ${ctx.businessName}`
          : "Shop at this business",
        url: withRewardCode(`${base}/listings/${encodeURIComponent(businessId)}`, code),
      },
    ];
  }

  if (mode === "LISTINGS") {
    const listingIds = asStringArray(scope?.listingIds);
    if (listingIds.length > 0) {
      return listingIds.map((listingId, index) => ({
        label: `View listing ${index + 1}`,
        url: withRewardCode(
          `${base}/listings/${encodeURIComponent(listingId)}`,
          code,
        ),
      }));
    }
  }

  if (mode === "ITEMS") {
    const links: RewardInstructionLink[] = [];
    for (const productId of asStringArray(scope?.productIds)) {
      links.push({
        label: "View product",
        url: withRewardCode(
          `${base}/products/${encodeURIComponent(productId)}`,
          code,
        ),
      });
    }
    for (const serviceId of asStringArray(scope?.serviceIds)) {
      links.push({
        label: "View service",
        url: withRewardCode(
          `${base}/services/${encodeURIComponent(serviceId)}`,
          code,
        ),
      });
    }
    if (links.length > 0) return links;
  }

  return [
    {
      label: "Shop MCOM Mall",
      url: withRewardCode(`${base}/marketplace`, code),
    },
  ];
}

function centralLink(ctx: FulfilmentContext, kind: string): RewardInstructionLink {
  const base = trimBase(ctx.centralWebUrl);
  if (ctx.deepLink) {
    return { label: "Open MCOM Central", url: ctx.deepLink };
  }
  if (kind === "CENTRAL_ACCESS_PASS") {
    return { label: "Redeem in MCOM Central", url: `${base}/dashboard` };
  }
  return { label: "Manage in MCOM Central", url: `${base}/membership` };
}

/**
 * Build the deterministic instructions persisted on the local issuance mirror.
 * The UI renders these directly so it never recomputes (and never drifts).
 */
export function buildRewardInstructions(ctx: FulfilmentContext): RewardInstructions {
  const kind = normaliseFulfilmentKind(ctx.fulfilmentKind);
  const status = normaliseFulfilmentKind(ctx.fulfilmentStatus);
  const code = ctx.code ?? null;
  // A code is only usable once delivery actually succeeded. Failed/pending
  // rewards must never present a redeemable-looking code.
  const deliverySucceeded = ![
    "PENDING",
    "PENDING_IDENTITY",
    "PENDING_CONFLICT",
    "FAILED",
    "REVOKED",
  ].includes(status ?? "");
  const usableCode = deliverySucceeded ? code : null;

  // Non-happy-path fulfilment first — the consumer needs actionable guidance.
  if (status === "PENDING") {
    return {
      headline: "We're delivering your reward",
      body: "MCOM Rewards is preparing this reward. Your code will appear here once delivery succeeds.",
      code: null,
      links: [],
      note: "No action is needed from you right now.",
    };
  }
  if (status === "PENDING_IDENTITY") {
    return {
      headline: "Link your MCOM account",
      body: "Link your MCOM account to receive this reward.",
      code: null,
      links: [],
      note: "Once linked, MCOM Rewards will deliver the reward automatically.",
    };
  }
  if (status === "PENDING_CONFLICT") {
    return {
      headline: "Reward awaiting confirmation",
      body:
        "Your reward is on hold while MCOM Rewards resolves a membership conflict.",
      code: null,
      links: [],
      note: "Our team has been notified — no action is needed from you right now.",
    };
  }
  if (status === "FAILED") {
    return {
      headline: "We couldn't deliver this reward",
      body:
        ctx.fulfilmentError ??
        "MCOM Rewards could not deliver this reward. Our team has been notified.",
      code: null,
      links: [],
      note: "We will retry automatically where possible.",
    };
  }

  if (kind?.startsWith("MALL")) {
    const isDiscount = kind === "MALL_DISCOUNT";
    return {
      headline: isDiscount
        ? "Your MCOM Mall discount is ready"
        : "Your MCOM Mall reward is ready",
      body: isDiscount
        ? "This discount is applied automatically at MCOM Mall checkout."
        : "Use this code at MCOM Mall checkout.",
      code: isDiscount ? null : usableCode,
      links: mallLinks(ctx),
      note: ctx.businessName
        ? `This reward is provided by ${ctx.businessName}.`
        : null,
    };
  }

  if (kind === "CENTRAL_MEMBERSHIP") {
    return {
      headline: "Your MCOM membership is active",
      body: "Your MCOM membership has been activated.",
      code: null,
      links: [centralLink(ctx, kind)],
      note: ctx.expiresAt
        ? `Active until ${new Date(ctx.expiresAt).toLocaleDateString("en-GB")}.`
        : null,
    };
  }

  if (kind === "CENTRAL_ACCESS_PASS") {
    return {
      headline: "Your MCOM access pass is ready",
      body: "Redeem this code in MCOM Central to activate your access pass.",
      code: usableCode,
      links: [centralLink(ctx, kind)],
      note: null,
    };
  }

  if (kind === "CENTRAL_COUPON") {
    return {
      headline: "Your MCOM Central coupon is ready",
      body:
        "Use this code at MCOM Central membership/access checkout. It cannot be used on Mall products.",
      code: usableCode,
      links: [centralLink(ctx, kind)],
      note: "Not valid on MCOM Mall products.",
    };
  }

  // Unknown/legacy fulfilment: show the code without guessing where it applies.
  return {
    headline: "Your reward is ready",
    body: "Show this code to redeem your reward.",
    code: usableCode,
    links: ctx.deepLink ? [{ label: "Open reward", url: ctx.deepLink }] : [],
    note: null,
  };
}

/** Extract the provider's fulfilment metadata for a catalogue/issue payload. */
export function extractIssuanceFulfilment(
  issuance: McomRewardIssuance,
): {
  fulfilmentProvider: string | null;
  fulfilmentKind: string | null;
  fulfilmentStatus: string | null;
  fulfilmentRef: string | null;
  fulfilmentCode: string | null;
  fulfilmentError: string | null;
  centralReference: string | null;
  deepLink: string | null;
  businessId: string | null;
  businessName: string | null;
  scope: FulfilmentScope | null;
  code: string | null;
  fulfilledAt: string | null;
} {
  const metadata = asObject(issuance.metadata);
  const fulfilment = asObject(metadata.fulfilment);
  const scope = asObject(fulfilment.scope);

  return {
    fulfilmentProvider:
      issuance.fulfilmentProvider ??
      (typeof fulfilment.provider === "string" ? fulfilment.provider : null),
    fulfilmentKind:
      issuance.fulfilmentKind ??
      (typeof fulfilment.kind === "string" ? fulfilment.kind : null),
    fulfilmentStatus: issuance.fulfilmentStatus ?? null,
    fulfilmentRef: issuance.fulfilmentRef ?? null,
    fulfilmentCode: issuance.fulfilmentCode ?? issuance.code ?? null,
    fulfilmentError: issuance.fulfilmentError ?? null,
    centralReference: issuance.centralReference ?? null,
    deepLink:
      issuance.deepLink ??
      (typeof fulfilment.deepLink === "string" ? fulfilment.deepLink : null),
    businessId:
      typeof fulfilment.businessId === "string"
        ? fulfilment.businessId
        : typeof fulfilment.businessRef === "string"
          ? fulfilment.businessRef
          : null,
    businessName:
      typeof fulfilment.businessName === "string" ? fulfilment.businessName : null,
    scope: Object.keys(scope).length > 0 ? (scope as FulfilmentScope) : null,
    code: issuance.code ?? issuance.fulfilmentCode ?? null,
    fulfilledAt: issuance.fulfilledAt ?? null,
  };
}

/** Resolve web URLs for instruction building from a configuration object. */
export function rewardWebUrls(config: {
  get<T = string>(key: string): T | undefined;
}): { mallWebUrl: string; centralWebUrl: string } {
  const isProduction = config.get<string>("nodeEnv") === "production";
  return {
    mallWebUrl:
      config.get<string>("rewards.mallWebUrl") ??
      (isProduction ? "https://mall.mcom.com" : "http://localhost:3003"),
    centralWebUrl:
      config.get<string>("rewards.centralWebUrl") ??
      (isProduction
        ? "https://auth.mcomsolutions.com"
        : "http://localhost:3000"),
  };
}
