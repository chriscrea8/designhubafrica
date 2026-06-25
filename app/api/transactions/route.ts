import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { page, limit, skip } = getSearchParams(req);
    const url = new URL(req.url);
    const type   = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const all    = url.searchParams.get("all"); // admin only

    const where: any = {};
    if (all === "true" && user!.role === "ADMIN") {
      // Admin sees all
    } else {
      where.userId = user!.id;
    }
    if (type)   where.type   = type;
    if (status) where.status = status;

    const [txns, total] = await Promise.all([
      db.transaction.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" },
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      db.transaction.count({ where }),
    ]);
    return paginatedResponse(txns, total, page, limit);
  });
}
