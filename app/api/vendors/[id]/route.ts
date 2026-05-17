import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const vendor = await db.vendorProfile.findUnique({
      where: { id: params.id },
      select: {
        id: true, storeName: true, storeDescription: true, storeImage: true,
        category: true, approvalStatus: true,
        avgRating: true, totalReviews: true,
        _count: { select: { products: true } },
      },
    });
    if (!vendor) return apiError("Store not found", 404);
    return apiSuccess(vendor);
  });
}
