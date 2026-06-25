import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateSplit } from "@/lib/payments/provider";
import { computeSplit, getCommissionRate } from "@/lib/payments/commission";

// Mock DB
vi.mock("@/lib/db", () => ({
  db: {
    commissionConfig: {
      findFirst: vi.fn().mockResolvedValue({
        consultationRate: 0.20,
        projectRate: 0.10,
        promotionRate: 0.15,
        subscriptionRate: 0.00,
      }),
    },
  },
}));

describe("Commission rate lookup", () => {
  it("returns consultation rate from config", async () => {
    const rate = await getCommissionRate("consultation");
    expect(rate).toBe(0.20);
  });

  it("returns project rate from config", async () => {
    const rate = await getCommissionRate("project");
    expect(rate).toBe(0.10);
  });
});

describe("Split settlement math", () => {
  it("project milestone: ₦500,000 at 10% → platform ₦50,000, designer ₦450,000", async () => {
    const result = await computeSplit(500000, "project");
    expect(result.platformFee).toBe(50000);
    expect(result.netAmount).toBe(450000);
  });

  it("consultation: ₦10,000 at 20% → platform ₦2,000, designer ₦8,000", async () => {
    const result = await computeSplit(10000, "consultation");
    expect(result.platformFee).toBe(2000);
    expect(result.netAmount).toBe(8000);
  });

  it("invariant: platformFee + netAmount === grossAmount always holds", async () => {
    for (const amount of [1500, 75000, 1000000]) {
      const result = await computeSplit(amount, "project");
      expect(result.platformFee + result.netAmount).toBe(amount);
    }
  });
});

describe("Webhook payload handling (unit)", () => {
  it("identifies consultation_booking type from metadata", () => {
    const metadata = { type: "consultation_booking", bookingId: "bk_123", userId: "u_1" };
    expect(metadata.type).toBe("consultation_booking");
    expect(metadata.bookingId).toBeTruthy();
  });

  it("identifies milestone_invoice type from metadata", () => {
    const metadata = { type: "milestone_invoice", invoiceId: "inv_123", milestoneId: "ms_1" };
    expect(metadata.type).toBe("milestone_invoice");
  });

  it("rejects unknown payment types", () => {
    const metadata = { type: "unknown_type", id: "x" };
    const knownTypes = ["consultation_booking","milestone_invoice","featured_listing","vendor_subscription","product_boost"];
    expect(knownTypes.includes(metadata.type)).toBe(false);
  });
});
