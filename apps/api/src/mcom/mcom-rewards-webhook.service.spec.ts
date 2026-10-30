import assert from "node:assert/strict";
import { test } from "node:test";
import { McomRewardsWebhookService } from "./mcom-rewards-webhook.service";
import type { McomRewardIssuance } from "./rewards-client.service";

const config = {
  get<T = string>(key: string): T | undefined {
    const values: Record<string, string> = {
      nodeEnv: "development",
      "rewards.mallWebUrl": "http://localhost:3003",
      "rewards.centralWebUrl": "http://localhost:3000",
    };
    return values[key] as T | undefined;
  },
};

function issuance(overrides: Partial<McomRewardIssuance> = {}): McomRewardIssuance {
  return {
    id: "issuance-1",
    idempotencyKey: "fd:campaign-1:reward-1:user-1",
    rewardId: "reward-1",
    rewardTitle: "Access pass",
    status: "ISSUED",
    code: null,
    value: 0,
    quantity: 1,
    expiresAt: null,
    redeemedAt: null,
    revokedAt: null,
    metadata: {
      fulfilment: {
        provider: "CENTRAL",
        kind: "CENTRAL_ACCESS_PASS",
      },
    },
    fulfilmentProvider: "CENTRAL",
    fulfilmentKind: "CENTRAL_ACCESS_PASS",
    fulfilmentStatus: "FAILED",
    fulfilmentRef: null,
    fulfilmentCode: null,
    fulfilmentError: "CENTRAL_PROVIDER_ERROR: Access plan not found",
    centralReference: null,
    deepLink: null,
    fulfilledAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as McomRewardIssuance;
}

test("reconciliation clears stale fulfilment errors and refreshes delivery fields", async () => {
  const calls: any[] = [];
  const upsert = async (args: any) => {
    calls.push(args);
    return args;
  };
  const prisma = { rewardIssuance: { upsert } } as any;
  const service = new McomRewardsWebhookService(prisma, config as any);

  const failed = issuance();
  await service.upsertMirror(failed);
  assert.equal(
    calls[0].update.fulfilmentError,
    "CENTRAL_PROVIDER_ERROR: Access plan not found",
  );

  const delivered = issuance({
    fulfilmentStatus: "DELIVERED",
    fulfilmentCode: "MCOM-ACCESS-1",
    code: "MCOM-ACCESS-1",
    fulfilmentError: null,
    centralReference: "grant-1",
    deepLink: "http://localhost:3000/dashboard/access",
    fulfilledAt: "2026-01-02T00:00:00.000Z",
  });
  await service.upsertMirror(delivered);

  const update = calls.at(-1).update;
  assert.equal(update.fulfilmentError, null);
  assert.equal(update.fulfilmentCode, "MCOM-ACCESS-1");
  assert.equal(update.centralReference, "grant-1");
  assert.equal(update.deepLink, "http://localhost:3000/dashboard/access");
  assert.equal(
    update.fulfilledAt.toISOString(),
    "2026-01-02T00:00:00.000Z",
  );
  assert.equal(update.status, "ISSUED");
  assert.equal(update.instructions.code, "MCOM-ACCESS-1");
});
