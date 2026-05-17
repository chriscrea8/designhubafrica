import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { projectId: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;

    const escrow = await db.escrowAccount.findUnique({
      where: { projectId: params.projectId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!escrow) return apiSuccess({ balance: 0, isLocked: false, transactions: [] });

    // Calculate totals
    const deposited = escrow.transactions.filter(t => t.type === "DEPOSIT").reduce((s, t) => s + t.amount, 0);
    const released  = escrow.transactions.filter(t => t.type === "MILESTONE_RELEASE").reduce((s, t) => s + t.amount, 0);
    const commission = escrow.transactions.filter(t => t.type === "COMMISSION").reduce((s, t) => s + t.amount, 0);
    const refunded  = escrow.transactions.filter(t => t.type === "REFUND").reduce((s, t) => s + t.amount, 0);

    return apiSuccess({
      id: escrow.id,
      balance: escrow.balance,
      isLocked: escrow.isLocked,
      deposited,
      released,
      commission,
      refunded,
      transactions: escrow.transactions,
    });
  });
}
