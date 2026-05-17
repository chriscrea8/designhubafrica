import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const product = await db.product.findUnique({
      where: { id: params.id },
      select: { category: true, tags: true, vendorId: true, price: true },
    });
    if (!product) return apiSuccess([]);

    // Find similar: same category, approved, not this product, within 2x price range
    const related = await db.product.findMany({
      where: {
        id: { not: params.id },
        isApproved: true,
        inStock: true,
        OR: [
          { category: product.category },
          { tags: { hasSome: product.tags } },
        ],
        price: {
          gte: Math.round(product.price * 0.4),
          lte: Math.round(product.price * 2.5),
        },
      },
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { storeName: true, storeImage: true } },
      },
    });

    return apiSuccess(related);
  });
}
