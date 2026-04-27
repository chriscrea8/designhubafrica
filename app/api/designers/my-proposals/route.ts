import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;

    const profile = await db.designerProfile.findUnique({
      where: { userId: user!.id },
      select: { id: true },
    });

    if (!profile) return apiSuccess([]);

    const proposals = await db.proposal.findMany({
      where: { designerId: profile.id },
      select: { id: true, projectId: true, status: true, proposedRate: true, deliveryDays: true, createdAt: true },
    });

    return apiSuccess(proposals);
  });
}
