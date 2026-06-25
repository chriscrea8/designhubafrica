import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const saved = await db.savedQuote.findMany({
      where: { userId: user!.id },
      include: { quote: { include: { vendor: { include: { user: { select: { firstName: true, lastName: true } } } }, rfq: { select: { title: true, rfqNumber: true } } } } },
      orderBy: { createdAt: "desc" },
    } as any);
    return apiSuccess(saved);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { quoteId } = await req.json();
    if (!quoteId) return apiError("quoteId required", 400);
    await db.savedQuote.upsert({
      where: { userId_quoteId: { userId: user!.id, quoteId } },
      create: { userId: user!.id, quoteId },
      update: {},
    } as any);
    return apiSuccess({ saved: true });
  });
}

export async function DELETE(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { quoteId } = await req.json();
    await db.savedQuote.deleteMany({ where: { userId: user!.id, quoteId } } as any);
    return apiSuccess({ removed: true });
  });
}
