import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { lockEscrow } from "@/lib/services/escrow";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;

    const { reason, evidence } = await req.json();
    if (!reason || reason.length < 20) return apiError("Please describe the dispute clearly (min 20 chars)", 400);

    const ms = await db.milestone.findUnique({
      where: { id: params.id },
      include: { project: { select: { clientId: true, designerId: true, id: true, title: true } } },
    });
    if (!ms) return apiError("Milestone not found", 404);

    const isClient = ms.project.clientId === user!.id;
    const isDesigner = ms.project.designerId === user!.id;
    if (!isClient && !isDesigner) return apiError("Not authorized", 403);

    // Create dispute record
    const dispute = await db.dispute.create({
      data: {
        projectId: ms.projectId,
        filerId: user!.id,
        targetId: isClient ? (ms.project.designerId || "") : ms.project.clientId,
        reason,
        evidence: evidence ? [evidence] : [],
        status: "OPEN",
      },
    }).catch(() => null);

    // Lock escrow to prevent any releases during dispute
    await lockEscrow(ms.projectId, true).catch(() => {});

    // Mark milestone as disputed
    await db.milestone.update({ where: { id: params.id }, data: { status: "disputed" } });

    // Notify admins
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    for (const admin of admins) {
      await db.notification.create({
        data: {
          userId: admin.id,
          type: "dispute_raised",
          title: "Dispute Raised",
          message: `Dispute on "${ms.title}" in project "${ms.project.title}": ${reason.slice(0, 80)}`,
          link: `/admin-disputes`,
        },
      }).catch(() => {});
    }

    // Notify the other party
    const otherUserId = isClient ? ms.project.designerId : ms.project.clientId;
    if (otherUserId) {
      await db.notification.create({
        data: {
          userId: otherUserId,
          type: "dispute_raised",
          title: "Dispute Filed",
          message: `A dispute has been raised on milestone "${ms.title}". Admin will review within 14 days.`,
          link: `/projects/${ms.projectId}`,
        },
      }).catch(() => {});
    }

    return apiSuccess({ dispute: dispute?.id, locked: true, message: "Dispute filed. Escrow is locked pending review." });
  });
}
