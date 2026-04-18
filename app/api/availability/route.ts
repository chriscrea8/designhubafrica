import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const url = new URL(req.url);
    const designerId = url.searchParams.get("designerId");
    if (!designerId) return apiError("designerId required", 400);
    const slots = await db.availabilitySlot.findMany({ where: { designerId, isActive: true }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] });
    return apiSuccess(slots);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!profile) return apiError("Designer profile not found", 404);
    const body = await req.json();
    // Upsert slots — replace all with new set
    await db.availabilitySlot.deleteMany({ where: { designerId: profile.id } });
    const slots = await db.availabilitySlot.createMany({ data: (body.slots || []).map((s: any) => ({ designerId: profile.id, dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime })) });
    return apiSuccess({ created: slots.count });
  });
}
