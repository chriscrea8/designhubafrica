import { db } from "@/lib/db";

// Hybrid ranking: Promotion(40%) + Relevance(25%) + Trust(15%) + Engagement(10%) + Freshness(10%)
export async function computeProductScore(productId: string): Promise<number> {
  try {
    const [product, boost, vendor] = await Promise.all([
      db.product.findUnique({ where: { id: productId }, select: { createdAt: true, viewCount: true, favouritesCount: true, category: true, vendorId: true } }),
      db.promotedProduct.findFirst({ where: { productId, status: "ACTIVE", endDate: { gt: new Date() } }, select: { boostScore: true } }),
      db.promotedProduct.findFirst({ where: { productId, status: "ACTIVE" } }).then(() => null), // placeholder
    ]);

    if (!product) return 0;

    // Promotion score (40%)
    const promotionScore = boost ? (boost.boostScore / 100) * 40 : 0;

    // Engagement score (10%) — views + saves capped at 10
    const engagementScore = Math.min(10, ((product.viewCount || 0) * 0.1) + ((product.favouritesCount || 0) * 0.3));

    // Freshness score (10%) — newer = higher
    const ageHours = (Date.now() - new Date(product.createdAt).getTime()) / 3600000;
    const freshScore = Math.max(0, 10 - (ageHours / 24) * 0.1);

    // Trust and relevance are factored server-side at query time via sorts
    return parseFloat((promotionScore + engagementScore + freshScore).toFixed(2));
  } catch { return 0; }
}

export async function getActiveBoostScore(productId: string): Promise<number> {
  const boost = await db.promotedProduct.findFirst({
    where: { productId, status: "ACTIVE", endDate: { gt: new Date() } },
    select: { boostScore: true },
    orderBy: { boostScore: "desc" },
  });
  return boost?.boostScore || 0;
}

export async function expirePromotions() {
  const now = new Date();
  const [products, stores, ads] = await Promise.all([
    db.promotedProduct.updateMany({ where: { endDate: { lt: now }, status: "ACTIVE" }, data: { status: "EXPIRED" } }),
    db.featuredStore.updateMany({ where: { endDate: { lt: now }, status: "ACTIVE" }, data: { status: "EXPIRED" } }),
    db.advertisement.updateMany({ where: { endDate: { lt: now }, status: "ACTIVE" }, data: { status: "EXPIRED" } }),
  ]);
  return { products: products.count, stores: stores.count, ads: ads.count };
}
