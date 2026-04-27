import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiSuccess, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error } = await requireRole("ADMIN");
    if (error) return error;
    const { page, limit, skip } = getSearchParams(req);
    const where: any = { severity: { not: "CLEAN" } };
    const sev = new URL(req.url).searchParams.get("severity");
    if (sev) where.severity = sev;
    const [items, total] = await Promise.all([
      db.messageModeration.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      db.messageModeration.count({ where }),
    ]);
    return paginatedResponse(items, total, page, limit);
  });
}
