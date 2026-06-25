import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { caption, description } = await req.json();
    const profile = await db.artisanProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!profile) return apiError("Not found", 404);
    const item = await db.artisanPortfolio.findFirst({ where: { id: params.id, artisanId: profile.id } });
    if (!item) return apiError("Not found or not yours", 404);
    const updated = await db.artisanPortfolio.update({ where: { id: params.id }, data: { caption, description } });
    return apiSuccess(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.artisanProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!profile) return apiError("Not found", 404);
    const item = await db.artisanPortfolio.findFirst({ where: { id: params.id, artisanId: profile.id } });
    if (!item) return apiError("Not found or not yours", 404);
    await db.artisanPortfolio.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  });
}
