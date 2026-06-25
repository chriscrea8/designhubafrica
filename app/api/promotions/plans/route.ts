import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "BOOST";
    const plans = await db.promotionPlan.findMany({
      where: { status: "ACTIVE", type },
      orderBy: { sortOrder: "asc" },
    } as any);
    return apiSuccess(plans);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);
    const body = await req.json();
    const plan = await db.promotionPlan.create({ data: body as any });
    return apiSuccess(plan, 201);
  });
}
