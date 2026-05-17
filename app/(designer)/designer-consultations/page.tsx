"use client";
import React, { useEffect, useState } from "react";
import { Calendar, Video, Phone, MapPin, CheckCircle2, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, EmptyState, Separator } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, React.ElementType> = { VIDEO: Video, PHONE: Phone, PHYSICAL: MapPin };
const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700",
  PAID: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-red-50 text-red-700",
};

export default function DesignerConsultationsPage() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/consultations").then(r => r.json()).then(res => {
      if (res.success) setConsultations(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function markComplete(id: string) {
    await fetch(`/api/consultations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "COMPLETED" }) });
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, status: "COMPLETED" } : c));
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  const paid = consultations.filter(c => ["PAID","COMPLETED"].includes(c.status));
  const pending = consultations.filter(c => c.status === "PENDING");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Consultations</h1><p className="text-sm text-muted-foreground mt-1">{paid.length} paid · {pending.length} pending</p></div>
        <Button variant="outline" size="sm" asChild><a href="/consultation-settings">Manage Availability</a></Button>
      </div>

      {consultations.length === 0 ? (
        <EmptyState icon={<Calendar className="h-12 w-12" />} title="No consultations yet" description="Set up your availability and pricing so clients can book sessions" action={<Button variant="terracotta" asChild><a href="/consultation-settings">Set Up Availability</a></Button>} />
      ) : (
        <div className="space-y-4">
          {consultations.map(c => {
            const Icon = TYPE_ICONS[c.type] || Video;
            return (
              <Card key={c.id}><CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-terracotta-50 flex items-center justify-center shrink-0"><Icon className="h-5 w-5 text-terracotta-500" /></div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{c.type} Consultation</h3>
                        <Badge className={cn("text-[10px]", STATUS_STYLES[c.status])}>{c.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><User className="h-3 w-3" />{c.client?.firstName} {c.client?.lastName} · {c.client?.email}</p>
                      {c.scheduledAt && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(c.scheduledAt).toLocaleString("en-GB", { weekday:"short", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}</p>}
                      {c.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{c.notes}"</p>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">{formatCurrency(c.price)}</p>
                    <p className="text-xs text-muted-foreground">→ {formatCurrency(Math.round(c.price * 0.9))} after commission</p>
                    {c.status === "PAID" && <Button variant="outline" size="sm" className="mt-2" onClick={() => markComplete(c.id)}>Mark Complete</Button>}
                  </div>
                </div>
              </CardContent></Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
