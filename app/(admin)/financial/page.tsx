"use client";
import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Users, RefreshCw, Settings, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

export default function AdminFinancialPage() {
  const [txns,       setTxns]       = useState<any[]>([]);
  const [config,     setConfig]     = useState<any>(null);
  const [editConfig, setEditConfig] = useState(false);
  const [rates,      setRates]      = useState({ consultationRate:"0.20", projectRate:"0.10", promotionRate:"0.15" });
  const [saving,     setSaving]     = useState(false);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/transactions?all=true&limit=50").then(r=>r.json()).catch(()=>({})),
      fetch("/api/admin/commission").then(r=>r.json()).catch(()=>({})),
    ]).then(([t, c]) => {
      if (t.success) setTxns(t.data?.items||[]);
      if (c.success) {
        setConfig(c.data);
        setRates({ consultationRate: String(c.data.consultationRate), projectRate: String(c.data.projectRate), promotionRate: String(c.data.promotionRate) });
      }
      setLoading(false);
    });
  }, []);

  const successful = txns.filter(t=>t.status==="successful");
  const totalRevenue = successful.reduce((s,t)=>s+t.grossAmount, 0);
  const totalCommission = successful.reduce((s,t)=>s+t.platformFee, 0);

  async function saveRates() {
    setSaving(true);
    const res = await fetch("/api/admin/commission", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ consultationRate: parseFloat(rates.consultationRate), projectRate: parseFloat(rates.projectRate), promotionRate: parseFloat(rates.promotionRate) }) });
    const json = await res.json();
    setSaving(false);
    if (json.success) { setConfig(json.data); setEditConfig(false); }
  }

  const STATUS_STYLE: Record<string,string> = { successful:"bg-emerald-50 text-emerald-700", pending:"bg-amber-50 text-amber-700", failed:"bg-red-50 text-red-700", refunded:"bg-gray-100 text-gray-600" };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Payment Dashboard</h1><p className="text-sm text-muted-foreground mt-1">All transactions processed through Paystack</p></div>
        <Button variant="outline" onClick={()=>setEditConfig(!editConfig)} className="gap-2"><Settings className="h-4 w-4"/>Commission Rates</Button>
      </div>

      {editConfig && <Card className="border-terracotta-200"><CardContent className="p-5 space-y-4">
        <h3 className="font-semibold">Configure Commission Rates</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[["Consultation",rates.consultationRate,"consultationRate"],["Project Milestone",rates.projectRate,"projectRate"],["Promotions",rates.promotionRate,"promotionRate"]].map(([label, val, key])=>(
            <div key={key}><label className="text-sm font-medium mb-1.5 block">{label} Rate</label>
              <div className="relative"><input type="number" step="0.01" min="0" max="1" value={val} onChange={e=>setRates({...rates,[key]:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 pr-8 text-sm"/><span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">({(parseFloat(val as string)*100).toFixed(0)}%)</span></div>
            </div>
          ))}
        </div>
        <div className="flex gap-2"><Button variant="terracotta" onClick={saveRates} disabled={saving} className="gap-2">{saving&&<Loader2 className="h-4 w-4 animate-spin"/>}Save Rates</Button><Button variant="outline" onClick={()=>setEditConfig(false)}>Cancel</Button></div>
      </CardContent></Card>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-terracotta-500 to-terracotta-600 border-0 text-white"><CardContent className="p-5"><p className="text-white/70 text-xs mb-1">Total Revenue (GMV)</p><p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p></CardContent></Card>
        <StatsCard title="Platform Commission" value={formatCurrency(totalCommission)} icon={<DollarSign className="h-5 w-5"/>}/>
        <StatsCard title="Transactions" value={successful.length} icon={<TrendingUp className="h-5 w-5"/>}/>
        <StatsCard title="Commission Rate" value={`${((config?.projectRate||0.10)*100).toFixed(0)}% project`} icon={<Settings className="h-5 w-5"/>}/>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">All Transactions</CardTitle></CardHeader>
        <CardContent className="p-0">
          {txns.length===0 ? <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          : txns.map(t=>(
            <div key={t.id} className="flex items-center gap-4 px-5 py-4 border-b last:border-0 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium capitalize">{t.type.replace(/_/g," ")}</p>
                <p className="text-xs text-muted-foreground">{t.user?.firstName} {t.user?.lastName} · {formatDate(t.createdAt)}</p>
                {t.providerReference && <p className="text-xs text-muted-foreground font-mono mt-0.5">{t.providerReference.slice(-12)}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold">{formatCurrency(t.grossAmount)}</p>
                <p className="text-xs text-muted-foreground">Fee: {formatCurrency(t.platformFee)}</p>
                <Badge className={cn("text-[10px] mt-1",STATUS_STYLE[t.status]||"")}>{t.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
