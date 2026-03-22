import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createReviewSchema } from "@/lib/validations";
import { parseBody, apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const url = new URL(req.url);
    const designerId = url.searchParams.get("designerId");
    const productId = url.searchParams.get("productId");
    const { page, limit, skip } = getSearchParams(req);
    const where: any = {};
    if (designerId) where.designerId = designerId;
    if (productId) where.productId = productId;
    const [reviews, total] = await Promise.all([
      db.review.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { author: { select: { id: true, firstName: true, lastName: true, image: true } } } }),
      db.review.count({ where }),
    ]);
    return paginatedResponse(reviews, total, page, limit);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireAuth();
    if (ae) return ae;
    const { data, error } = await parseBody(req, createReviewSchema);
    if (error) return error;
    const review = await db.review.create({ data: { authorId: user!.id, ...data! } });
    if (data!.designerId) {
      const reviews = await db.review.findMany({ where: { designerId: data!.designerId }, select: { rating: true } });
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      await db.designerProfile.update({ where: { id: data!.designerId }, data: { avgRating: Math.round(avg * 10) / 10, totalReviews: reviews.length } });
    }
    return apiSuccess(review, 201);
  });
}
