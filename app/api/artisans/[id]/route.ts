import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const a = await db.artisanProfile.findUnique({ where: { id: params.id }, include: {
      user: { select: { id: true, firstName: true, lastName: true, image: true, location: true, bio: true, isVerified: true } },
      reviews: { take: 10, orderBy: { createdAt: "desc" }, include: { author: { select: { firstName: true, lastName: true, image: true } } } },
      _count: { select: { reviews: true, contracts: true } },
    }});
    if (!a) return apiError("Not found", 404);
    return apiSuccess(a);
  });
}
