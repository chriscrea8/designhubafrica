import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const board = await db.moodboard.findFirst({
      where: { id: params.id, clientId: user!.id },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            inspiration: {
              include: {
                designer: { include: { user: { select: { firstName: true, lastName: true, image: true } } } },
              },
            } as any,
          },
        },
      } as any,
    });
    if (!board) return apiError("Moodboard not found", 404);
    return apiSuccess(board);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { title, description } = await req.json();
    const board = await db.moodboard.findFirst({ where: { id: params.id, clientId: user!.id } });
    if (!board) return apiError("Not found", 404);
    const updated = await db.moodboard.update({ where: { id: params.id }, data: { title, description } });
    return apiSuccess(updated);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const board = await db.moodboard.findFirst({ where: { id: params.id, clientId: user!.id } });
    if (!board) return apiError("Not found", 404);
    await db.moodboard.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  });
}
