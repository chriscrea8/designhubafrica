import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const proposal = await db.proposal.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, title: true, clientId: true } },
        designer: { select: { id: true, userId: true } },
      },
    });
    if (!proposal) return apiError("Not found", 404);
    if (proposal.project.clientId !== user!.id) return apiError("Only client can reject", 403);
    await db.proposal.update({ where: { id: params.id }, data: { status: "rejected" } });
    if (proposal.designer?.userId) {
      await db.notification.create({
        data: {
          userId: proposal.designer.userId,
          type: "proposal_rejected",
          title: "Proposal Not Selected",
          message: `Your proposal for "${proposal.project?.title || "a project"}" was not selected this time.`,
          link: `/proposals`,
        },
      }).catch(() => {});
    }
    return apiSuccess({ rejected: true });
  });
}
