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
      select: {
        id: true, consultationPrice: true, consultationTypes: true,
        meetingLink: true, hourlyRate: true, yearsExperience: true,
        specialties: true, bio: true, isAvailable: true, responseTime: true,
      },
    });
    if (!profile) return apiError("Designer profile not found", 404);
    return apiSuccess(profile);
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const body = await req.json();
    const profile = await db.designerProfile.update({
      where: { userId: user!.id },
      data: {
        ...(body.consultationPrice !== undefined && { consultationPrice: body.consultationPrice }),
        ...(body.meetingLink !== undefined && { meetingLink: body.meetingLink }),
        ...(body.consultationTypes !== undefined && { consultationTypes: body.consultationTypes }),
        ...(body.hourlyRate !== undefined && { hourlyRate: body.hourlyRate }),
        ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
      },
      select: { id: true, consultationPrice: true, meetingLink: true, consultationTypes: true },
    });
    return apiSuccess(profile);
  });
}
