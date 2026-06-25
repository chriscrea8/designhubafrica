import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);

    const thisMonth = new Date();
    thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);

    const [revenue, disputes, recentTxns] = await Promise.all([
      db.transaction.aggregate({ where: { status: "successful" }, _sum: { grossAmount: true, platformFee: true } }),
      db.dispute.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
      db.transaction.findMany({ take: 20, orderBy: { createdAt: "desc" }, include: { user: { select: { firstName: true, lastName: true, email: true } } } }),
    ]);

    const monthRevenue = await db.transaction.aggregate({
      where: { status: "successful", createdAt: { gte: thisMonth } },
      _sum: { grossAmount: true, platformFee: true },
    });

    return apiSuccess({
      totalRevenue:     revenue._sum.grossAmount || 0,
      totalCommission:  revenue._sum.platformFee  || 0,
      monthRevenue:     monthRevenue._sum.grossAmount || 0,
      monthCommission:  monthRevenue._sum.platformFee  || 0,
      activeDisputes:   disputes,
      recentTransactions: recentTxns,
    });
  });
}
