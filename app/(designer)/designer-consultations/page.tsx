"use client";
import React, { useEffect, useState } from "react";
import { Calendar, Video, CheckCircle2, Clock, Loader2, Link as LinkIcon, X } from "lucide-react";
import { Card, CardContent, Button, Badge, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  PENDING:"bg-amber-50 text-amber-700", CONFIRMED:"bg-emerald-50 text-emerald-700",
  COMPLETED:"bg-blue-50 text-blue-700",  CANCELLED:"bg-red-50 text-red-700",
};

export default function DesignerConsultationsPage() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [acting,        setActing]        = useState<string|null>(null);
  const [linkModal,     setLinkModal]     = useState<string|null>(null);
  const [meetingLink,   setMeetingLink]   = useState("");
  const [scheduledAt,   setScheduledAt]   = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/consultation-bookings?mine=designer").then(r=>r.json()).catch(()=>({}));
    if (res.success) setConsultations(res.data || []);
    setLoading(false);
  }

  async function update(id: string, data: any) {
    setActing(id);
    const res = await fetch(`/api/consultation-bookings/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    const json = await res.json();
    setActing(null);
    if (json.success) { load(); setLinkModal(null); setMeetingLink(""); setScheduledAt(""); }
    else alert(json.error || "Failed");
  }

  const paid      = consultations.filter(c => ["CONFIRMED","COMPLETED"].includes(c.bookingStatus));
  const pending   = consultations.filter(c => c.bookingStatus === "PENDING");

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Consultations</h1><p className="text-sm text-muted-foreground mt-1">{pending.length} pending · {paid.length} confirmed</p></div>
        <Button variant="outline" size="sm" asChild><a href="/consultation-settings">Manage Packages</a></Button>
      </div>

      {consultations.length === 0 ? (
        <EmptyState icon={<Calendar className="h-12 w-12"/>} title="No consultations yet" description="Set up your consultation packages and clients will be able to book and pay directly" action={<Button variant="terracotta" asChild><a href="/consultation-settings">Set Up Packages</a></Button>}/>
      ) : (
        <div className="space-y-4">
          {consultations.map((c:any) => (
            <Card key={c.id} className={cn(c.bookingStatus==="PENDING" && c.paymentStatus==="PAID" ? "border-amber-300 bg-amber-50/10" : "")}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold">{c.package?.title || "Consultation"}</p>
                      <Badge className={cn("text-[10px]", STATUS_STYLE[c.bookingStatus]||"")}>{c.bookingStatus}</Badge>
                      {c.paymentStatus === "PAID" && <Badge className="bg-emerald-50 text-emerald-700 text-[10px]">PAID</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">Client: <strong>{c.client?.firstName} {c.client?.lastName}</strong></p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{c.package?.duration} min</span>
                      <span className="font-medium text-foreground">{formatCurrency(c.designerAmount || 0)} (your share)</span>
                    </div>
                    {c.scheduledAt && <p className="text-xs mt-1 text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3"/>{formatDate(c.scheduledAt)}</p>}
                    {c.meetingLink  && <a href={c.meetingLink} target="_blank" className="text-xs mt-1 text-terracotta-500 hover:underline flex items-center gap-1"><Video className="h-3 w-3"/>Meeting Link Set</a>}
                  </div>
                </div>

                {/* Actions — only for PAID bookings */}
                {c.paymentStatus === "PAID" && c.bookingStatus !== "COMPLETED" && (
                  <div className="flex gap-2 mt-4 pt-4 border-t flex-wrap">
                    {c.bookingStatus === "PENDING" && (
                      <Button variant="terracotta" size="sm" onClick={()=>update(c.id,{bookingStatus:"CONFIRMED"})} disabled={acting===c.id} className="gap-1.5">
                        {acting===c.id?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<CheckCircle2 className="h-3.5 w-3.5"/>}Confirm Booking
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={()=>{setLinkModal(c.id);setMeetingLink(c.meetingLink||"");setScheduledAt(c.scheduledAt?new Date(c.scheduledAt).toISOString().slice(0,16):"");}} className="gap-1.5">
                      <LinkIcon className="h-3.5 w-3.5"/>{c.meetingLink ? "Update Meeting Link" : "Add Meeting Link"}
                    </Button>
                    {c.bookingStatus === "CONFIRMED" && (
                      <Button variant="outline" size="sm" onClick={()=>update(c.id,{bookingStatus:"COMPLETED"})} disabled={acting===c.id} className="gap-1.5 text-blue-600 border-blue-200">
                        {acting===c.id?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<CheckCircle2 className="h-3.5 w-3.5"/>}Mark Completed
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Meeting link + schedule modal */}
      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={()=>setLinkModal(null)}>
          <div className="bg-background rounded-2xl w-full max-w-md p-5 shadow-xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Set Meeting Details</h3>
              <button onClick={()=>setLinkModal(null)}><X className="h-5 w-5 text-muted-foreground"/></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Meeting Link (Zoom, Google Meet, etc.)</label>
                <input value={meetingLink} onChange={e=>setMeetingLink(e.target.value)} placeholder="https://meet.google.com/xxx-yyyy-zzz" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"/>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Scheduled Date & Time</label>
                <input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"/>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="terracotta" className="flex-1" onClick={()=>update(linkModal,{meetingLink,scheduledAt:scheduledAt||undefined})} disabled={acting===linkModal}>
                {acting===linkModal&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}Save & Notify Client
              </Button>
              <Button variant="outline" onClick={()=>setLinkModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
