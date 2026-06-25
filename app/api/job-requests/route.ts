import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { page, limit, skip } = getSearchParams(req);
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const mine     = url.searchParams.get("mine");
    const { error, user } = await requireAuth();
    if (error) return error;

    const where: any = {};
    if (category) where.artisanCategory = category;
    if (mine === "true") where.clientId = user!.id;
    else where.status = "OPEN";

    const [requests, total] = await Promise.all([
      db.jobRequest.findMany({
        where, skip, take: limit, orderBy: { createdAt:"desc" },
        include: {
          client: { select: { firstName:true, lastName:true, image:true, location:true } },
          _count: { select: { quotes:true } },
        },
      }),
      db.jobRequest.count({ where }),
    ]);
    return paginatedResponse(requests, total, page, limit);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { title, description, budget, location, artisanCategory, photos } = await req.json();
    if (!title || !description || !budget || !location || !artisanCategory) return apiError("All fields required", 400);

    const job = await db.jobRequest.create({
      data: { clientId: user!.id, title, description, budget: parseInt(budget), location, artisanCategory, photos: photos||[] },
    });

    // Notify matching artisans
    const artisans = await db.artisanProfile.findMany({
      where: { serviceCategory: artisanCategory, approvalStatus: "APPROVED", availabilityStatus: "AVAILABLE" },
      select: { userId:true }, take: 20,
    });
    for (const a of artisans) {
      await db.notification.create({ data: { userId: a.userId, type: "job_request", title: "New Job Request", message: `"${title}" in ${location} — ₦${parseInt(budget).toLocaleString()} budget`, link: `/job-requests/${job.id}` } }).catch(()=>{});
    }

    return apiSuccess(job, 201);
  });
}
