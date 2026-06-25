import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function DELETE(req: NextRequest, { params }: { params: { id: string; itemId: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const board = await db.moodboard.findFirst({ where: { id: params.id, clientId: user!.id } });
    if (!board) return apiError("Not found", 404);
    const item = await db.moodboardItem.findFirst({ where: { id: params.itemId, moodboardId: params.id } });
    if (!item) return apiError("Item not found", 404);
    await db.moodboardItem.delete({ where: { id: params.itemId } });
    await db.inspiration.update({ where: { id: item.inspirationId }, data: { saveCount: { decrement: 1 } } }).catch(() => {});
    return apiSuccess({ deleted: true });
  });
}
