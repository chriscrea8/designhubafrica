import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);
    const config = await db.commissionConfig.findFirst({ orderBy: { updatedAt: "desc" } });
    return apiSuccess(config || { consultationRate: 0.20, projectRate: 0.10, promotionRate: 0.15, subscriptionRate: 0.00 });
  });
}

export async function PATCH(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);
    const body = await req.json();
    const existing = await db.commissionConfig.findFirst();
    const config = existing
      ? await db.commissionConfig.update({ where: { id: existing.id }, data: { ...body, updatedBy: user!.id } as any })
      : await db.commissionConfig.create({ data: { ...body, updatedBy: user!.id } as any });
    return apiSuccess(config);
  });
}
