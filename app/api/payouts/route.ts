import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { initiatePayout } from "@/lib/services/escrow";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;

    const where = user!.role === "ADMIN" ? {} : { userId: user!.id };
    const payouts = await db.payout.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 });
    return apiSuccess(payouts);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "DESIGNER") return apiError("Only designers can request payouts", 403);

    const { amount } = await req.json();
    if (!amount || amount < 1000) return apiError("Minimum payout is ₦1,000", 400);

    // Check available earnings
    const earnings = await db.earning.aggregate({
      where: { designerId: user!.id, status: "available" },
      _sum: { amount: true },
    });
    const available = earnings._sum.amount || 0;
    if (amount > available) return apiError(`Insufficient earnings. Available: ₦${available.toLocaleString()}`, 400);

    // Initiate payout
    const result = await initiatePayout(user!.id, amount, "Manual payout request");
    if (!result) return apiError("Payout failed — please ensure bank details are saved", 400);

    // Mark earnings as withdrawn
    await db.earning.updateMany({
      where: { designerId: user!.id, status: "available" },
      data: { status: "withdrawn" },
    });

    return apiSuccess({ reference: result.reference, status: result.status, amount });
  });
}
