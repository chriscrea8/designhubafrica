import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, include: { verification: true, _count: { select: { portfolio: true } } } });
    if (!profile) return apiError("Not found", 404);
    // Return verification data PLUS actual portfolio count from DB
    return apiSuccess({ ...profile.verification, portfolioCount: profile._count?.portfolio || 0 });
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true, userId: true } });
    if (!profile) return apiError("Not found", 404);
    const body = await req.json();
    const v = await db.designerVerification.upsert({ where: { designerId: profile.id }, create: { designerId: profile.id, ...body, step: body.step || "IDENTITY_SUBMITTED" }, update: { ...body } });
    // Return with portfolio count
    const count = await db.portfolioItem.count({ where: { designerId: profile.id } });
    return apiSuccess({ ...v, portfolioCount: count });
  });
}
