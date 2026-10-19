import { describe, it, expect } from "vitest";
import { formatCurrency, formatCurrencyDecimal, formatNumber, formatDate } from "./formatters";

describe("formatters", () => {
  it("formats pence as whole-pound GBP", () => {
    expect(formatCurrency(5000)).toBe("£50");
    expect(formatCurrency(0)).toBe("£0");
    expect(formatCurrency(undefined)).toBe("£0");
  });

  it("formats pence with two decimals", () => {
    expect(formatCurrencyDecimal(5050)).toBe("£50.50");
  });

  it("formats numbers with grouping", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
    expect(formatNumber(undefined)).toBe("0");
  });

  it("formats dates and handles invalid input", () => {
    expect(formatDate("2026-01-15")).toContain("2026");
    expect(formatDate(null)).toBe("");
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});
