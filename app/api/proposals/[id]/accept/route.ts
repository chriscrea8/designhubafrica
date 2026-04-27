import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;

    const proposal = await db.proposal.findUnique({ where: { id: params.id }, include: { project: true, designer: { include: { user: true } } } });
    if (!proposal) return apiError("Proposal not found", 404);
    if (proposal.project.clientId !== user!.id) return apiError("Only project client can accept", 403);
    if (proposal.status !== "pending") return apiError("Can only accept pending proposals", 400);

    // Accept this proposal
    await db.proposal.update({ where: { id: params.id }, data: { status: "accepted" } });

    // Reject all other proposals for this project
    await db.proposal.updateMany({ where: { projectId: proposal.projectId, id: { not: params.id }, status: "pending" }, data: { status: "rejected" } });

    // Assign designer to project
    await db.project.update({ where: { id: proposal.projectId }, data: { designerId: proposal.designerId, status: "IN_PROGRESS" } });

    // Create milestones from proposal
    const milestones = proposal.milestones ? JSON.parse(proposal.milestones) : [];
    for (const ms of milestones) {
      await db.milestone.create({
        data: { projectId: proposal.projectId, title: ms.title, description: ms.deliverable, amount: ms.amount, currency: "NGN", status: "pending" },
      });
    }

    // Create escrow account
    const existingEscrow = await db.escrowAccount.findUnique({ where: { projectId: proposal.projectId } });
    if (!existingEscrow) {
      await db.escrowAccount.create({ data: { projectId: proposal.projectId, userId: user!.id } });
    }

    // Create conversation between client and designer (for secure messaging)
    if (proposal.designer?.userId) {
      const existingConv = await db.conversation.findFirst({
        where: { projectId: proposal.projectId, AND: [{ participants: { some: { userId: user!.id } } }, { participants: { some: { userId: proposal.designer.userId } } }] },
      });
      if (!existingConv) {
        const conv = await db.conversation.create({ data: { projectId: proposal.projectId, participants: { create: [{ userId: user!.id }, { userId: proposal.designer.userId }] } } });
        // Send initial system message
        await db.message.create({ data: { conversationId: conv.id, senderId: user!.id, content: `Proposal accepted for "${proposal.project.title}". You can now discuss the project here. Please do not share personal contact information.`, type: "system" } });
      }

      // Notify designer
      await db.notification.create({
        data: { userId: proposal.designer.userId, type: "proposal_accepted", title: "Proposal Accepted!", message: `Your proposal for "${proposal.project.title}" was accepted. Milestones have been created. You can now message the client.`, link: `/active-projects` },
      });
    }

    // Notify client
    await db.notification.create({
      data: { userId: user!.id, type: "project_update", title: "Designer Assigned", message: `${proposal.designer?.user?.firstName} ${proposal.designer?.user?.lastName} is now working on "${proposal.project.title}". Fund the first milestone to begin.`, link: `/projects/${proposal.projectId}` },
    });

    return apiSuccess({ accepted: true, milestonesCreated: milestones.length, conversationCreated: true });
  });
}
