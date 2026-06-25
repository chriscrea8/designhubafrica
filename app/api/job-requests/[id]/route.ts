import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error } = await requireAuth();
    if (error) return error;
    const job = await db.jobRequest.findUnique({
      where: { id: params.id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, image: true } },
        quotes: { include: { artisan: { include: { user: { select: { id: true, firstName: true, lastName: true, image: true } } } } }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!job) return apiError("Not found", 404);
    return apiSuccess(job);
  });
}
