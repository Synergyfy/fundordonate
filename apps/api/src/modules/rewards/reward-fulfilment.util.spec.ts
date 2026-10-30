import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildRewardInstructions,
  consumerCanWin,
  extractIssuanceFulfilment,
  isCentralFulfilmentKind,
  rewardWebUrls,
} from "./reward-fulfilment.util";
import type { McomRewardIssuance } from "@/mcom/rewards-client.service";

const urls = {
  mallWebUrl: "https://mall.example",
  centralWebUrl: "https://central.example",
};

test("rewardWebUrls never emits production URLs outside production", () => {
  const config = {
    get<T = string>(key: string): T | undefined {
      if (key === "nodeEnv") return "development" as unknown as T;
      return undefined;
    },
  };
  const resolved = rewardWebUrls(config);
  assert.equal(resolved.mallWebUrl, "http://localhost:3003");
  assert.equal(resolved.centralWebUrl, "http://localhost:3000");
  assert.ok(!resolved.mallWebUrl.includes("mall.mcom.com"));
  assert.ok(!resolved.centralWebUrl.includes("auth.mcomsolutions.com"));
});

test("rewardWebUrls uses provider configuration when present", () => {
  const config = {
    get<T = string>(key: string): T | undefined {
      const values: Record<string, string> = {
        nodeEnv: "production",
        "rewards.mallWebUrl": "https://mall.example",
        "rewards.centralWebUrl": "https://central.example",
      };
      return values[key] as unknown as T | undefined;
    },
  };
  assert.deepEqual(rewardWebUrls(config), urls);
});

test("failed and pending fulfilments never expose a usable code", () => {
  for (const fulfilmentStatus of [
    "FAILED",
    "PENDING",
    "PENDING_IDENTITY",
    "PENDING_CONFLICT",
  ]) {
    const instructions = buildRewardInstructions({
      fulfilmentKind: "MALL_GIFT_CARD",
      fulfilmentStatus,
      code: "MCOM-SHOULD-NOT-SHOW",
      fulfilmentError: "provider error",
      ...urls,
    });
    assert.equal(instructions.code, null);
    assert.deepEqual(instructions.links, []);
  }

  const delivered = buildRewardInstructions({
    fulfilmentKind: "MALL_GIFT_CARD",
    fulfilmentStatus: "DELIVERED",
    code: "MCOM-OK",
    ...urls,
  });
  assert.equal(delivered.code, "MCOM-OK");
});

test("consumers can never win Central fulfilment kinds", () => {
  assert.equal(
    consumerCanWin({
      fulfilmentKind: "CENTRAL_MEMBERSHIP",
      consumerEligible: true,
    }),
    false,
  );
  assert.equal(
    consumerCanWin({
      fulfilmentKind: "CENTRAL_ACCESS_PASS",
      consumerEligible: true,
    }),
    false,
  );
  assert.equal(
    consumerCanWin({ fulfilmentKind: "CENTRAL_COUPON" }),
    false,
  );
  assert.equal(isCentralFulfilmentKind("central_coupon"), true);
});

test("consumers can win Mall rewards and explicit ineligibility wins", () => {
  assert.equal(consumerCanWin({ fulfilmentKind: "MALL_GIFT_CARD" }), true);
  assert.equal(consumerCanWin({ fulfilmentKind: "MALL_DISCOUNT" }), true);
  assert.equal(
    consumerCanWin({ fulfilmentKind: "MALL_VOUCHER", consumerEligible: false }),
    false,
  );
});

test("Mall business-bound instructions prefer the business storefront", () => {
  const instructions = buildRewardInstructions({
    fulfilmentKind: "MALL_GIFT_CARD",
    code: "MCOM-123",
    businessId: "biz-1",
    businessName: "Acme Ltd",
    ...urls,
  });
  assert.equal(instructions.code, "MCOM-123");
  assert.equal(instructions.links[0]?.label, "Shop at Acme Ltd");
  assert.equal(
    instructions.links[0]?.url,
    "https://mall.example/listings/biz-1?reward=MCOM-123",
  );
});

test("scoped Mall instructions link to items", () => {
  const instructions = buildRewardInstructions({
    fulfilmentKind: "MALL_VOUCHER",
    code: "ABC",
    scope: {
      mode: "ITEMS",
      productIds: ["prod-1"],
      serviceIds: ["svc-1"],
    },
    ...urls,
  });
  assert.deepEqual(
    instructions.links.map((link) => link.url),
    [
      "https://mall.example/products/prod-1?reward=ABC",
      "https://mall.example/services/svc-1?reward=ABC",
    ],
  );
});

test("unscoped Mall instructions link to the marketplace", () => {
  const instructions = buildRewardInstructions({
    fulfilmentKind: "MALL_COUPON",
    code: "ABC",
    ...urls,
  });
  assert.equal(
    instructions.links[0]?.url,
    "https://mall.example/marketplace?reward=ABC",
  );
});

test("Central coupon carries the Mall exclusion note and Central link", () => {
  const instructions = buildRewardInstructions({
    fulfilmentKind: "CENTRAL_COUPON",
    code: "MCOM-CENTRAL",
    ...urls,
  });
  assert.match(instructions.body, /cannot be used on Mall products/i);
  assert.equal(instructions.note, "Not valid on MCOM Mall products.");
  assert.equal(instructions.links[0]?.url, "https://central.example/membership");
});

test("pending identity produces actionable guidance", () => {
  const instructions = buildRewardInstructions({
    fulfilmentKind: "MALL_GIFT_CARD",
    fulfilmentStatus: "PENDING_IDENTITY",
    ...urls,
  });
  assert.equal(instructions.headline, "Link your MCOM account");
  assert.equal(instructions.links.length, 0);
});

test("issuance fulfilment is read from the provider descriptor and metadata", () => {
  const issuance = {
    id: "iss-1",
    rewardId: "r-1",
    rewardTitle: "Reward",
    issuerClientId: "fundordonate",
    externalRef: "campaign-1",
    idempotencyKey: "fd:campaign-1:r-1:user-1",
    recipient: { resolved: true },
    code: "CODE",
    status: "ISSUED",
    rewardType: "gift card",
    value: 30,
    pointsAwarded: null,
    mallReference: null,
    quantity: 1,
    expiresAt: null,
    redeemedAt: null,
    revokedAt: null,
    metadata: {
      fulfilment: {
        provider: "MALL",
        kind: "MALL_GIFT_CARD",
        businessId: "biz-1",
        businessName: "Acme Ltd",
        scope: { mode: "ITEMS", productIds: ["prod-1"] },
      },
    },
    fulfilmentProvider: "MALL",
    fulfilmentKind: "MALL_GIFT_CARD",
    fulfilmentStatus: "DELIVERED",
    fulfilmentRef: "gc-1",
    fulfilmentCode: "CODE",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  } as McomRewardIssuance;

  const fulfilment = extractIssuanceFulfilment(issuance);
  assert.equal(fulfilment.fulfilmentProvider, "MALL");
  assert.equal(fulfilment.fulfilmentKind, "MALL_GIFT_CARD");
  assert.equal(fulfilment.businessId, "biz-1");
  assert.equal(fulfilment.businessName, "Acme Ltd");
  assert.deepEqual(fulfilment.scope, {
    mode: "ITEMS",
    productIds: ["prod-1"],
  });
});
