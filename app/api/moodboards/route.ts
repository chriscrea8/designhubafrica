import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const boards = await db.moodboard.findMany({
      where: { clientId: user!.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { items: true } },
        items: { take: 4, orderBy: { createdAt: "desc" }, include: { inspiration: { select: { featuredImage: true, title: true } } } },
      },
    } as any);
    return apiSuccess(boards);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { title, description } = await req.json();
    if (!title) return apiError("Title required", 400);
    const board = await db.moodboard.create({ data: { clientId: user!.id, title, description: description || null } });
    return apiSuccess(board, 201);
  });
}
