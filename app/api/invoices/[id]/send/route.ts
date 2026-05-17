import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const invoice = await db.invoice.findUnique({ where: { id: params.id }, include: { client: true, designer: { include: { user: true } } } });
    if (!invoice) return apiError("Not found", 404);
    // Update status to SENT
    await db.invoice.update({ where: { id: params.id }, data: { status: "SENT" } });
    // Notify client via notification
    await db.notification.create({
      data: {
        userId: invoice.clientId,
        type: "invoice_sent",
        title: "Invoice Received",
        message: `${invoice.designer.user.firstName} sent you an invoice: "${invoice.title}" — ₦${invoice.totalAmount.toLocaleString()}`,
        link: `/invoices/${invoice.id}`,
      },
    }).catch(() => {});

    // Also send as a message in the active conversation (if one exists)
    const conversation = await db.conversation.findFirst({
      where: {
        participants: {
          some: { userId: invoice.designer.user.id || "" },
        },
        AND: {
          participants: {
            some: { userId: invoice.clientId },
          },
        },
      },
      select: { id: true },
    });

    if (conversation) {
      const designerUser = await db.user.findFirst({
        where: { designerProfile: { id: invoice.designerId } },
        select: { id: true },
      });
      if (designerUser) {
        await db.message.create({
          data: {
            conversationId: conversation.id,
            senderId: designerUser.id,
            content: JSON.stringify({
              type: "invoice",
              invoiceId: invoice.id,
              title: invoice.title,
              totalAmount: invoice.totalAmount,
              status: "SENT",
            }),
            type: "invoice",
          },
        }).catch(() => {});
      }
    }

    return apiSuccess({ sent: true, sharedInChat: !!conversation });
  });
}
