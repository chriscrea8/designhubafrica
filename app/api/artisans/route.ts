import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { page, limit, skip, search } = getSearchParams(req);
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const where: any = { approvalStatus: "APPROVED", user: { status: "ACTIVE" } };
    if (category) where.serviceCategory = category;
    if (search) where.user = { ...where.user, OR: [{ firstName: { contains: search, mode: "insensitive" } }, { lastName: { contains: search, mode: "insensitive" } }] };
    const [artisans, total] = await Promise.all([
      db.artisanProfile.findMany({ where, skip, take: limit, orderBy: { avgRating: "desc" },
        include: { user: { select: { id: true, firstName: true, lastName: true, image: true, location: true, isVerified: true } }, _count: { select: { reviews: true } } } }),
      db.artisanProfile.count({ where }),
    ]);
    return paginatedResponse(artisans, total, page, limit);
  });
}
