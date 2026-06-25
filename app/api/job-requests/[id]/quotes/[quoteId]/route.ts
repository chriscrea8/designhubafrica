import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function PATCH(req: NextRequest, { params }: { params: { id: string; quoteId: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const job = await db.jobRequest.findFirst({ where: { id: params.id, clientId: user!.id } });
    if (!job) return apiError("Not authorized", 403);
    const { action } = await req.json();
    if (action === "accept") {
      await db.jobQuote.update({ where: { id: params.quoteId }, data: { status: "ACCEPTED" } as any });
      await db.jobRequest.update({ where: { id: params.id }, data: { status: "IN_PROGRESS" } as any });
    }
    return apiSuccess({ updated: true });
  });
}
