import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiSuccess, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error } = await requireRole("ADMIN");
    if (error) return error;
    const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
    const [revenue, escrowHeld, disputes, subs, recent] = await Promise.all([
      db.platformTransaction.aggregate({ where: { createdAt: { gte: thisMonth } }, _sum: { amount: true } }),
      db.escrowAccount.aggregate({ _sum: { balance: true } }),
      db.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      db.subscription.groupBy({ by: ["plan"], where: { isActive: true }, _count: true }),
      db.platformTransaction.findMany({ take: 20, orderBy: { createdAt: "desc" } }),
    ]);
    return apiSuccess({ revenueThisMonth: revenue._sum.amount || 0, escrowHeld: escrowHeld._sum.balance || 0, openDisputes: disputes, subscriptions: subs, recentTransactions: recent });
  });
}
