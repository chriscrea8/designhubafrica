import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "DESIGNER" && user!.role !== "ADMIN") return apiError("Designer only", 403);

    const where = user!.role === "ADMIN" ? {} : { designerId: user!.id };
    const earnings = await db.earning.findMany({ where, orderBy: { createdAt: "desc" } });
    return apiSuccess(earnings);
  });
}
