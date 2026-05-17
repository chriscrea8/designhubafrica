import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const convs = await db.conversation.findMany({ where: { participants: { some: { userId: user!.id } } }, orderBy: { updatedAt: "desc" },
      include: { participants: { include: { user: { select: { id: true, firstName: true, lastName: true, image: true } } } }, messages: { take: 1, orderBy: { createdAt: "desc" } }, project: { select: { id: true, title: true } } } });
    return apiSuccess(convs);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { recipientId, projectId } = await req.json();
    if (!recipientId) return apiError("recipientId required", 400);
    const existing = await db.conversation.findFirst({ where: { AND: [{ participants: { some: { userId: user!.id } } }, { participants: { some: { userId: recipientId } } }], ...(projectId ? { projectId } : {}) }, include: { participants: { include: { user: { select: { id: true, firstName: true, lastName: true, image: true } } } } } });
    if (existing) return apiSuccess(existing);
    const conv = await db.conversation.create({ data: { projectId, participants: { create: [{ userId: user!.id }, { userId: recipientId }] } }, include: { participants: { include: { user: { select: { id: true, firstName: true, lastName: true, image: true } } } } } });
    return apiSuccess(conv, 201);
  });
}
