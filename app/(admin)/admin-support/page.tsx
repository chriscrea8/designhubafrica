"use client";
import React, { useEffect, useState } from "react";
import { MessageSquare, CheckCircle2, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { formatRelativeTime, cn } from "@/lib/utils";

const statusColors: any = { open: "bg-red-50 text-red-700", in_progress: "bg-amber-50 text-amber-700", resolved: "bg-emerald-50 text-emerald-700", closed: "bg-gray-100 text-gray-600" };
const priorityColors: any = { urgent: "bg-red-100 text-red-800", high: "bg-orange-50 text-orange-700", normal: "bg-blue-50 text-blue-700", low: "bg-gray-100 text-gray-600" };
const catLabels: any = { payment: "Payment", dispute: "Dispute", account: "Account", project: "Project", safety: "Safety", general: "General" };

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/support?status=${filter === "all" ? "" : filter}`).then(r => r.json()).then(res => { if (res.success) setTickets(res.data || []); setLoading(false); });
  }, [filter]);

  async function updateTicket(id: string, status: string, adminNotes?: string) {
    setUpdating(id);
    await fetch(`/api/support/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, adminNotes }) });
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    setUpdating(null);
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold">Support Tickets</h1><p className="text-sm text-muted-foreground">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</p></div>
      <div className="flex gap-2">{["open","in_progress","resolved","all"].map(s => <button key={s} onClick={() => setFilter(s)} className={cn("px-3 py-1.5 rounded-lg text-sm font-medium", filter === s ? "bg-terracotta-500 text-white" : "bg-muted text-muted-foreground hover:bg-accent")}>{s.replace("_"," ")}</button>)}</div>
      {tickets.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">No {filter !== "all" ? filter : ""} tickets</CardContent></Card>
      : <div className="space-y-3">{tickets.map(t => (
        <Card key={t.id}><CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn("text-[10px]", statusColors[t.status])}>{t.status.replace("_"," ")}</Badge>
                <Badge className={cn("text-[10px]", priorityColors[t.priority])}>{t.priority}</Badge>
                <Badge variant="secondary" className="text-[10px]">{catLabels[t.category] || t.category}</Badge>
                <span className="text-xs text-muted-foreground">#{t.id.slice(-8).toUpperCase()}</span>
              </div>
              <p className="text-sm mt-2 whitespace-pre-wrap">{t.message}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span>{t.user?.firstName} {t.user?.lastName} ({t.user?.email})</span>
                <span>•</span><span className="capitalize">{t.user?.role?.toLowerCase()}</span>
                <span>•</span><span>{formatRelativeTime(t.createdAt)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {t.status === "open" && <Button variant="outline" size="sm" onClick={() => updateTicket(t.id, "in_progress")} disabled={updating === t.id}>{updating === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />} Claim</Button>}
              {t.status === "in_progress" && <Button variant="terracotta" size="sm" onClick={() => updateTicket(t.id, "resolved")} disabled={updating === t.id}><CheckCircle2 className="h-3 w-3" /> Resolve</Button>}
            </div>
          </div>
        </CardContent></Card>
      ))}</div>}
    </div>
  );
}
