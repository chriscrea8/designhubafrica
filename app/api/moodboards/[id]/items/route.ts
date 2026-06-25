import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

// Add inspiration to moodboard
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { inspirationId } = await req.json();
    if (!inspirationId) return apiError("inspirationId required", 400);
    const board = await db.moodboard.findFirst({ where: { id: params.id, clientId: user!.id } });
    if (!board) return apiError("Moodboard not found", 404);
    const item = await db.moodboardItem.upsert({
      where: { moodboardId_inspirationId: { moodboardId: params.id, inspirationId } },
      create: { moodboardId: params.id, inspirationId },
      update: {},
    });
    // Increment saveCount
    await db.inspiration.update({ where: { id: inspirationId }, data: { saveCount: { increment: 1 } } }).catch(() => {});
    // Update moodboard cover with first image
    const insp = await db.inspiration.findUnique({ where: { id: inspirationId }, select: { featuredImage: true } });
    if (insp && !board.coverImage) {
      await db.moodboard.update({ where: { id: params.id }, data: { coverImage: insp.featuredImage } });
    }
    return apiSuccess(item, 201);
  });
}
