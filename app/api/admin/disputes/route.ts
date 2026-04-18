import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiSuccess, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error } = await requireRole("ADMIN");
    if (error) return error;
    const { page, limit, skip } = getSearchParams(req);
    const [disputes, total] = await Promise.all([
      db.dispute.findMany({ skip, take: limit, orderBy: { createdAt: "desc" }, include: { project: { select: { id: true, title: true }, include: { escrowAccount: { select: { balance: true } } } }, filer: { select: { id: true, firstName: true, lastName: true, role: true } }, target: { select: { id: true, firstName: true, lastName: true, role: true } } } }),
      db.dispute.count(),
    ]);
    return paginatedResponse(disputes, total, page, limit);
  });
}
