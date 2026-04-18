import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const proposals = await db.proposal.findMany({ where: { projectId: params.id }, orderBy: { createdAt: "desc" },
      include: { designer: { include: { user: { select: { id: true, firstName: true, lastName: true, image: true, location: true } } } } } });
    return apiSuccess(proposals);
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireAuth();
    if (ae) return ae;
    if (user!.role !== "DESIGNER" && user!.role !== "ARTISAN") return apiError("Only designers/artisans can submit proposals", 403);

    const profile = user!.role === "DESIGNER"
      ? await db.designerProfile.findUnique({ where: { userId: user!.id } })
      : await db.artisanProfile.findUnique({ where: { userId: user!.id } });
    if (!profile) return apiError("Profile not found", 404);

    const project = await db.project.findUnique({ where: { id: params.id } });
    if (!project || project.status !== "OPEN") return apiError("Project not open for proposals", 400);

    const body = await req.json();
    const { coverLetter, proposedRate, deliveryDays, milestones } = body;

    if (!coverLetter || coverLetter.length < 50) return apiError("Cover letter must be at least 50 characters", 400);
    if (!proposedRate || proposedRate < 1000) return apiError("Proposed rate must be at least ₦1,000", 400);
    if (!deliveryDays || deliveryDays < 1) return apiError("Delivery days required", 400);

    // Validate milestones
    if (!milestones || !Array.isArray(milestones) || milestones.length < 2) return apiError("At least 2 milestones required", 400);
    const totalMilestoneAmount = milestones.reduce((sum: number, m: any) => sum + (m.amount || 0), 0);
    if (totalMilestoneAmount !== proposedRate) return apiError(`Milestones total (₦${totalMilestoneAmount.toLocaleString()}) must equal proposed rate (₦${proposedRate.toLocaleString()})`, 400);

    // Validate first milestone max 40%
    const firstMilestonePercent = (milestones[0].amount / totalMilestoneAmount) * 100;
    if (firstMilestonePercent > 40) return apiError("First milestone cannot exceed 40% of total", 400);

    // Validate last milestone min 20%
    const lastMilestonePercent = (milestones[milestones.length - 1].amount / totalMilestoneAmount) * 100;
    if (lastMilestonePercent < 20) return apiError("Final milestone must be at least 20% of total", 400);

    // Check for clear deliverables
    for (const m of milestones) {
      if (!m.title || m.title.length < 5) return apiError("Each milestone needs a clear title (min 5 chars)", 400);
      if (!m.deliverable || m.deliverable.length < 10) return apiError(`Milestone "${m.title}" needs a clear deliverable description (min 10 chars)`, 400);
    }

    // Check if already submitted
    const existing = await db.proposal.findFirst({
      where: { projectId: params.id, ...(user!.role === "DESIGNER" ? { designerId: profile.id } : { artisanId: profile.id }), status: { in: ["pending", "revision_requested"] } },
    });

    if (existing) {
      // Update existing proposal (resubmission after revision)
      const updated = await db.proposal.update({
        where: { id: existing.id },
        data: { coverLetter, proposedRate, deliveryDays, milestones: JSON.stringify(milestones), status: "pending", clientNotes: null, updatedAt: new Date() },
      });
      return apiSuccess(updated);
    }

    const proposal = await db.proposal.create({
      data: {
        projectId: params.id,
        ...(user!.role === "DESIGNER" ? { designerId: profile.id } : { artisanId: profile.id }),
        coverLetter, proposedRate, currency: "NGN", deliveryDays,
        milestones: JSON.stringify(milestones),
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 day expiry
      },
    });

    // Notify client
    await db.notification.create({
      data: { userId: project.clientId, type: "new_proposal", title: "New Proposal Received", message: `A designer submitted a proposal for "${project.title}"`, link: `/projects/${project.id}` },
    });

    return apiSuccess(proposal, 201);
  });
}
