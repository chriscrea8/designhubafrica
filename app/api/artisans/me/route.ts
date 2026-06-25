import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.artisanProfile.findUnique({
      where: { userId: user!.id },
      include: { portfolio: true, verification: true },
    });
    if (!profile) return apiError("Artisan profile not found", 404);
    return apiSuccess(profile);
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const body = await req.json();
    const { bio, phone, serviceCategory, yearsExperience, workLocations, specialties, availabilityStatus } = body;

    const data: any = {};
    if (bio                !== undefined) data.bio                = bio;
    if (phone              !== undefined) data.phone              = phone;
    if (serviceCategory    !== undefined) data.serviceCategory    = serviceCategory;
    if (yearsExperience    !== undefined) data.yearsExperience    = parseInt(yearsExperience) || 0;
    if (workLocations      !== undefined) data.workLocations      = workLocations;
    if (specialties        !== undefined) data.specialties        = specialties;
    if (availabilityStatus !== undefined) data.availabilityStatus = availabilityStatus;

    const profile = await db.artisanProfile.upsert({
      where: { userId: user!.id },
      update: data,
      create: { userId: user!.id, serviceCategory: serviceCategory || "carpenter", ...data } as any,
    });
    return apiSuccess(profile);
  });
}
