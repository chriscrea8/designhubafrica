import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const d = await db.designerProfile.findUnique({ where: { id: params.id }, include: {
      user: { select: { id: true, firstName: true, lastName: true, image: true, location: true, bio: true, isVerified: true } },
      portfolio: { take: 20, orderBy: { createdAt: "desc" } },
      servicePackages: { where: { isActive: true } },
      reviews: { take: 10, orderBy: { createdAt: "desc" }, include: { author: { select: { firstName: true, lastName: true, image: true } } } },
      _count: { select: { reviews: true, designerProjects: true, portfolio: true } },
    }});
    if (!d) return apiError("Not found", 404);
    return apiSuccess(d);
  });
}
