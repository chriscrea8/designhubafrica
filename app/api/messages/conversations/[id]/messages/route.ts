import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { sendMessageSchema } from "@/lib/validations";
import { parseBody, apiSuccess, apiError, getSearchParams, paginatedResponse, withErrorHandling } from "@/lib/services/api-helpers";
import { triggerNewMessage } from "@/lib/realtime";
import { processMessageModeration } from "@/lib/services/moderation/ai/message-filter";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { page, limit, skip } = getSearchParams(req);
    const [messages, total] = await Promise.all([
      db.message.findMany({ where: { conversationId: params.id }, skip, take: limit, orderBy: { createdAt: "desc" }, include: { sender: { select: { id: true, firstName: true, lastName: true, image: true } } } }),
      db.message.count({ where: { conversationId: params.id } }),
    ]);
    return paginatedResponse(messages.reverse(), total, page, limit);
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireAuth();
    if (ae) return ae;
    const participant = await db.conversationParticipant.findFirst({ where: { conversationId: params.id, userId: user!.id } });
    if (!participant) return apiError("Not a participant", 403);
    const { data, error } = await parseBody(req, sendMessageSchema);
    if (error) return error;

    const mod = await processMessageModeration({ conversationId: params.id, senderId: user!.id, content: data!.content });
    if (!mod.allowed) return apiError(mod.warning || "Message blocked", 422);

    const message = await db.message.create({ data: { conversationId: params.id, senderId: user!.id, content: mod.content, type: data!.type, fileUrl: data!.fileUrl, isFlagged: mod.moderation.wasModified }, include: { sender: { select: { id: true, firstName: true, lastName: true, image: true } } } });
    await db.conversation.update({ where: { id: params.id }, data: { updatedAt: new Date() } });

    try { await triggerNewMessage(params.id, { id: message.id, senderId: message.senderId, senderName: `${message.sender.firstName} ${message.sender.lastName}`, content: message.content, type: message.type, createdAt: message.createdAt.toISOString() }); } catch {}

    return apiSuccess({ ...message, warning: mod.warning }, 201);
  });
}
