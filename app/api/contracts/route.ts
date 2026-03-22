import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { page, limit, skip } = getSearchParams(req);
    const where = user!.role === "ADMIN" ? {} : { OR: [{ clientId: user!.id }, { professionalId: user!.id }] };
    const [contracts, total] = await Promise.all([
      db.contract.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { project: { select: { id: true, title: true } } } }),
      db.contract.count({ where }),
    ]);
    return paginatedResponse(contracts, total, page, limit);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const body = await req.json();
    const { projectId, professionalId, professionalType, totalAmount, artisanId } = body;
    if (!projectId || !professionalId || !professionalType || !totalAmount) return apiError("Missing required fields", 400);
    const contract = await db.contract.create({ data: { projectId, clientId: user!.id, professionalId, professionalType, artisanId, totalAmount, commissionRate: 0.10, status: "ACTIVE" } });
    return apiSuccess(contract, 201);
  });
}
