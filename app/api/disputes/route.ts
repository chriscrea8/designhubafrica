import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createDisputeSchema } from "@/lib/validations";
import { parseBody, apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";
import { lockEscrow } from "@/lib/services/escrow";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { page, limit, skip } = getSearchParams(req);
    const where = user!.role === "ADMIN" ? {} : { OR: [{ filerId: user!.id }, { targetId: user!.id }] };
    const [disputes, total] = await Promise.all([
      db.dispute.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" }, include: { project: { select: { id: true, title: true } }, filer: { select: { id: true, firstName: true, lastName: true } }, target: { select: { id: true, firstName: true, lastName: true } } } }),
      db.dispute.count({ where }),
    ]);
    return paginatedResponse(disputes, total, page, limit);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireAuth();
    if (ae) return ae;
    const { data, error } = await parseBody(req, createDisputeSchema);
    if (error) return error;
    const dispute = await db.dispute.create({ data: { projectId: data!.projectId, filerId: user!.id, targetId: data!.targetId, reason: data!.reason, evidence: data!.evidence || [] } });
    try { await lockEscrow(data!.projectId, true); } catch {}
    await db.project.update({ where: { id: data!.projectId }, data: { status: "DISPUTED" } });
    return apiSuccess(dispute, 201);
  });
}
