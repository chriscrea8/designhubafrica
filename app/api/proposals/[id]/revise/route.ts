import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { notes } = await req.json();
    if (!notes || notes.length < 10) return apiError("Please provide detailed feedback (min 10 chars)", 400);
    const proposal = await db.proposal.findUnique({ where: { id: params.id }, include: { project: true, designer: true } });
    if (!proposal) return apiError("Not found", 404);
    if (proposal.project.clientId !== user!.id) return apiError("Only client can request changes", 403);
    await db.proposal.update({ where: { id: params.id }, data: { status: "revision_requested", clientNotes: notes } });
    // Notify designer
    if (proposal.designer?.userId) {
      await db.notification.create({ data: { userId: proposal.designer.userId, type: "revision_requested", title: "Revision Requested", message: `Client requested changes on your proposal for "${proposal.project.title}"`, link: `/proposals` } });
    }
    return apiSuccess({ revisionRequested: true });
  });
}
