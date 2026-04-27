"use client";
import React, { useEffect, useState } from "react";
import { Calendar, Clock, Video, Phone, MapPin, CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, EmptyState } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";

const typeIcons: any = { VIDEO: Video, PHONE: Phone, PHYSICAL: MapPin };
const statusColors: any = { PENDING: "bg-yellow-50 text-yellow-700", PAID: "bg-emerald-50 text-emerald-700", COMPLETED: "bg-blue-50 text-blue-700", CANCELLED: "bg-red-50 text-red-700" };

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch("/api/consultations").then(r => r.json()).then(res => { if (res.success) setConsultations(res.data || []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Consultations</h1>
      {consultations.length === 0 ? <EmptyState icon={<Calendar className="h-12 w-12" />} title="No consultations yet" description="Book a consultation with a designer from their profile" /> : (
        <div className="grid md:grid-cols-2 gap-4">{consultations.map(c => {
          const Icon = typeIcons[c.type] || Video;
          return (
            <Card key={c.id}><CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-terracotta-50 flex items-center justify-center"><Icon className="h-5 w-5 text-terracotta-500" /></div><div><h3 className="font-semibold">{c.designer?.user?.firstName} {c.designer?.user?.lastName}</h3><p className="text-xs text-muted-foreground">{c.type} Consultation</p></div></div>
                <Badge className={cn("text-[10px]", statusColors[c.status])}>{c.status}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm"><span className="font-bold">{formatCurrency(c.price)}</span>{c.scheduledAt && <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" />{new Date(c.scheduledAt).toLocaleDateString()}</span>}</div>
              {c.status === "PAID" && c.meetingLink && <a href={c.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-3 text-sm text-terracotta-500 font-medium"><ExternalLink className="h-4 w-4" />Join Meeting</a>}
              {c.status === "PENDING" && <p className="text-xs text-amber-600 mt-3">Awaiting payment confirmation</p>}
            </CardContent></Card>
          );
        })}</div>
      )}
    </div>
  );
}
