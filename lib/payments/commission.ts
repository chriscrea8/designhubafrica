import { db } from "@/lib/db";

// Default rates — overridden by DB config if present
const DEFAULTS = {
  consultationRate: 0.20,
  projectRate:      0.10,
  promotionRate:    0.15,
  subscriptionRate: 0.00,
};

export type CommissionType = "consultation" | "project" | "promotion" | "subscription";

export async function getCommissionRate(type: CommissionType): Promise<number> {
  try {
    const config = await db.commissionConfig.findFirst({ orderBy: { updatedAt: "desc" } });
    if (!config) return DEFAULTS[`${type}Rate` as keyof typeof DEFAULTS] ?? 0.10;
    const key = `${type}Rate` as keyof typeof config;
    return typeof config[key] === "number" ? (config[key] as number) : DEFAULTS[`${type}Rate` as keyof typeof DEFAULTS];
  } catch {
    return DEFAULTS[`${type}Rate` as keyof typeof DEFAULTS] ?? 0.10;
  }
}

export async function computeSplit(grossAmount: number, type: CommissionType) {
  const rate = await getCommissionRate(type);
  const platformFee = Math.round(grossAmount * rate);
  const netAmount   = grossAmount - platformFee;
  return { grossAmount, platformFee, netAmount, rate };
}
