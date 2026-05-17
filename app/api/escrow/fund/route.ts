import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { getOrCreateEscrow } from "@/lib/services/escrow";
import { db } from "@/lib/db";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { projectId, milestoneId } = await req.json();
    if (!projectId || !milestoneId) return apiError("projectId and milestoneId required", 400);
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) return apiError("Project not found", 404);
    if (project.clientId !== user!.id) return apiError("Only client can fund", 403);
    const milestone = await db.milestone.findUnique({ where: { id: milestoneId } });
    if (!milestone) return apiError("Milestone not found", 404);
    if (milestone.status !== "pending") return apiError("Already funded", 400);
    await getOrCreateEscrow(projectId, user!.id);
    const reference = `escrow_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email: user!.email, amount: milestone.amount * 100, reference, callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://designhubafrica.vercel.app"}/projects/${projectId}?funded=true`, metadata: { projectId, milestoneId, userId: user!.id, type: "escrow_funding" } }),
    });
    const json = await res.json();
    if (!json.status) return apiError(json.message || "Payment failed", 400);
    return apiSuccess({ authorizationUrl: json.data.authorization_url, reference: json.data.reference, amount: milestone.amount });
  });
}
