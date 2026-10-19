import { describe, it, expect } from "vitest";
import {
  getOptionPrice,
  foundingOptionKey,
  getProgrammeWindow,
  FOUNDING_PRICES_PENCE,
} from "./foundingProgramme";

describe("foundingProgramme", () => {
  it("reads the price from a valid contribution config", () => {
    const config = JSON.stringify({ gold_pro: 12345 });
    expect(getOptionPrice(config, "gold", "pro")).toBe(12345);
  });

  it("supports underscore-suffixed config keys", () => {
    const config = JSON.stringify({ bronze_pro_plus: 9999 });
    expect(getOptionPrice(config, "bronze", "pro_plus")).toBe(9999);
  });

  it("falls back to the canonical price matrix when config is missing", () => {
    expect(getOptionPrice(null, "bronze", "standard")).toBe(FOUNDING_PRICES_PENCE.bronze.standard);
    expect(getOptionPrice("not-json", "platinum", "pro")).toBe(FOUNDING_PRICES_PENCE.platinum.pro);
  });

  it("builds canonical option keys", () => {
    expect(foundingOptionKey("silver", "pro_plus")).toBe("silver_pro_plus");
    expect(foundingOptionKey("gold", "standard")).toBe("gold_standard");
  });

  it("reports an open programme window", () => {
    const future = new Date(Date.now() + 30 * 86_400_000).toISOString();
    const window = getProgrammeWindow({ opensAt: new Date().toISOString(), closesAt: future, status: "OPEN" });
    expect(window.state).toBe("open");
    expect(window.daysLeft).toBeGreaterThan(0);
  });

  it("reports a closed programme window", () => {
    const past = new Date(Date.now() - 5 * 86_400_000).toISOString();
    const window = getProgrammeWindow({ opensAt: null, closesAt: past, status: "CLOSED" });
    expect(window.state).toBe("closed");
  });
});
