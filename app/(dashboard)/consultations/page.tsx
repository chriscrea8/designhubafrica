"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Video, Phone, Home, ExternalLink, Clock, CheckCircle2, Calendar, Lock } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const TYPE_ICONS: Record<string,any> = { VIDEO: <Video className="h-4 w-4" />, PHONE: <Phone className="h-4 w-4" />, PHYSICAL: <Home className="h-4 w-4" /> };
const TYPE_LABELS: Record<string,string> = { VIDEO: "Video Call", PHONE: "Phone Call", PHYSICAL: "Site Visit" };

function ConsultationsContent() {
  const searchParams = useSearchParams();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    // If returning from Paystack, verify payment
    const ref = searchParams?.get("trxref") || searchParams?.get("reference");
    if (ref) {
      fetch(`/api/payments/verify?reference=${ref}`).then(() => setTimeout(load, 1500));
    }
  }, []);

  async function load() {
    const res = await fetch("/api/consultations");
    const json = await res.json();
    if (json.success) setConsultations(json.data || []);
    setLoading(false);
  }

  const statusColors: Record<string,string> = {
    PENDING: "bg-amber-50 text-amber-700",
    PAID: "bg-emerald-50 text-emerald-700",
    COMPLETED: "bg-blue-50 text-blue-700",
    CANCELLED: "bg-red-50 text-red-700",
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Consultations</h1><p className="text-sm text-muted-foreground mt-1">Your booked consultations. Meeting links unlock after payment.</p></div>

      {consultations.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="font-medium">No consultations yet</p>
          <p className="text-sm mt-1">Book a consultation from any designer's profile</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {consultations.map((c: any) => {
            const designer = c.designer?.user || {};
            const isPaid = ["PAID","COMPLETED"].includes(c.status);
            const meetingLink = isPaid ? (c.meetingLink || c.designer?.meetingLink) : null;
            return (
              <Card key={c.id}>
                <CardContent className="p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-terracotta-100 flex items-center justify-center text-terracotta-600">
                      {TYPE_ICONS[c.type] || <Video className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{TYPE_LABELS[c.type] || c.type} with {designer.firstName} {designer.lastName}</p>
                        <Badge className={cn("text-[10px]", statusColors[c.status] || "bg-gray-100")}>{c.status}</Badge>
                      </div>
                      {c.scheduledAt && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(c.scheduledAt)}</p>}
                      <p className="text-sm font-semibold mt-1">{formatCurrency(c.price)}</p>
                      {c.notes && <p className="text-xs text-muted-foreground mt-1">Note: {c.notes}</p>}

                      {/* Meeting link — only shown when PAID/COMPLETED */}
                      {isPaid && meetingLink ? (
                        <a href={meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-sm font-medium text-terracotta-500 hover:text-terracotta-600">
                          <ExternalLink className="h-3.5 w-3.5" />Join Meeting
                        </a>
                      ) : !isPaid ? (
                        <p className="flex items-center gap-1 mt-2 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Meeting link unlocks after payment</p>
                      ) : (
                        <p className="mt-2 text-xs text-muted-foreground">Meeting link not set by designer yet</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ConsultationsPage() {
  return <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>}><ConsultationsContent /></Suspense>;
}
