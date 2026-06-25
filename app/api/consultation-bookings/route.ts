import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";
import { createCheckout, generateReference, computeSplit } from "@/lib/payments";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://designhubafrica.vercel.app";

export async function GET(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const url = new URL(req.url);
    const mine = url.searchParams.get("mine");
    const where = mine === "designer"
      ? { designer: { userId: user!.id } }
      : { clientId: user!.id };
    const bookings = await db.consultationBooking.findMany({
      where, orderBy: { createdAt: "desc" },
      include: {
        package:  { select: { title: true, duration: true } },
        designer: { include: { user: { select: { firstName: true, lastName: true, image: true } } } },
        client:   { select: { firstName: true, lastName: true, image: true } },
      },
    });
    return apiSuccess(bookings);
  });
}

export async function POST(req: NextRequest) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { packageId, scheduledAt } = await req.json();
    if (!packageId) return apiError("packageId required", 400);

    const pkg = await db.consultationPackage.findUnique({
      where: { id: packageId },
      include: { designer: { include: { user: { select: { id: true } } } } },
    });
    if (!pkg || !pkg.isActive) return apiError("Package not available", 404);
    if (pkg.designer.user.id === user!.id) return apiError("Cannot book your own consultation", 400);

    const { grossAmount, platformFee, netAmount } = await computeSplit(pkg.price, "consultation");
    const reference = generateReference("consult");

    const booking = await db.consultationBooking.create({
      data: {
        clientId: user!.id,
        designerId: pkg.designerId,
        packageId,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        grossAmount,
        platformFee,
        designerAmount: netAmount,
        paystackRef: reference,
      } as any,
    });

    const checkout = await createCheckout({
      email: user!.email,
      amount: grossAmount * 100, // kobo
      reference,
      callbackUrl: `${APP_URL}/consultation-success?booking=${booking.id}`,
      metadata: { type: "consultation_booking", bookingId: booking.id, userId: user!.id, packageId },
    });

    // Record transaction
    await db.transaction.create({
      data: { userId: user!.id, type: "consultation", referenceId: booking.id, providerReference: reference, grossAmount, platformFee, netAmount, status: "pending", metadata: { packageId, designerId: pkg.designerId } } as any,
    });

    return apiSuccess({ booking, authorizationUrl: checkout.authorizationUrl, reference });
  });
}
