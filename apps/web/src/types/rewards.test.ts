import { describe, expect, it } from "vitest";
import {
  issuedRewardDeliveryState,
  issuedRewardIsRedeemable,
} from "./rewards";

describe("issued reward delivery state", () => {
  it("treats a failed voucher as failed, even when status is ISSUED", () => {
    const reward = { status: "ISSUED", fulfilmentStatus: "FAILED" };
    expect(issuedRewardDeliveryState(reward)).toBe("failed");
    expect(issuedRewardIsRedeemable(reward)).toBe(false);
  });

  it("treats a delivered gift card as available", () => {
    const reward = { status: "ISSUED", fulfilmentStatus: "DELIVERED" };
    expect(issuedRewardDeliveryState(reward)).toBe("available");
    expect(issuedRewardIsRedeemable(reward)).toBe(true);
  });

  it("treats NOT_REQUIRED and legacy issues as available", () => {
    expect(
      issuedRewardDeliveryState({
        status: "ISSUED",
        fulfilmentStatus: "NOT_REQUIRED",
      }),
    ).toBe("available");
    expect(
      issuedRewardDeliveryState({ status: "ISSUED", fulfilmentStatus: null }),
    ).toBe("available");
  });

  it("treats a conflicting membership as processing", () => {
    const reward = {
      status: "ISSUED",
      fulfilmentStatus: "PENDING_CONFLICT",
    };
    expect(issuedRewardDeliveryState(reward)).toBe("processing");
    expect(issuedRewardIsRedeemable(reward)).toBe(false);
  });

  it("treats pending identity and PENDING issuances as processing", () => {
    expect(
      issuedRewardDeliveryState({
        status: "ISSUED",
        fulfilmentStatus: "PENDING_IDENTITY",
      }),
    ).toBe("processing");
    expect(
      issuedRewardDeliveryState({ status: "PENDING", fulfilmentStatus: null }),
    ).toBe("processing");
  });

  it("keeps terminal lifecycle states distinct", () => {
    expect(
      issuedRewardDeliveryState({ status: "REDEEMED", fulfilmentStatus: null }),
    ).toBe("redeemed");
    expect(
      issuedRewardDeliveryState({ status: "EXPIRED", fulfilmentStatus: null }),
    ).toBe("expired");
    expect(
      issuedRewardDeliveryState({ status: "REVOKED", fulfilmentStatus: null }),
    ).toBe("revoked");
  });
});
