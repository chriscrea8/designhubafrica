import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const url = new URL(req.url);
    const designerId = url.searchParams.get("designerId");
    const { page, limit, skip } = getSearchParams(req);
    const where: any = {};
    if (designerId) where.designerId = designerId;
    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where, skip, take: limit, orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, firstName: true, lastName: true, image: true } },
        },
      }),
      db.review.count({ where }),
    ]);
    return paginatedResponse(reviews, total, page, limit);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireAuth();
    if (ae) return ae;
    if (user!.role !== "CLIENT") return apiError("Only clients can leave reviews", 403);

    const body = await req.json();
    const { designerId, projectId, rating, comment, qualityRating, communicationRating, timelinessRating, professionalismRating } = body;

    if (!designerId || !projectId) return apiError("designerId and projectId are required", 400);
    if (!rating || rating < 1 || rating > 5) return apiError("Rating must be between 1 and 5", 400);
    if (!comment || comment.trim().length < 10) return apiError("Please write a review (min 10 characters)", 400);

    // Guard 1: Project must exist and belong to this client
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { clientId: true, status: true, designerId: true },
    });
    if (!project) return apiError("Project not found", 404);
    if (project.clientId !== user!.id) return apiError("You can only review your own projects", 403);

    // Guard 2: Project must be COMPLETED
    if (project.status !== "COMPLETED") return apiError("You can only review completed projects", 400);

    // Guard 3: One review per project (no duplicates)
    const existing = await db.review.findFirst({
      where: { authorId: user!.id, projectId },
    });
    if (existing) return apiError("You have already reviewed this project", 400);

    // Guard 4: Designer must have worked on this project
    const designerProfile = await db.designerProfile.findUnique({
      where: { id: designerId },
      select: { id: true, userId: true },
    });
    if (!designerProfile) return apiError("Designer not found", 404);

    // Create review
    const review = await db.review.create({
      data: {
        authorId: user!.id,
        designerId,
        projectId,
        rating,
        comment: comment.trim(),
        qualityRating: qualityRating || rating,
        communicationRating: communicationRating || rating,
        timelinessRating: timelinessRating || rating,
        professionalismRating: professionalismRating || rating,
      },
      include: { author: { select: { firstName: true, lastName: true, image: true } } },
    });

    // Update designer's aggregate stats
    const allReviews = await db.review.findMany({
      where: { designerId },
      select: { rating: true },
    });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await db.designerProfile.update({
      where: { id: designerId },
      data: {
        avgRating: Math.round(avg * 10) / 10,
        totalReviews: allReviews.length,
      },
    });

    // Notify designer
    await db.notification.create({
      data: {
        userId: designerProfile.userId,
        type: "new_review",
        title: "New Review Received",
        message: `A client left you a ${rating}-star review`,
        link: `/designer-dashboard`,
      },
    }).catch(() => {});

    return apiSuccess(review, 201);
  });
}
