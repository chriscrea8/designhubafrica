import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formats NGN amounts correctly", () => {
    expect(formatCurrency(1000)).toContain("1,000");
    expect(formatCurrency(1000000)).toContain("1,000,000");
  });
  it("handles zero", () => {
    expect(formatCurrency(0)).toContain("0");
  });
  it("handles large amounts", () => {
    expect(formatCurrency(50000000)).toContain("50,000,000");
  });
});

describe("cn (className utility)", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });
  it("deduplicates tailwind classes", () => {
    const result = cn("p-4", "p-2");
    expect(result).toBe("p-2"); // tailwind-merge keeps last
  });
});

describe("formatDate", () => {
  it("formats a date string", () => {
    const result = formatDate("2024-01-15T00:00:00Z");
    expect(result).toMatch(/jan/i);
    expect(result).toContain("2024");
  });
  it("handles Date objects", () => {
    const result = formatDate(new Date("2024-06-01T00:00:00Z").toISOString());
    expect(result).toMatch(/jun/i);
  });
});
