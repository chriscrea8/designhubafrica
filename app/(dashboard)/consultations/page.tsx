"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Calendar, CheckCircle2, Clock, Video, ExternalLink, CalendarPlus, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  PENDING:"bg-amber-50 text-amber-700", CONFIRMED:"bg-emerald-50 text-emerald-700",
  COMPLETED:"bg-blue-50 text-blue-700",  CANCELLED:"bg-red-50 text-red-700",
};

function ConfirmationBanner({ bookingId }: { bookingId: string }) {
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/consultation-bookings/${bookingId}`).then(r=>r.json()).then(res=>{
      if (res.success) setBooking(res.data);
    }).catch(()=>{});
  }, [bookingId]);

  if (!booking) return null;

  function addToGoogleCalendar() {
    const pkg = booking.package;
    const start = booking.scheduledAt ? new Date(booking.scheduledAt) : new Date();
    const end   = new Date(start.getTime() + (pkg?.duration || 60) * 60000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g,"").split(".")[0]+"Z";
    const url = new URL("https://calendar.google.com/calendar/render");
    url.searchParams.set("action","TEMPLATE");
    url.searchParams.set("text", `DesignHub Consultation: ${pkg?.title || "Consultation"}`);
    url.searchParams.set("dates", `${fmt(start)}/${fmt(end)}`);
    url.searchParams.set("details", `DesignHub Africa consultation with your interior designer.\n\nMeeting link: ${booking.meetingLink || "Will be shared by your designer."}`);
    window.open(url.toString(), "_blank");
  }

  return (
    <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/30 p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-6 w-6 text-emerald-600"/>
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-emerald-800">Consultation Booked!</h2>
          <p className="text-emerald-700 text-sm mt-1">Your payment was successful. Your designer has been notified.</p>
          <div className="mt-4 grid sm:grid-cols-2 gap-3 text-sm">
            <div><p className="text-xs text-muted-foreground">Package</p><p className="font-semibold">{booking.package?.title}</p></div>
            <div><p className="text-xs text-muted-foreground">Duration</p><p className="font-semibold">{booking.package?.duration} minutes</p></div>
            <div><p className="text-xs text-muted-foreground">Amount Paid</p><p className="font-semibold">{formatCurrency(booking.grossAmount)}</p></div>
            <div><p className="text-xs text-muted-foreground">Status</p><Badge className={cn("text-xs", STATUS_STYLE[booking.bookingStatus]||"")}>{booking.bookingStatus}</Badge></div>
            {booking.scheduledAt && <div><p className="text-xs text-muted-foreground">Scheduled</p><p className="font-semibold">{formatDate(booking.scheduledAt)}</p></div>}
            {booking.meetingLink && <div><p className="text-xs text-muted-foreground">Meeting Link</p><a href={booking.meetingLink} target="_blank" className="text-terracotta-500 hover:underline flex items-center gap-1 font-medium"><Video className="h-3.5 w-3.5"/>Join Meeting</a></div>}
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="terracotta" size="sm" onClick={addToGoogleCalendar} className="gap-2">
              <CalendarPlus className="h-4 w-4"/>Add to Google Calendar
            </Button>
            {!booking.meetingLink && <p className="text-xs text-muted-foreground self-center">Meeting link will be shared by your designer</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsultationsContent() {
  const searchParams = useSearchParams();
  const bookingId    = searchParams?.get("booking");
  const [bookings, setBookings]   = useState<any[]>([]);
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    fetch("/api/consultation-bookings?mine=client").then(r=>r.json()).then(res=>{
      if (res.success) setBookings(res.data||[]);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Consultations</h1><p className="text-sm text-muted-foreground mt-1">Your booked designer consultations</p></div>

      {bookingId && <ConfirmationBanner bookingId={bookingId}/>}

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>
      : bookings.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
          <p className="font-semibold">No consultations yet</p>
          <p className="text-sm text-muted-foreground mt-1">Browse designers and book a consultation</p>
          <Button variant="terracotta" className="mt-4" asChild><Link href="/designers">Find Designers</Link></Button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b:any) => (
            <Card key={b.id}><CardContent className="p-5 flex items-start gap-4 flex-wrap">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold">{b.package?.title || "Consultation"}</p>
                  <Badge className={cn("text-[10px]", STATUS_STYLE[b.bookingStatus]||"")}>{b.bookingStatus}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">with {b.designer?.user?.firstName} {b.designer?.user?.lastName}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{b.package?.duration} min</span>
                  <span className="font-medium text-foreground">{formatCurrency(b.grossAmount)}</span>
                  {b.scheduledAt && <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/>{formatDate(b.scheduledAt)}</span>}
                </div>
              </div>
              {b.meetingLink ? (
                <a href={b.meetingLink} target="_blank" className="shrink-0">
                  <Button variant="terracotta" size="sm" className="gap-2"><Video className="h-3.5 w-3.5"/>Join Meeting</Button>
                </a>
              ) : b.bookingStatus === "CONFIRMED" && (
                <p className="text-xs text-muted-foreground shrink-0 self-center">Meeting link coming</p>
              )}
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ConsultationsPage() {
  return <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><ConsultationsContent/></Suspense>;
}
