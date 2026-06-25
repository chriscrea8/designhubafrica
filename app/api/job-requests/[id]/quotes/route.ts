import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const artisan = await db.artisanProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!artisan) return apiError("Artisan profile required", 403);
    const { amount, timeline, notes } = await req.json();
    if (!amount || !timeline) return apiError("amount and timeline required", 400);
    const quote = await db.jobQuote.create({
      data: { jobRequestId: params.id, artisanId: artisan.id, amount, timeline, notes: notes||null } as any,
    });
    return apiSuccess(quote, 201);
  });
}
