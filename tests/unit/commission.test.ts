import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateSplit, computeSplit } from "@/lib/payments";

// Mock DB for commission config
vi.mock("@/lib/db", () => ({
  db: { commissionConfig: { findFirst: vi.fn().mockResolvedValue(null) } },
}));

describe("calculateSplit (pure function)", () => {
  it("calculates 10% platform fee correctly", () => {
    const result = calculateSplit({ grossAmount: 100000, platformRate: 0.10 });
    expect(result.platformFee).toBe(10000);
    expect(result.netAmount).toBe(90000);
    expect(result.grossAmount).toBe(100000);
  });

  it("calculates 20% consultation fee correctly", () => {
    const result = calculateSplit({ grossAmount: 50000, platformRate: 0.20 });
    expect(result.platformFee).toBe(10000);
    expect(result.netAmount).toBe(40000);
  });

  it("rounds fractional kobo correctly", () => {
    const result = calculateSplit({ grossAmount: 33333, platformRate: 0.10 });
    expect(result.platformFee + result.netAmount).toBe(33333);
  });

  it("handles zero amount", () => {
    const result = calculateSplit({ grossAmount: 0, platformRate: 0.10 });
    expect(result.platformFee).toBe(0);
    expect(result.netAmount).toBe(0);
  });

  it("platformFee + netAmount always equals grossAmount", () => {
    for (const amount of [1000, 9999, 100000, 1234567]) {
      const result = calculateSplit({ grossAmount: amount, platformRate: 0.15 });
      expect(result.platformFee + result.netAmount).toBe(amount);
    }
  });
});

describe("computeSplit (with DB config)", () => {
  it("falls back to default rates when no DB config exists", async () => {
    const result = await computeSplit(100000, "project");
    expect(result.platformFee).toBe(10000); // default 10%
    expect(result.netAmount).toBe(90000);
    expect(result.rate).toBe(0.10);
  });

  it("uses consultation default rate of 20%", async () => {
    const result = await computeSplit(10000, "consultation");
    expect(result.platformFee).toBe(2000);
    expect(result.netAmount).toBe(8000);
  });
});
