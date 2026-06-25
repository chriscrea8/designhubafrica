import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);

    const [activeBoosts, featuredStores, ads, revenue, pendingAds] = await Promise.all([
      db.promotedProduct.count({ where: { status: "ACTIVE" } } as any),
      db.featuredStore.count({ where: { status: "ACTIVE" } } as any),
      db.advertisement.count({ where: { status: "ACTIVE" } } as any),
      db.promotionTransaction.aggregate({ where: { status: "successful" }, _sum: { amount: true } } as any),
      db.advertisement.findMany({ where: { status: "PENDING" }, include: { vendor: { include: { user: { select: { firstName: true, lastName: true } } } }, slot: true } } as any),
    ]);

    const monthlyRevenue = await db.promotionTransaction.aggregate({
      where: { status: "successful", createdAt: { gte: new Date(new Date().setDate(1)) } },
      _sum: { amount: true },
    } as any);

    return apiSuccess({ activeBoosts, featuredStores, ads, totalRevenue: revenue._sum?.amount || 0, monthlyRevenue: monthlyRevenue._sum?.amount || 0, pendingAds });
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);
    const { adId, action, reason } = await req.json();
    if (!adId || !action) return apiError("adId and action required", 400);
    const newStatus = action === "approve" ? "ACTIVE" : "REJECTED";
    const ad = await db.advertisement.update({
      where: { id: adId },
      data: { status: newStatus, approvedBy: user!.id, rejectionReason: reason||null, ...(action === "approve" ? { startDate: new Date() } : {}) } as any,
    });
    // Notify vendor
    const vendor = await db.vendorProfile.findUnique({ where: { id: ad.vendorId }, select: { userId: true } });
    if (vendor) {
      await db.notification.create({ data: { userId: vendor.userId, type: "ad_update", title: action === "approve" ? "Ad Approved! 🎉" : "Ad Rejected", message: action === "approve" ? "Your advertisement is now live" : `Reason: ${reason}`, link: "/vendor-growth" } }).catch(()=>{});
    }
    return apiSuccess(ad);
  });
}
