"use client";
import React, { useEffect, useState } from "react";
import { DollarSign, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = { successful:"bg-emerald-50 text-emerald-700", pending:"bg-amber-50 text-amber-700", failed:"bg-red-50 text-red-700" };

export default function DesignerEarningsPage() {
  const [txns, setTxns]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/transactions?limit=50").then(r=>r.json()).then(res=>{
      if (res.success) setTxns(res.data?.items||[]);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  const successful = txns.filter(t=>t.status==="successful");
  const totalGross = successful.reduce((s,t)=>s+t.grossAmount,0);
  const totalNet   = successful.reduce((s,t)=>s+t.netAmount,0);
  const pending    = txns.filter(t=>t.status==="pending").reduce((s,t)=>s+t.grossAmount,0);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Earnings</h1><p className="text-sm text-muted-foreground mt-1">Payments processed via Paystack — settled directly to your bank account</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-terracotta-500 to-terracotta-600 border-0 text-white"><CardContent className="p-5"><p className="text-white/70 text-xs mb-1">Total Earned (Net)</p><p className="text-2xl font-bold">{formatCurrency(totalNet)}</p></CardContent></Card>
        <StatsCard title="Gross Revenue" value={formatCurrency(totalGross)} icon={<TrendingUp className="h-5 w-5"/>}/>
        <StatsCard title="Pending" value={formatCurrency(pending)} icon={<Clock className="h-5 w-5"/>}/>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Transaction History</CardTitle></CardHeader>
        <CardContent className="p-0">
          {txns.length===0 ? <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          : txns.map(t=>(
            <div key={t.id} className="flex items-center gap-4 px-5 py-4 border-b last:border-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm capitalize">{t.type.replace(/_/g," ")}</p>
                <p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold">{formatCurrency(t.grossAmount)}</p>
                <p className="text-xs text-muted-foreground">Net: {formatCurrency(t.netAmount)}</p>
                <Badge className={cn("text-[10px] mt-1", STATUS_STYLE[t.status]||"")}>{t.status}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
