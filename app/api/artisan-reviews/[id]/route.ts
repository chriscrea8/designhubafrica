import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { artisanResponse } = await req.json();
    if (!artisanResponse) return apiError("Response required", 400);

    const review = await db.artisanReview.findUnique({ where: { id: params.id }, include: { artisan: { select: { userId:true } } } });
    if (!review) return apiError("Review not found", 404);
    if (review.artisan?.userId !== user!.id) return apiError("Not your review to respond to", 403);
    if (review.artisanResponse) return apiError("You have already responded to this review", 400);

    const updated = await db.artisanReview.update({ where: { id: params.id }, data: { artisanResponse, respondedAt: new Date() } });
    return apiSuccess(updated);
  });
}
