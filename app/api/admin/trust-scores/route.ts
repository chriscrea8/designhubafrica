import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiSuccess, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error } = await requireRole("ADMIN");
    if (error) return error;
    const { page, limit, skip } = getSearchParams(req);
    const [scores, total] = await Promise.all([
      db.trustScore.findMany({ skip, take: limit, orderBy: { overallScore: "desc" } }),
      db.trustScore.count(),
    ]);
    return paginatedResponse(scores, total, page, limit);
  });
}
