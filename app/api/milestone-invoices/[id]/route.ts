import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { createCheckout, generateReference } from "@/lib/payments";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://designhubafrica.vercel.app";

// Send invoice to client
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { action } = await req.json(); // send | pay | complete

    const invoice = await db.milestoneInvoice.findUnique({
      where: { id: params.id },
      include: { designer: { include: { user: true } }, milestone: true, project: { select: { title: true } } },
    });
    if (!invoice) return apiError("Invoice not found", 404);

    if (action === "send") {
      // Designer sends invoice to client
      if (invoice.designer.user.id !== user!.id) return apiError("Not authorized", 403);
      const updated = await db.milestoneInvoice.update({ where: { id: params.id }, data: { status: "SENT" } as any });
      // Notify client
      await db.notification.create({ data: { userId: invoice.clientId, type: "invoice_received", title: "New Invoice", message: `Invoice for "${invoice.milestone.title}" — ₦${invoice.grossAmount.toLocaleString()}`, link: `/invoices/${params.id}` } }).catch(() => {});
      return apiSuccess(updated);
    }

    if (action === "view") {
      await db.milestoneInvoice.update({ where: { id: params.id }, data: { status: invoice.status === "SENT" ? "VIEWED" : invoice.status, viewedAt: new Date() } as any });
      return apiSuccess({ viewed: true });
    }

    if (action === "pay") {
      // Client initiates payment
      if (invoice.clientId !== user!.id) return apiError("Not authorized", 403);
      if (!["SENT","VIEWED"].includes(invoice.status)) return apiError("Invoice cannot be paid in current status", 400);
      const client = await db.user.findUnique({ where: { id: user!.id }, select: { email: true } });
      const reference = generateReference("invoice");
      await db.milestoneInvoice.update({ where: { id: params.id }, data: { paystackRef: reference } as any });
      const checkout = await createCheckout({
        email: client!.email,
        amount: invoice.grossAmount * 100,
        reference,
        callbackUrl: `${APP_URL}/invoices/${params.id}?paid=true`,
        metadata: { type: "milestone_invoice", invoiceId: params.id, milestoneId: invoice.milestoneId, projectId: invoice.projectId, userId: user!.id },
      });
      await db.transaction.create({
        data: { userId: user!.id, type: "project_milestone", referenceId: params.id, providerReference: reference, grossAmount: invoice.grossAmount, platformFee: invoice.platformFee, netAmount: invoice.netAmount, status: "pending" } as any,
      });
      return apiSuccess({ authorizationUrl: checkout.authorizationUrl, reference });
    }

    return apiError("Invalid action", 400);
  });
}
