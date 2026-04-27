import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { page, limit, skip, search } = getSearchParams(req);
    const where: any = { approvalStatus: { in: ["APPROVED", "PENDING"] }, user: { status: "ACTIVE" } };
    if (search) {
      where.user = {
        ...where.user,
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { location: { contains: search, mode: "insensitive" } },
        ],
      };
    }
    const [designers, total] = await Promise.all([
      db.designerProfile.findMany({ where, skip, take: limit, orderBy: { avgRating: "desc" },
        include: { user: { select: { id: true, firstName: true, lastName: true, image: true, location: true, isVerified: true } }, _count: { select: { reviews: true, designerProjects: true, portfolio: true } } } }),
      db.designerProfile.count({ where }),
    ]);
    return paginatedResponse(designers, total, page, limit);
  });
}
