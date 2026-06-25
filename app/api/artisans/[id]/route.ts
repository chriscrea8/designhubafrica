import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const artisan = await db.artisanProfile.findUnique({
      where: { id: params.id },
      include: {
        user:         { select: { id:true, firstName:true, lastName:true, image:true, location:true } },
        portfolio:    { orderBy: { createdAt:"desc" } },
        verification: { select: { status:true } },
        artisanReviews: {
          orderBy: { createdAt:"desc" },
          include: { author: { select: { firstName:true, lastName:true, image:true } } },
        },
      },
    });
    if (!artisan) return apiError("Artisan not found", 404);
    return apiSuccess(artisan);
  });
}
