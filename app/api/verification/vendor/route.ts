import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.vendorProfile.findUnique({ where: { userId: user!.id }, include: { verification: true } });
    if (!profile) return apiError("Not found", 404);
    return apiSuccess(profile.verification);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.vendorProfile.findUnique({ where: { userId: user!.id } });
    if (!profile) return apiError("Not found", 404);
    const body = await req.json();
    const v = await db.vendorVerification.upsert({ where: { vendorId: profile.id }, create: { vendorId: profile.id, ...body, status: "PENDING" }, update: { ...body, status: "PENDING" } });
    return apiSuccess(v);
  });
}
