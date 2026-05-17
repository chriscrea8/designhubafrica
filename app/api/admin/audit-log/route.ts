import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiSuccess, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error } = await requireRole("ADMIN");
    if (error) return error;
    const { page, limit, skip } = getSearchParams(req);
    const url = new URL(req.url);
    const where: any = {};
    const action = url.searchParams.get("action");
    const entityType = url.searchParams.get("entityType");
    if (action) where.action = { contains: action };
    if (entityType) where.entityType = entityType;
    const [logs, total] = await Promise.all([
      db.auditLog.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      db.auditLog.count({ where }),
    ]);
    return paginatedResponse(logs, total, page, limit);
  });
}
