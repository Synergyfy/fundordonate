import assert from "node:assert/strict";
import { test } from "node:test";
import { normaliseCampaignWizardSettings } from "./campaign-wizard-settings";

function settingsWithReward(reward: Record<string, unknown>) {
  return {
    objective: "Test campaign",
    participation: {
      backCampaign: true,
      donateContribute: true,
    },
    contributionRules: {
      minContribution: "1",
      contributionTypes: ["money"],
    },
    hasRewards: true,
    rewards: [reward],
  };
}

const baseReward = {
  id: "reward-1",
  title: "£30 Mall Gift Card",
  source: "mcom",
  mcomRewardId: "mcom-reward-1",
  mcomSource: "mcom vault",
  fulfilmentProvider: "MALL",
  fulfilmentKind: "MALL_GIFT_CARD",
  consumerEligible: true,
  businessEligible: true,
  triggerConfig: { mode: "min", min: 10 },
  quantityType: "limited",
  quantityLimit: 50,
  items: [],
};

test("platform campaign normalisation preserves MCOM fulfilment fields", () => {
  const result = normaliseCampaignWizardSettings(
    settingsWithReward(baseReward),
    100_000,
    { strict: true },
  );
  const reward = result.rewardConfigs?.[0];
  assert.ok(reward);
  assert.equal(reward.source, "mcom");
  assert.equal(reward.mcomRewardId, "mcom-reward-1");
  assert.equal(reward.mcomSource, "mcom vault");
  assert.equal(reward.fulfilmentProvider, "MALL");
  assert.equal(reward.fulfilmentKind, "MALL_GIFT_CARD");
  assert.equal(reward.consumerEligible, true);
  assert.equal(reward.businessEligible, true);
  assert.equal(reward.quantityType, "limited");
  assert.equal(reward.quantityLimit, 50);
  assert.deepEqual(reward.conditions, [{ mode: "min", minPence: 1000 }]);
});

test("strict platform campaigns reject local reward creation", () => {
  assert.throws(
    () =>
      normaliseCampaignWizardSettings(
        settingsWithReward({
          id: "local-1",
          title: "Local reward",
          source: "fundordonate",
          triggerConfig: { mode: "min", min: 10 },
          quantityType: "unlimited",
          items: [],
        }),
        100_000,
        { strict: true },
      ),
    /must come from MCOM Rewards/,
  );
});

test("strict platform campaigns require a positive limited quantity", () => {
  assert.throws(
    () =>
      normaliseCampaignWizardSettings(
        settingsWithReward({
          ...baseReward,
          quantityLimit: 0,
        }),
        100_000,
        { strict: true },
      ),
    /quantityLimit must be at least 1/,
  );
});

test("non-vault admin sources are rejected for platform campaigns", () => {
  assert.throws(
    () =>
      normaliseCampaignWizardSettings(
        settingsWithReward({
          ...baseReward,
          mcomSource: "partner",
        }),
        100_000,
        { strict: true },
      ),
    /must use the "mcom vault" source/,
  );
});
