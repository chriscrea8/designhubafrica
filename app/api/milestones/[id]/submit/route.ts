import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { submitMilestone } from "@/lib/services/escrow";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error } = await requireAuth();
    if (error) return error;
    const result = await submitMilestone(params.id);
    return apiSuccess(result);
  });
}
