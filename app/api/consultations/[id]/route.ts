import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const c = await db.consultation.findUnique({ where: { id: params.id }, include: { client: { select: { firstName: true, lastName: true, email: true } }, designer: { include: { user: { select: { firstName: true, lastName: true, image: true } } } } } });
    if (!c) return apiError("Not found", 404);
    if (c.clientId !== user!.id && c.designer.userId !== user!.id) return apiError("Forbidden", 403);
    // Only reveal meeting link if PAID or COMPLETED
    const canSeeMeeting = ["PAID", "COMPLETED"].includes(c.status);
    return apiSuccess({ ...c, meetingLink: canSeeMeeting ? (c.meetingLink || (c.designer as any).meetingLink) : null });
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const body = await req.json();
    const c = await db.consultation.update({ where: { id: params.id }, data: body });
    return apiSuccess(c);
  });
}
