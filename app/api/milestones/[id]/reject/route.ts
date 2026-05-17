import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { rejectMilestone } from "@/lib/services/escrow";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const body = await req.json();
    const result = await rejectMilestone(params.id, user!.id, body.reason || "Revision requested");
    return apiSuccess(result);
  });
}
