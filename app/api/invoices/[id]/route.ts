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
    const { error } = await requireAuth();
    if (error) return error;
    const body = await req.json();
    const invoice = await db.invoice.update({ where: { id: params.id }, data: { ...body, items: body.items ? { deleteMany: {}, create: body.items.map((item: any) => ({ itemName: item.itemName, description: item.description || "", quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.quantity * item.unitPrice })) } : undefined } });
    return apiSuccess(invoice);
  });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error } = await requireAuth();
    if (error) return error;
    await db.invoice.delete({ where: { id: params.id } });
    return apiSuccess({ deleted: true });
  });
}
