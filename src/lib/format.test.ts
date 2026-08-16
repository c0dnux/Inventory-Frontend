import { describe, it, expect } from "vitest";
import {
  cn,
  formatCurrency,
  formatNumber,
  formatDate,
  formatDateTime,
  timeAgo,
  isOutgoingMovement,
} from "./format";

describe("format helpers", () => {
  it("cn merges and dedupes conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", undefined, false)).toBe("text-red-500");
  });

  it("formatCurrency uses the brand currency and locale", () => {
    expect(formatCurrency(12.5)).toBe("$12.50");
    expect(formatCurrency(null)).toBe("$0.00");
  });

  it("formatNumber formats plain numbers", () => {
    expect(formatNumber(1234)).toBe("1,234");
    expect(formatNumber(0)).toBe("0");
  });

  it("formatDate/formatDateTime handle empty input", () => {
    expect(formatDate(undefined)).toBe("—");
    expect(formatDateTime(null)).toBe("—");
    expect(formatDate("2026-08-15T10:30:00Z")).toBe("Aug 15, 2026");
  });

  it("timeAgo buckets relative to now", () => {
    expect(timeAgo(new Date().toISOString())).toBe("just now");
    const twoHours = Date.now() - 2 * 60 * 60 * 1000;
    expect(timeAgo(new Date(twoHours).toISOString())).toBe("2 hours ago");
    expect(timeAgo(null)).toBe("");
  });

  it("classifies incoming vs outgoing movements", () => {
    expect(isOutgoingMovement("stock_out")).toBe(true);
    expect(isOutgoingMovement("adjustment_out")).toBe(true);
    expect(isOutgoingMovement("purchase_in")).toBe(false);
    expect(isOutgoingMovement(undefined)).toBe(false);
  });
});
