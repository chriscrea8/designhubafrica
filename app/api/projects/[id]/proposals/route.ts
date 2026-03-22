import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/auth";
import { createProposalSchema } from "@/lib/validations";
import { parseBody, apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const proposals = await db.proposal.findMany({ where: { projectId: params.id }, orderBy: { createdAt: "desc" },
      include: { designer: { include: { user: { select: { firstName: true, lastName: true, image: true, location: true } } } } } });
    return apiSuccess(proposals);
  });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireRole("DESIGNER");
    if (ae) return ae;
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id } });
    if (!profile || profile.approvalStatus !== "APPROVED") return apiError("Must be verified designer", 403);
    const { data, error } = await parseBody(req, createProposalSchema);
    if (error) return error;
    const proposal = await db.proposal.create({ data: { projectId: params.id, designerId: profile.id, coverLetter: data!.coverLetter, proposedRate: data!.proposedRate, currency: data!.currency, deliveryDays: data!.deliveryDays, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } });
    return apiSuccess(proposal, 201);
  });
}
