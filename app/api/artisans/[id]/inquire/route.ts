import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { message } = await req.json();
    if (!message) return apiError("Message required", 400);

    const artisan = await db.artisanProfile.findUnique({
      where: { id: params.id },
      select: { userId: true, serviceCategory: true },
    });
    if (!artisan) return apiError("Artisan not found", 404);
    if (artisan.userId === user!.id) return apiError("Cannot message yourself", 400);

    // Find existing conversation between these two users
    const existing = await db.conversation.findFirst({
      where: {
        participants: {
          every: { userId: { in: [user!.id, artisan.userId] } },
        },
      },
      include: { participants: true },
    });

    let convId: string;
    if (existing && existing.participants.length === 2) {
      convId = existing.id;
    } else {
      const conv = await db.conversation.create({
        data: {
          participants: {
            create: [{ userId: user!.id }, { userId: artisan.userId }],
          },
        },
      });
      convId = conv.id;
    }

    await db.message.create({
      data: { conversationId: convId, senderId: user!.id, content: message, type: "TEXT" },
    });

    await db.notification.create({
      data: { userId: artisan.userId, type: "new_message", title: "New Inquiry", message: `You have a new inquiry about your ${artisan.serviceCategory?.replace(/_/g," ")} services`, link: `/artisan-messages` },
    }).catch(() => {});

    return apiSuccess({ conversationId: convId });
  });
}
