import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { escrowDepositSchema } from "@/lib/validations";
import { parseBody, apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { createEscrowAccount, depositToEscrow } from "@/lib/services/escrow";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const projectId = new URL(req.url).searchParams.get("projectId");
    if (!projectId) return apiError("projectId required", 400);
    const escrow = await db.escrowAccount.findUnique({ where: { projectId }, include: { transactions: { orderBy: { createdAt: "desc" }, take: 20 } } });
    if (!escrow) return apiError("Not found", 404);
    return apiSuccess(escrow);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireAuth();
    if (ae) return ae;
    const { data, error } = await parseBody(req, escrowDepositSchema);
    if (error) return error;
    let escrow = await db.escrowAccount.findUnique({ where: { projectId: data!.projectId } });
    if (!escrow) escrow = await createEscrowAccount(data!.projectId, user!.id);
    await depositToEscrow({ projectId: data!.projectId, milestoneId: data!.milestoneId, amount: data!.amount, paymentRef: `escrow_${Date.now()}` });
    return apiSuccess({ deposited: data!.amount }, 201);
  });
}
