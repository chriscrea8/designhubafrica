import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!profile) return apiError("Not found", 404);
    const pkg = await db.consultationPackage.findFirst({ where: { id: params.id, designerId: profile.id } });
    if (!pkg) return apiError("Package not found", 404);
    const body = await req.json();
    const updated = await db.consultationPackage.update({ where: { id: params.id }, data: body as any });
    return apiSuccess(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!profile) return apiError("Not found", 404);
    const pkg = await db.consultationPackage.findFirst({ where: { id: params.id, designerId: profile.id } });
    if (!pkg) return apiError("Not found", 404);
    await db.consultationPackage.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  });
}
