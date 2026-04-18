import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const isDesigner = user!.role === "DESIGNER";
    let where: any;
    if (isDesigner) {
      const profile = await db.designerProfile.findUnique({ where: { userId: user!.id }, select: { id: true } });
      if (!profile) return apiSuccess([]);
      where = { designerId: profile.id };
    } else {
      where = { clientId: user!.id };
    }
    const consultations = await db.consultation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { firstName: true, lastName: true, email: true, image: true } },
        designer: { include: { user: { select: { firstName: true, lastName: true, image: true } } } },
      },
    });
    return apiSuccess(consultations);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { designerId, type, scheduledAt, notes } = await req.json();
    if (!designerId || !type) return apiError("designerId and type required", 400);

    // Explicitly select the new fields to avoid stale type cache issues
    const designer = await db.designerProfile.findUnique({
      where: { id: designerId },
      select: {
        id: true,
        userId: true,
        consultationPrice: true,
        meetingLink: true,
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });
    if (!designer) return apiError("Designer not found", 404);
    const price = designer.consultationPrice || 15000;

    const consultation = await db.consultation.create({
      data: { clientId: user!.id, designerId, type, price, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined, notes },
    });

    const reference = `consult_${consultation.id}_${Date.now()}`;
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user!.email,
        amount: price * 100,
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://designhubafrica.vercel.app"}/consultations/${consultation.id}?paid=true`,
        metadata: { consultationId: consultation.id, type: "consultation" },
      }),
    });
    const json = await res.json();
    if (!json.status) return apiError(json.message || "Payment failed", 400);

    return apiSuccess({ consultation, authorizationUrl: json.data.authorization_url, reference: json.data.reference }, 201);
  });
}
