import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { subscriptionSchema } from "@/lib/validations";
import { parseBody, apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

const PLANS = { FREE: { monthly: 0, yearly: 0 }, PRO: { monthly: 15000, yearly: 144000 }, ELITE: { monthly: 45000, yearly: 432000 } };

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true, userId: true } });
    const sub = profile ? await db.subscription.findUnique({ where: { designerId: profile.id } }) : null;
    return apiSuccess({ plans: PLANS, current: sub });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireAuth();
    if (ae) return ae;
    const { data, error } = await parseBody(req, subscriptionSchema);
    if (error) return error;
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true, userId: true } });
    if (!profile) return apiError("Designer profile not found", 404);
    const price = data!.billingCycle === "MONTHLY" ? PLANS[data!.plan].monthly : PLANS[data!.plan].yearly;
    const end = new Date(); end.setMonth(end.getMonth() + (data!.billingCycle === "MONTHLY" ? 1 : 12));
    const sub = await db.subscription.upsert({ where: { designerId: profile.id }, create: { designerId: profile.id, plan: data!.plan, billingCycle: data!.billingCycle, price, currentPeriodEnd: end }, update: { plan: data!.plan, billingCycle: data!.billingCycle, price, currentPeriodEnd: end, isActive: true } });
    if (price > 0) await db.platformTransaction.create({ data: { type: "SUBSCRIPTION_PAYMENT", amount: price, referenceId: sub.id, description: `${data!.plan} — ${data!.billingCycle}` } });
    return apiSuccess(sub);
  });
}
