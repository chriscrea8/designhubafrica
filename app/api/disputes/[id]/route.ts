import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { resolveDisputeSchema } from "@/lib/validations";
import { parseBody, apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { releaseMilestonePayment, refundEscrow, lockEscrow } from "@/lib/services/escrow";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireRole("ADMIN");
    if (ae) return ae;
    const { data, error } = await parseBody(req, resolveDisputeSchema);
    if (error) return error;
    const dispute = await db.dispute.findUnique({ where: { id: params.id }, include: { project: { include: { escrowAccount: true } } } });
    if (!dispute) return apiError("Not found", 404);
    if (data!.outcome === "REFUND_CLIENT" && dispute.project?.escrowAccount) await refundEscrow({ projectId: dispute.projectId, amount: dispute.project.escrowAccount.balance, reason: "Dispute refund" });
    if (data!.outcome === "PARTIAL_REFUND" && data!.refundAmount) await refundEscrow({ projectId: dispute.projectId, amount: data!.refundAmount, reason: "Partial dispute refund" });
    await lockEscrow(dispute.projectId, false);
    const resolved = await db.dispute.update({ where: { id: params.id }, data: { status: "RESOLVED", outcome: data!.outcome, refundAmount: data!.refundAmount, adminNotes: data!.adminNotes, resolvedBy: user!.id, resolvedAt: new Date() } });
    return apiSuccess(resolved);
  });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error } = await requireRole("ADMIN");
    if (error) return error;
    const dispute = await db.dispute.findUnique({ where: { id: params.id }, include: { project: { select: { id: true, title: true, budgetMax: true, currency: true } }, filer: { select: { id: true, firstName: true, lastName: true, email: true } }, target: { select: { id: true, firstName: true, lastName: true, email: true } } } });
    if (!dispute) return apiError("Not found", 404);
    return apiSuccess(dispute);
  });
}
