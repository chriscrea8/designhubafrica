import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error } = await requireRole("ADMIN");
    if (error) return error;
    const { page, limit, skip } = getSearchParams(req);
    const status = new URL(req.url).searchParams.get("status") || "PENDING_REVIEW";
    const where: any = status !== "all" ? { moderationStatus: status } : {};
    const [products, total] = await Promise.all([
      db.product.findMany({ where, skip, take: limit, orderBy: { createdAt: "asc" }, include: { vendor: { include: { user: { select: { firstName: true, lastName: true, location: true } } } } } }),
      db.product.count({ where }),
    ]);
    return paginatedResponse(products, total, page, limit);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireRole("ADMIN");
    if (ae) return ae;
    const { productId, action, notes } = await req.json();
    const product = await db.product.update({ where: { id: productId }, data: { moderationStatus: action === "approve" ? "APPROVED" : "REJECTED", isApproved: action === "approve", moderatedBy: user!.id, moderatedAt: new Date(), moderationNote: notes } });
    return apiSuccess(product);
  });
}
