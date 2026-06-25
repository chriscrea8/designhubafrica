"use client";
import React, { useEffect, useState } from "react";
import { FileText, Send, Clock, CheckCircle2, Loader2, ChevronRight, DollarSign } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = {
  SUBMITTED:"bg-blue-50 text-blue-700", QUOTED:"bg-amber-50 text-amber-700",
  ACCEPTED:"bg-emerald-50 text-emerald-700",
};

export default function VendorRFQsPage() {
  const [rfqs,      setRFQs]      = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("open");
  const [quoting,   setQuoting]   = useState<string|null>(null);
  const [form,      setForm]      = useState({ message:"", estimatedPriceMin:"", estimatedPriceMax:"", estimatedDelivery:"", validUntil:"" });
  const [saving,    setSaving]    = useState(false);

  useEffect(() => { load(); }, [tab]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/vendor-rfqs?tab=${tab}`).then(r=>r.json()).catch(()=>({}));
    if (res.success) setRFQs(res.data?.items || []);
    setLoading(false);
  }

  async function submitQuote(rfqId: string) {
    if (!form.message) return;
    setSaving(true);
    const res = await fetch(`/api/rfq/${rfqId}/quotes`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ ...form, estimatedPriceMin: form.estimatedPriceMin ? parseFloat(form.estimatedPriceMin) : null, estimatedPriceMax: form.estimatedPriceMax ? parseFloat(form.estimatedPriceMax) : null }) });
    setSaving(false);
    if (res.ok) { setQuoting(null); setForm({ message:"", estimatedPriceMin:"", estimatedPriceMax:"", estimatedDelivery:"", validUntil:"" }); load(); }
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">RFQ Requests</h1><p className="text-sm text-muted-foreground mt-1">Respond to buyer quote requests and win business</p></div>

      <div className="flex gap-2">
        {[{v:"open",l:"Open RFQs"},{v:"mine",l:"My Quotes"},{v:"quoted",l:"All Quoted"}].map(t=>(
          <button key={t.v} onClick={()=>setTab(t.v)} className={cn("px-4 py-1.5 rounded-full text-sm font-medium border transition-all", tab===t.v?"bg-terracotta-500 text-white border-terracotta-500":"border-border text-muted-foreground hover:border-foreground/40")}>{t.l}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-terracotta-500"/></div>
      : rfqs.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
          <p className="font-semibold">No {tab === "open" ? "open" : ""} RFQs</p>
          <p className="text-sm text-muted-foreground mt-1">{tab === "open" ? "New buyer requests will appear here" : "Respond to open RFQs to see quotes here"}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rfqs.map((r:any) => (
            <Card key={r.id} className={cn(tab==="open" && "border-blue-200 hover:border-terracotta-300 transition-colors")}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold">{r.title}</p>
                      <Badge className={cn("text-[10px]", STATUS_STYLE[r.status]||"")}>{r.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                    <div className="flex gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="font-mono">{r.rfqNumber}</span>
                      {r.budgetMin && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3"/>{formatCurrency(r.budgetMin)}{r.budgetMax && `–${formatCurrency(r.budgetMax)}`}</span>}
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{formatDate(r.createdAt)}</span>
                      <span>{r._count?.quotes || 0} quotes received</span>
                    </div>
                  </div>
                  {tab === "open" && quoting !== r.id && (
                    <Button variant="terracotta" size="sm" onClick={() => { setQuoting(r.id); setForm({ message:"", estimatedPriceMin:"", estimatedPriceMax:"", estimatedDelivery:"", validUntil:"" }); }} className="gap-1.5 shrink-0">
                      <Send className="h-3.5 w-3.5"/>Submit Quote
                    </Button>
                  )}
                </div>

                {/* Quote form */}
                {quoting === r.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <h4 className="font-semibold text-sm">Your Quote</h4>
                    <textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe what you can offer, timeline, and any conditions…"/>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div><label className="text-xs font-medium mb-1 block">Min Price (₦)</label><input type="number" value={form.estimatedPriceMin} onChange={e=>setForm({...form,estimatedPriceMin:e.target.value})} placeholder="500000" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"/></div>
                      <div><label className="text-xs font-medium mb-1 block">Max Price (₦)</label><input type="number" value={form.estimatedPriceMax} onChange={e=>setForm({...form,estimatedPriceMax:e.target.value})} placeholder="800000" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"/></div>
                      <div><label className="text-xs font-medium mb-1 block">Delivery Time</label><input value={form.estimatedDelivery} onChange={e=>setForm({...form,estimatedDelivery:e.target.value})} placeholder="e.g. 2 weeks" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"/></div>
                    </div>
                    <div><label className="text-xs font-medium mb-1 block">Valid Until</label><input type="date" value={form.validUntil} onChange={e=>setForm({...form,validUntil:e.target.value})} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm max-w-xs"/></div>
                    <div className="flex gap-2">
                      <Button variant="terracotta" size="sm" onClick={() => submitQuote(r.id)} disabled={saving||!form.message} className="gap-1.5">
                        {saving&&<Loader2 className="h-3.5 w-3.5 animate-spin"/>}<Send className="h-3.5 w-3.5"/>Send Quote
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setQuoting(null)}>Cancel</Button>
                    </div>
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
