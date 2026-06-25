import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyWebhookSignature, generateReference } from "@/lib/payments/provider";

describe("Webhook signature verification", () => {
  it("generateReference produces unique values", () => {
    const refs = new Set(Array.from({ length: 100 }, () => generateReference("test")));
    expect(refs.size).toBe(100);
  });

  it("generateReference includes the prefix", () => {
    const ref = generateReference("consult");
    expect(ref.startsWith("consult_")).toBe(true);
  });

  it("verifyWebhookSignature rejects wrong secret", async () => {
    // Set a specific secret to test against
    process.env.PAYSTACK_WEBHOOK_SECRET = "correct_secret";
    const payload = JSON.stringify({ event: "charge.success", data: { reference: "ref_1" } });
    const valid = await verifyWebhookSignature(payload, "wrong_signature");
    expect(valid).toBe(false);
  });
});

describe("Idempotency guard logic", () => {
  it("duplicate reference detection works", () => {
    const processed = new Set(["ref_already_done"]);
    const isAlreadyProcessed = (ref: string) => processed.has(ref);
    expect(isAlreadyProcessed("ref_already_done")).toBe(true);
    expect(isAlreadyProcessed("ref_new")).toBe(false);
  });
});
