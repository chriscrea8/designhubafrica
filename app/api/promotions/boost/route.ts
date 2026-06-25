import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { initiatePromotion } from "@/lib/services/promotion-billing";

const BOOST_LIMIT = 20;

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const vendor = await db.vendorProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!vendor) return apiError("Vendor profile required", 403);
    const active = await db.promotedProduct.findMany({
      where: { vendorId: vendor.id, status: "ACTIVE", endDate: { gt: new Date() } },
      include: { product: { select: { name: true, images: true } }, promotionPlan: { select: { name: true, durationDays: true } } },
      orderBy: { endDate: "asc" },
    } as any);
    return apiSuccess(active);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const vendor = await db.vendorProfile.findUnique({ where: { userId: user!.id }, select: { id: true, userId: true } });
    if (!vendor) return apiError("Vendor profile required", 403);
    const vendorUser = await db.user.findUnique({ where: { id: vendor.userId }, select: { email: true } });

    const { productId, planId } = await req.json();
    if (!productId || !planId) return apiError("productId and planId required", 400);

    // Abuse check — max 20 active boosts
    const activeCount = await db.promotedProduct.count({ where: { vendorId: vendor.id, status: "ACTIVE", endDate: { gt: new Date() } } } as any);
    if (activeCount >= BOOST_LIMIT) return apiError(`Maximum ${BOOST_LIMIT} active boosts allowed`, 400);

    // Check product belongs to vendor
    const product = await db.product.findFirst({ where: { id: productId, vendorId: vendor.id } });
    if (!product) return apiError("Product not found", 404);

    const plan = await db.promotionPlan.findUnique({ where: { id: planId } } as any);
    if (!plan || plan.status !== "ACTIVE") return apiError("Promotion plan not available", 404);

    const { checkoutUrl, reference } = await initiatePromotion({
      vendorId:    vendor.id,
      vendorEmail: vendorUser?.email || "",
      type:        "BOOST",
      productId,
      amount:      plan.price,
      metadata:    { productId, planId, productName: product.name, planName: plan.name, durationDays: plan.durationDays },
    });

    return apiSuccess({ checkoutUrl, reference });
  });
}
