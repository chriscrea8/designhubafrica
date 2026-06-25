import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { computeSplit } from "@/lib/payments";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const url = new URL(req.url);
    const role = url.searchParams.get("role") || "client";
    const projectId = url.searchParams.get("projectId");

    const where: any = projectId ? { projectId } : {};
    if (role === "designer") {
      const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
      if (!profile) return apiSuccess([]);
      where.designerId = profile.id;
    } else {
      where.clientId = user!.id;
    }

    const invoices = await db.milestoneInvoice.findMany({
      where, orderBy: { createdAt: "desc" },
      include: { milestone: { select: { title: true, status: true } }, project: { select: { title: true } } },
    });
    return apiSuccess(invoices);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { milestoneId } = await req.json();
    if (!milestoneId) return apiError("milestoneId required", 400);

    const milestone = await db.milestone.findUnique({
      where: { id: milestoneId },
      include: { project: { select: { id: true, clientId: true, designerId: true, title: true } } },
    });
    if (!milestone) return apiError("Milestone not found", 404);

    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!profile || milestone.project.designerId !== profile.id) return apiError("Not authorized", 403);

    const existing = await db.milestoneInvoice.findUnique({ where: { milestoneId } });
    if (existing) return apiError("Invoice already exists for this milestone", 400);

    const { grossAmount, platformFee, netAmount } = await computeSplit(milestone.amount, "project");
    const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

    const invoice = await db.milestoneInvoice.create({
      data: {
        milestoneId,
        designerId: profile.id,
        clientId: milestone.project.clientId,
        projectId: milestone.project.id,
        invoiceNumber,
        grossAmount,
        platformFee,
        netAmount,
        status: "DRAFT",
      } as any,
    });

    return apiSuccess(invoice, 201);
  });
}
