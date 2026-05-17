import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

const PRIORITY_MAP: Record<string, string> = {
  payment: "high", dispute: "urgent", safety: "urgent",
  account: "normal", project: "normal", general: "low"
};

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const category = url.searchParams.get("category");
    let where: any = user!.role === "ADMIN" ? {} : { userId: user!.id };
    if (status) where.status = status;
    if (category) where.category = category;
    const tickets = await db.supportTicket.findMany({ where, orderBy: { createdAt: "desc" }, include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } } });
    return apiSuccess(tickets);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { category, message } = await req.json();
    if (!category || !message || message.length < 10) return apiError("Category and message (min 10 chars) required", 400);

    const ticket = await db.supportTicket.create({
      data: { userId: user!.id, category, message, priority: PRIORITY_MAP[category] || "normal" },
    });

    // Notify admins
    const admins = await db.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
    for (const admin of admins) {
      await db.notification.create({ data: { userId: admin.id, type: "support_ticket", title: `New ${category} ticket`, message: message.slice(0, 100), link: `/admin-support` } }).catch(() => {});
    }

    return apiSuccess({ ticket, ticketId: ticket.id }, 201);
  });
}
