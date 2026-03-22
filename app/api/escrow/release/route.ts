import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { escrowReleaseSchema } from "@/lib/validations";
import { parseBody, apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { releaseMilestonePayment } from "@/lib/services/escrow";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error: ae, user } = await requireAuth();
    if (ae) return ae;
    const { data, error } = await parseBody(req, escrowReleaseSchema);
    if (error) return error;
    const project = await db.project.findUnique({ where: { id: data!.projectId } });
    if (!project) return apiError("Not found", 404);
    if (project.clientId !== user!.id && user!.role !== "ADMIN") return apiError("Only client can release", 403);
    const result = await releaseMilestonePayment({ projectId: data!.projectId, milestoneId: data!.milestoneId });
    return apiSuccess(result);
  });
}
