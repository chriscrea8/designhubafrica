"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Calendar, CalendarPlus, Clock, Video, ArrowRight } from "lucide-react";
import { Button, Card, CardContent, Badge } from "@/components/ui";
import { formatCurrency, formatDate } from "@/lib/utils";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams?.get("booking");
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (!bookingId) return;
    // Also trigger payment verification for the booking (handles cases where webhook didn't fire)
    const searchParams = new URLSearchParams(window.location.search);
    const reference = searchParams.get("reference") || searchParams.get("trxref");
    if (reference) {
      fetch(`/api/payments/verify?reference=${reference}&type=consultation&id=${bookingId}`, { method:"POST" }).catch(()=>{});
    }
    const load = () => fetch(`/api/consultation-bookings/${bookingId}`).then(r=>r.json()).then(res => {
      if (res.success) setBooking(res.data);
      else setTimeout(load, 1000);
    }).catch(() => setTimeout(load, 1500));
    load();
  }, [bookingId]);

  function addToGoogleCalendar() {
    if (!booking) return;
    const start = booking.scheduledAt ? new Date(booking.scheduledAt) : new Date(Date.now() + 86400000);
    const end   = new Date(start.getTime() + (booking.package?.duration || 60) * 60000);
    const fmt   = (d: Date) => d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
    const url   = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action","TEMPLATE");
    url.searchParams.set("text", `Consultation: ${booking.package?.title || "Designer Consultation"}`);
    url.searchParams.set("dates", `${fmt(start)}/${fmt(end)}`);
    url.searchParams.set("details", `DesignHub Africa consultation.\n\nMeeting link: ${booking.meetingLink || "Will be provided by your designer shortly."}`);
    window.open(url.toString(), "_blank");
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Success header */}
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600"/>
          </div>
          <h1 className="text-2xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground mt-1">Your consultation has been booked</p>
        </div>

        {booking && (
          <Card className="border-emerald-200">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Package</span>
                <span className="font-semibold text-sm">{booking.package?.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Designer</span>
                <span className="font-semibold text-sm">{booking.designer?.user?.firstName} {booking.designer?.user?.lastName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Duration</span>
                <span className="font-semibold text-sm flex items-center gap-1"><Clock className="h-3.5 w-3.5"/>{booking.package?.duration} minutes</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-terracotta-600">{formatCurrency(booking.grossAmount)}</span>
              </div>
              {booking.scheduledAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Scheduled</span>
                  <span className="font-semibold text-sm">{formatDate(booking.scheduledAt)}</span>
                </div>
              )}
              {booking.meetingLink && (
                <a href={booking.meetingLink} target="_blank" className="flex items-center gap-2 text-sm text-terracotta-500 hover:underline">
                  <Video className="h-4 w-4"/>Join Meeting
                </a>
              )}
              {!booking.meetingLink && (
                <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                  📅 Your designer will add the meeting link shortly. You'll be notified.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <Button variant="terracotta" className="w-full gap-2" onClick={addToGoogleCalendar}>
            <CalendarPlus className="h-4 w-4"/>Add to Google Calendar
          </Button>
          <Button variant="outline" className="w-full gap-2" onClick={() => router.push("/consultations")}>
            View All Consultations <ArrowRight className="h-4 w-4"/>
          </Button>
          <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ConsultationSuccessPage() {
  return <Suspense fallback={<div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><SuccessContent/></Suspense>;
}
