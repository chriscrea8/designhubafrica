import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { initiatePromotion } from "@/lib/services/promotion-billing";

const FEATURED_STORE_PRICES: Record<number, number> = { 7: 15000, 14: 25000, 30: 45000 };

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const vendor = await db.vendorProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!vendor) return apiError("Vendor profile required", 403);
    const active = await db.featuredStore.findFirst({ where: { vendorId: vendor.id, status: "ACTIVE", endDate: { gt: new Date() } }, orderBy: { endDate: "desc" } } as any);
    return apiSuccess(active);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const vendor = await db.vendorProfile.findUnique({ where: { userId: user!.id }, select: { id: true, userId: true } });
    const vendorUser = await db.user.findUnique({ where: { id: vendor!.userId }, select: { email: true } });
    if (!vendor) return apiError("Vendor profile required", 403);

    const { durationDays } = await req.json();
    const price = FEATURED_STORE_PRICES[durationDays];
    if (!price) return apiError("Invalid duration. Choose 7, 14, or 30 days", 400);

    const { checkoutUrl, reference } = await initiatePromotion({
      vendorId:    vendor.id,
      vendorEmail: vendorUser?.email || "",
      type:        "FEATURED_STORE",
      amount:      price,
      metadata:    { durationDays },
    });

    return apiSuccess({ checkoutUrl, reference, price });
  });
}
