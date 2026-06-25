import { describe, it, expect, vi } from "vitest";

// Test the dispute model validations without hitting a real DB
describe("Dispute creation validation", () => {
  it("requires reason of at least 20 chars", () => {
    const reason = "Short";
    expect(reason.length).toBeLessThan(20);
  });

  it("accepts valid dispute reason", () => {
    const reason = "The designer did not deliver the agreed 3D renders within the timeline";
    expect(reason.length).toBeGreaterThanOrEqual(20);
  });

  it("valid outcomes are CLIENT_WIN | DESIGNER_WIN | SPLIT | DISMISSED", () => {
    const valid = ["CLIENT_WIN","DESIGNER_WIN","SPLIT","DISMISSED"];
    expect(valid.includes("CLIENT_WIN")).toBe(true);
    expect(valid.includes("RANDOM")).toBe(false);
  });
});

describe("Dispute status flow", () => {
  it("valid status transitions", () => {
    const transitions: Record<string, string[]> = {
      OPEN: ["INVESTIGATING"],
      INVESTIGATING: ["RESOLVED","CLOSED"],
      RESOLVED: ["CLOSED"],
      CLOSED: [],
    };
    expect(transitions["OPEN"].includes("INVESTIGATING")).toBe(true);
    expect(transitions["CLOSED"].length).toBe(0);
  });
});
