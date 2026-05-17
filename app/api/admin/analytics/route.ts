import { NextRequest } from "next/server";
import { requireRole } from "@/lib/auth";
import { apiSuccess, withErrorHandling } from "@/lib/services/api-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error } = await requireRole("ADMIN");
    if (error) return error;
    const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
    const [users, designers, vendors, projects, orders, revenue] = await Promise.all([
      db.user.count(), db.designerProfile.count({ where: { approvalStatus: "APPROVED" } }), db.vendorProfile.count({ where: { approvalStatus: "APPROVED" } }),
      db.project.count(), db.order.count(),
      db.platformTransaction.aggregate({ where: { createdAt: { gte: thisMonth } }, _sum: { amount: true } }),
    ]);
    return apiSuccess({ users, designers, vendors, projects, orders, revenueThisMonth: revenue._sum.amount || 0 });
  });
}
