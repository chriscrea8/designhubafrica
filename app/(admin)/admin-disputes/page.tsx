"use client";
import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, DollarSign } from "lucide-react";
import { Card, CardContent, Button, Badge, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = { OPEN:"bg-red-50 text-red-700", INVESTIGATING:"bg-amber-50 text-amber-700", RESOLVED:"bg-emerald-50 text-emerald-700", CLOSED:"bg-gray-100 text-gray-600" };

export default function AdminDisputesPage() {
  const [disputes, setDisputes]  = useState<any[]>([]);
  const [loading,  setLoading]   = useState(true);
  const [filter,   setFilter]    = useState("OPEN");
  const [resolving,setResolving] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string,any>>({});

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    const p = filter !== "ALL" ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/disputes${p}`).then(r => r.json()).catch(() => ({}));
    if (res.success) setDisputes(res.data?.items || res.data || []);
    setLoading(false);
  }

  async function resolve(id: string) {
    const f = form[id] || {};
    if (!f.outcome) { alert("Please select an outcome"); return; }
    setResolving(id);
    const res = await fetch(`/api/disputes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome: f.outcome, status: "RESOLVED", adminNotes: f.adminNotes, refundAmount: f.refundAmount ? parseInt(f.refundAmount) : 0 }),
    });
    const json = await res.json();
    setResolving(null);
    if (json.success) { load(); setForm(prev => { const n = {...prev}; delete n[id]; return n; }); }
    else alert(json.error || "Failed");
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Dispute Resolution</h1><p className="text-sm text-muted-foreground mt-1">Review and resolve platform disputes</p></div>

      <div className="flex gap-2 flex-wrap">
        {["OPEN","INVESTIGATING","RESOLVED","ALL"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={cn("px-4 py-1.5 rounded-full text-sm font-medium border transition-all capitalize", filter === s ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border text-muted-foreground hover:border-foreground/40")}>
            {s.toLowerCase()}
          </button>
        ))}
      </div>

      {disputes.length === 0 ? (
        <EmptyState icon={<AlertTriangle className="h-12 w-12" />} title="No disputes" description={`No ${filter.toLowerCase()} disputes`} />
      ) : (
        <div className="space-y-4">
          {disputes.map((d: any) => (
            <Card key={d.id} className={d.status === "OPEN" ? "border-red-200" : ""}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={cn("text-[10px]", STATUS_STYLE[d.status] || "")}>{d.status}</Badge>
                      <span className="text-xs text-muted-foreground font-mono">#{d.id.slice(-8).toUpperCase()}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</span>
                    </div>
                    <p className="font-semibold mt-2">{d.reason}</p>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Filed by: <strong>{d.filer?.firstName} {d.filer?.lastName}</strong></span>
                      <span>Against: <strong>{d.target?.firstName} {d.target?.lastName}</strong></span>
                    </div>
                    {d.project && <p className="text-xs text-muted-foreground mt-1">Project: {d.project.title}</p>}
                  </div>
                </div>

                {d.evidence?.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/40 border">
                    <p className="text-xs font-semibold mb-1">Evidence</p>
                    <ul className="space-y-1">{d.evidence.map((e: string, i: number) => <li key={i} className="text-xs text-muted-foreground">{e}</li>)}</ul>
                  </div>
                )}

                {d.adminNotes && <div className="p-3 rounded-lg bg-blue-50 border border-blue-200"><p className="text-xs font-semibold text-blue-700 mb-1">Admin Notes</p><p className="text-xs text-blue-700">{d.adminNotes}</p></div>}

                {d.outcome && <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200"><p className="text-xs font-semibold text-emerald-700">Outcome: {d.outcome}</p>{d.refundAmount > 0 && <p className="text-xs text-emerald-700">Refund: {formatCurrency(d.refundAmount)}</p>}</div>}

                {d.status !== "RESOLVED" && d.status !== "CLOSED" && (
                  <div className="border-t pt-4 space-y-3">
                    <p className="text-sm font-semibold">Resolve Dispute</p>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <select value={form[d.id]?.outcome || ""} onChange={e => setForm(prev => ({...prev, [d.id]: {...(prev[d.id]||{}), outcome: e.target.value}}))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Select outcome…</option>
                        <option value="CLIENT_WIN">Client wins — full refund</option>
                        <option value="DESIGNER_WIN">Designer wins — funds released</option>
                        <option value="SPLIT">Split decision</option>
                        <option value="DISMISSED">Dismissed — no action</option>
                      </select>
                      <input type="number" placeholder="Refund amount (₦)" value={form[d.id]?.refundAmount || ""} onChange={e => setForm(prev => ({...prev, [d.id]: {...(prev[d.id]||{}), refundAmount: e.target.value}}))} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />
                      <Button variant="terracotta" size="sm" onClick={() => resolve(d.id)} disabled={resolving === d.id} className="gap-1.5">
                        {resolving === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}Resolve
                      </Button>
                    </div>
                    <textarea value={form[d.id]?.adminNotes || ""} onChange={e => setForm(prev => ({...prev, [d.id]: {...(prev[d.id]||{}), adminNotes: e.target.value}}))} placeholder="Admin notes (visible to both parties)…" rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
