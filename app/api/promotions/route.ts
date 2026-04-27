import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { page, limit, skip } = getSearchParams(req);
    const [promos, total] = await Promise.all([
      db.promotion.findMany({ where: { isActive: true, endsAt: { gte: new Date() } }, skip, take: limit, orderBy: { createdAt: "desc" } }),
      db.promotion.count({ where: { isActive: true } }),
    ]);
    return paginatedResponse(promos, total, page, limit);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const body = await req.json();
    const promo = await db.promotion.create({ data: { type: body.type, targetId: body.targetId, targetType: body.targetType, price: body.durationDays * 2000, durationDays: body.durationDays, currency: "NGN" } });
    return apiSuccess(promo, 201);
  });
}
