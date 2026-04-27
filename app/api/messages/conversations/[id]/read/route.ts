import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, withErrorHandling } from "@/lib/services/api-helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    await db.message.updateMany({
      where: { conversationId: params.id, senderId: { not: user!.id }, isRead: false },
      data: { isRead: true },
    });
    return apiSuccess({ read: true });
  });
}
