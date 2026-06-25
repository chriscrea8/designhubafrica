import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const vendor = await db.vendorProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!vendor) return apiError("Vendor profile required", 403);

    const [activeBoosts, featuredStore, ads, txns] = await Promise.all([
      db.promotedProduct.findMany({ where: { vendorId: vendor.id, status: "ACTIVE", endDate: { gt: new Date() } }, include: { product: { select: { name: true, images: true } }, promotionPlan: { select: { name: true } } } } as any),
      db.featuredStore.findFirst({ where: { vendorId: vendor.id, status: "ACTIVE", endDate: { gt: new Date() } } } as any),
      db.advertisement.findMany({ where: { vendorId: vendor.id, status: { in: ["ACTIVE","PENDING"] } } } as any),
      db.promotionTransaction.findMany({ where: { vendorId: vendor.id }, orderBy: { createdAt: "desc" }, take: 10 } as any),
    ]);

    const totalSpend = txns.filter((t: any) => t.status === "successful").reduce((s: number, t: any) => s + t.amount, 0);
    const totalImpressions = activeBoosts.reduce((s: number, p: any) => s + (p.impressions || 0), 0);
    const totalClicks = activeBoosts.reduce((s: number, p: any) => s + (p.clicks || 0), 0);

    return apiSuccess({ activeBoosts, featuredStore, ads, txns, totalSpend, totalImpressions, totalClicks });
  });
}

export async function POST(req: NextRequest) {
  // Track impression/click
  return withErrorHandling(async () => {
    const { promotedProductId, featuredStoreId, advertisementId, eventType } = await req.json();
    const { user } = await requireAuth().catch(() => ({ user: null, error: null }));

    await db.promotionAnalytic.create({
      data: { promotedProductId: promotedProductId||null, featuredStoreId: featuredStoreId||null, advertisementId: advertisementId||null, eventType, userId: user?.id||null } as any,
    });

    // Increment counters
    if (promotedProductId && eventType === "IMPRESSION") {
      db.promotedProduct.update({ where: { id: promotedProductId }, data: { impressions: { increment: 1 } } }).catch(()=>{});
    }
    if (promotedProductId && eventType === "CLICK") {
      db.promotedProduct.update({ where: { id: promotedProductId }, data: { clicks: { increment: 1 } } }).catch(()=>{});
    }
    return apiSuccess({ tracked: true });
  });
}
