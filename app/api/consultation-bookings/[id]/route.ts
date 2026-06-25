import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { apiSuccess, apiError, withErrorHandling } from "@/lib/services/api-helpers";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const booking = await db.consultationBooking.findFirst({
      where: { id: params.id, OR: [{ clientId: user!.id }, { designer: { userId: user!.id } }] },
      include: { package: true, designer: { include: { user: { select: { firstName: true, lastName: true } } } }, client: { select: { firstName: true, lastName: true } } },
    } as any);
    if (!booking) return apiError("Not found", 404);
    return apiSuccess(booking);
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return withErrorHandling(async () => {
    const { error, user } = await requireAuth();
    if (error) return error;
    const { meetingLink, bookingStatus, scheduledAt } = await req.json();
    const booking = await db.consultationBooking.findFirst({
      where: { id: params.id, designer: { userId: user!.id } },
    });
    if (!booking) return apiError("Not found or not authorized", 404);
    const updated = await db.consultationBooking.update({
      where: { id: params.id },
      data: {
        ...(meetingLink    !== undefined && { meetingLink }),
        ...(bookingStatus  !== undefined && { bookingStatus }),
        ...(scheduledAt    !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
      } as any,
    });
    // Notify client if meeting link added
    if (meetingLink) {
      await db.notification.create({ data: { userId: booking.clientId, type: "meeting_link", title: "Meeting Link Ready", message: "Your designer has added a meeting link to your consultation", link: "/consultations" } }).catch(()=>{});
    }
    return apiSuccess(updated);
  });
}
