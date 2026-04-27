import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "ADMIN") return apiError("Admin only", 403);
    const { status, adminNotes, priority } = await req.json();
    const ticket = await db.supportTicket.update({ where: { id: params.id }, data: { status, adminNotes, priority, resolvedAt: status === "resolved" ? new Date() : undefined } });
    return apiSuccess(ticket);
  });
}
