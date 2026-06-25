import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { artisanId, jobRequestId, rating, comment, qualityRating, professionalismRating, timelinessRating } = await req.json();
    if (!artisanId || !rating || !comment) return apiError("artisanId, rating, comment required", 400);
    if (rating < 1 || rating > 5) return apiError("Rating must be 1-5", 400);
    if (comment.length < 10) return apiError("Review too short (min 10 chars)", 400);

    // Guard: must have had a completed interaction (accepted quote)
    if (jobRequestId) {
      const job = await db.jobRequest.findUnique({ where: { id: jobRequestId }, select: { clientId:true, status:true } });
      if (!job) return apiError("Job request not found", 404);
      if (job.clientId !== user!.id) return apiError("You can only review jobs you posted", 403);
    }

    // Guard: no duplicate
    const existing = await db.artisanReview.findFirst({ where: { authorId: user!.id, artisanId, jobRequestId: jobRequestId||null } });
    if (existing) return apiError("You have already reviewed this artisan for this job", 400);

    const review = await db.artisanReview.create({
      data: { authorId: user!.id, artisanId, jobRequestId: jobRequestId||null, rating, comment, qualityRating: qualityRating||rating, professionalismRating: professionalismRating||rating, timelinessRating: timelinessRating||rating },
    });

    // Update artisan aggregate rating
    const all = await db.artisanReview.findMany({ where: { artisanId }, select: { rating:true } });
    const avg = all.reduce((s: number, r: any)=>s+r.rating,0)/all.length;
    await db.artisanProfile.update({ where: { id: artisanId }, data: { avgRating: Math.round(avg*10)/10, totalReviews: all.length } as any });

    // Notify artisan
    const artisan = await db.artisanProfile.findUnique({ where: { id: artisanId }, select: { userId:true } });
    if (artisan) await db.notification.create({ data: { userId: artisan.userId, type: "new_review", title: "New Review", message: `You received a ${rating}-star review`, link: "/artisan-dashboard" } }).catch(()=>{});

    return apiSuccess(review, 201);
  });
}
