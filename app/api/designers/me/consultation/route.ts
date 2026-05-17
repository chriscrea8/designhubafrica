import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { consultationPrice, meetingLink, consultationTypes } = await req.json();
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!profile) return apiError("Profile not found", 404);
    await db.$executeRaw`UPDATE "DesignerProfile" SET "consultationPrice" = ${consultationPrice || 15000}, "meetingLink" = ${meetingLink || ''}, "consultationTypes" = ${consultationTypes || '["VIDEO"]'} WHERE id = ${profile.id}`;
    return apiSuccess({ updated: true });
  });
}
