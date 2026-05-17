import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;

    const { reason } = await req.json();
    if (!reason || reason.length < 10) return apiError("Please provide a revision reason (min 10 chars)", 400);

    const ms = await db.milestone.findUnique({
      where: { id: params.id },
      include: { project: { select: { clientId: true, designerId: true, title: true } } },
    });
    if (!ms) return apiError("Milestone not found", 404);
    if (ms.project.clientId !== user!.id) return apiError("Only the client can request revision", 403);
    if (ms.status !== "submitted") return apiError("Can only revise submitted milestones", 400);

    // Move back to in_progress with revision note
    await db.milestone.update({
      where: { id: params.id },
      data: { status: "in_progress", completedAt: null },
    });

    // Notify designer
    if (ms.project.designerId) {
      await db.notification.create({
        data: {
          userId: ms.project.designerId,
          type: "milestone_revision",
          title: "Revision Requested",
          message: `Client requested revision on "${ms.title}": ${reason}`,
          link: `/projects/${ms.projectId}`,
        },
      }).catch(() => {});
    }

    return apiSuccess({ revised: true, reason });
  });
}
