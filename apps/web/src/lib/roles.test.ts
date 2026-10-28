import { describe, it, expect } from "vitest";
import {
  getCentralWalletPath,
  getDashboardRoute,
  isBusinessDashboardUser,
} from "./roles";

describe("central hub wallet routing", () => {
  it("sends consumers to the customer wallet", () => {
    expect(getCentralWalletPath({ userType: "consumer", role: "donor" })).toBe(
      "/customer/wallet",
    );
    expect(getCentralWalletPath({ userType: "consumer", role: "backer" })).toBe(
      "/customer/wallet",
    );
  });

  it("sends business users to the business dashboard wallet", () => {
    expect(getCentralWalletPath({ userType: "business", role: "fundraiser" })).toBe(
      "/dashboard/wallet",
    );
    expect(getCentralWalletPath({ userType: "consumer", role: "business" })).toBe(
      "/dashboard/wallet",
    );
  });

  it("sends admins to the business dashboard wallet", () => {
    expect(getCentralWalletPath({ userType: "admin", role: "admin" })).toBe(
      "/dashboard/wallet",
    );
  });

  it("defaults to the customer wallet when no user is resolved", () => {
    expect(getCentralWalletPath(null)).toBe("/customer/wallet");
    expect(getCentralWalletPath(undefined)).toBe("/customer/wallet");
  });
});

describe("dashboard routing", () => {
  it("keeps existing role behaviour", () => {
    expect(getDashboardRoute({ userType: "admin", role: "admin" })).toBe("/admin");
    expect(getDashboardRoute({ userType: "business", role: "fundraiser" })).toBe(
      "/dashboard",
    );
    expect(getDashboardRoute({ userType: "consumer", role: "donor" })).toBe(
      "/consumer",
    );
    expect(isBusinessDashboardUser({ userType: "consumer", role: "donor" })).toBe(
      false,
    );
  });
});
