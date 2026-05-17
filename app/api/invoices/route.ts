import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const url = new URL(req.url);
    const role = url.searchParams.get("role");
    let where: any;
    if (user!.role === "DESIGNER" || role === "designer") {
      const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
      if (!profile) return apiSuccess([]);
      where = { designerId: profile.id };
    } else {
      where = { clientId: user!.id };
    }
    const invoices = await db.invoice.findMany({ where, orderBy: { createdAt: "desc" }, include: { items: true, client: { select: { firstName: true, lastName: true, email: true } }, designer: { include: { user: { select: { firstName: true, lastName: true } } } } } });
    return apiSuccess(invoices);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    if (user!.role !== "DESIGNER") return apiError("Only designers can create invoices", 403);
    const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
    if (!profile) return apiError("Designer profile not found", 404);
    const body = await req.json();
    const { title, clientId: rawClientId, projectId, notes, dueDate, items } = body;
    if (!title || !rawClientId || !items?.length) return apiError("title, clientId, and items required", 400);
    // Accept email or user ID
    let clientId = rawClientId;
    if (rawClientId.includes("@")) {
      const client = await db.user.findUnique({ where: { email: rawClientId }, select: { id: true } });
      if (!client) return apiError("Client not found with that email", 404);
      clientId = client.id;
    }
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const invoice = await db.invoice.create({
      data: {
        designerId: profile.id, clientId, projectId: projectId || undefined,
        title, notes, totalAmount, dueDate: dueDate ? new Date(dueDate) : undefined,
        items: { create: items.map((item: any) => ({ itemName: item.itemName, description: item.description || "", quantity: item.quantity, unitPrice: item.unitPrice, totalPrice: item.quantity * item.unitPrice })) },
      },
      include: { items: true },
    });
    return apiSuccess(invoice, 201);
  });
}
