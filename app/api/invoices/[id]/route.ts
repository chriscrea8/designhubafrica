import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const invoice = await db.invoice.findUnique({ where: { id: params.id }, include: { items: true, client: { select: { firstName: true, lastName: true, email: true, location: true } }, designer: { include: { user: { select: { firstName: true, lastName: true, email: true, location: true, image: true } } } }, project: { select: { title: true } } } });
    if (!invoice) return apiError("Not found", 404);
    return apiSuccess(invoice);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!profile) return apiError("Not authorized", 403);
    const invoice = await db.invoice.findFirst({ where: { id: params.id, designerId: profile.id } });
    if (!invoice) return apiError("Not found", 404);
    if (invoice.status === "PAID") return apiError("Cannot edit a paid invoice", 400);
    const { items, ...rest } = await req.json();
    const updated = await db.invoice.update({
      where: { id: params.id },
      data: { ...rest, ...(rest.dueDate ? { dueDate: new Date(rest.dueDate) } : {}), updatedAt: new Date() } as any,
    });
    // Update items if provided
    if (Array.isArray(items)) {
      await db.invoiceItem.deleteMany({ where: { invoiceId: params.id } });
      await db.invoiceItem.createMany({ data: items.map((item: any) => ({ invoiceId: params.id, itemName: item.itemName, description: item.description||null, quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.quantity * item.unitPrice })) });
      const total = items.reduce((s: number, i: any) => s + i.quantity * i.unitPrice, 0);
      await db.invoice.update({ where: { id: params.id }, data: { totalAmount: total } as any });
    }
    return apiSuccess(updated);
  });
}
