import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error } = await requireAuth();
    if (error) return error;
    const dispute = await db.dispute.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, title: true } },
        filer:  { select: { id: true, firstName: true, lastName: true, email: true } },
        target: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!dispute) return apiError("Not found", 404);
    return apiSuccess(dispute);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);
    const { outcome, status, adminNotes, refundAmount } = await req.json();
    const updated = await db.dispute.update({
      where: { id: params.id },
      data: { outcome, status, adminNotes, refundAmount, resolvedBy: user!.id, resolvedAt: new Date() },
    });
    return apiSuccess(updated);
  });
}
