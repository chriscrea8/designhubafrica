import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { approveMilestone } from "@/lib/services/escrow";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const result = await approveMilestone(params.id, user!.id);
    return apiSuccess(result);
  });
}
