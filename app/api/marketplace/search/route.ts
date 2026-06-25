import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, withErrorHandling } from "@/lib/services/api-helpers";
import { saveRecentSearch } from "@/lib/services/marketplace-tracking";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const url = new URL(req.url);
    const q    = url.searchParams.get("q")    || "";
    const type = url.searchParams.get("type") || "all"; // all | suggestions | recent | trending
    const { error, user } = await requireAuth().catch(()=>({ error: null, user: null }));

    if (type === "suggestions" && q.length >= 2) {
      // Parallel search across products, categories, vendors
      const [products, vendors] = await Promise.all([
        db.product.findMany({
          where: { moderationStatus: "PUBLISHED", OR: [{ name: { contains: q, mode: "insensitive" } }, { brand: { contains: q, mode: "insensitive" } }] },
          select: { id: true, name: true, images: true, category: true, price: true },
          take: 5,
        }),
        db.vendorProfile.findMany({
          where: { approvalStatus: "APPROVED", storeName: { contains: q, mode: "insensitive" } },
          select: { id: true, storeName: true, storeImage: true },
          take: 3,
        }),
      ]);
      return apiSuccess({ products, vendors, query: q });
    }

    if (type === "recent" && user) {
      const recent = await db.recentSearch.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8 });
      return apiSuccess(recent.map((r: any) => r.query));
    }

    if (type === "trending") {
      // Get top searches from recent journey events
      const events = await db.buyerJourneyEvent.groupBy({
        by: ["entityId"],
        where: { eventType: "VIEWED_PRODUCT", createdAt: { gte: new Date(Date.now() - 7*86400000) } },
        _count: { entityId: true },
        orderBy: { _count: { entityId: "desc" } },
        take: 10,
      } as any);
      const productIds = events.map((e: any) => e.entityId);
      const products = await db.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, category: true, images: true } });
      return apiSuccess(products);
    }

    // Full search — save to recent
    if (q.length >= 2) {
      const where: any = {
        moderationStatus: "PUBLISHED",
        OR: [
          { name:        { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { brand:       { contains: q, mode: "insensitive" } },
          { category:    { contains: q, mode: "insensitive" } },
          { tags:        { has: q } },
        ],
      };
      const products = await db.product.findMany({ where, take: 24, orderBy: { moderationStatus: "asc" }, include: { vendor: { select: { id: true, storeName: true, approvalStatus: true } } } });
      if (user) saveRecentSearch(user.id, q);
      return apiSuccess({ products, total: products.length, query: q });
    }

    return apiSuccess({ products: [], total: 0, query: q });
  });
}
