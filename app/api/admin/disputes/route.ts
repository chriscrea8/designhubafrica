import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const where: any = status && status !== "ALL" ? { status } : {};

    const disputes = await db.dispute.findMany({
      where, orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, title: true } },
        filer: { select: { id: true, firstName: true, lastName: true, email: true } },
        target: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    return apiSuccess(disputes);
  });
}
