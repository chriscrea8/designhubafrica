"use client";
import React, { useEffect, useState } from "react";
import { Zap, Crown, BarChart3, DollarSign, CheckCircle2, XCircle, Loader2, Eye, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

export default function PromotionCenterPage() {
  const [data,   setData]   = useState<any>(null);
  const [loading,setLoading]= useState(true);
  const [acting, setActing] = useState<string|null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/admin/promotions").then(r=>r.json()).catch(()=>({}));
    if (res.success) setData(res.data);
    setLoading(false);
  }

  async function reviewAd(adId: string, action: "approve"|"reject", reason?: string) {
    setActing(adId);
    await fetch("/api/admin/promotions", { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ adId, action, reason: reason||null }) });
    setActing(null);
    load();
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-terracotta-500"/></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Promotion Center</h1><p className="text-sm text-muted-foreground mt-1">Manage boosts, featured stores, ads and promotion revenue</p></div>

      {/* Revenue metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Total Revenue",    value: formatCurrency(data?.totalRevenue||0),   icon:<DollarSign className="h-5 w-5"/>,  color:"bg-gradient-to-br from-terracotta-500 to-terracotta-600 text-white border-0" },
          { label:"Monthly Revenue",  value: formatCurrency(data?.monthlyRevenue||0), icon:<TrendingUp className="h-5 w-5"/>,  color:"bg-emerald-50 text-emerald-600" },
          { label:"Active Boosts",    value: data?.activeBoosts || 0,                 icon:<Zap className="h-5 w-5"/>,         color:"bg-amber-50 text-amber-600" },
          { label:"Featured Stores",  value: data?.featuredStores || 0,               icon:<Crown className="h-5 w-5"/>,       color:"bg-purple-50 text-purple-600" },
        ].map(s=>(
          <Card key={s.label} className={s.color.includes("gradient") ? "" : ""}><CardContent className={cn("p-4 flex items-center gap-3", s.color.includes("gradient") && s.color)}>
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", !s.color.includes("gradient") && s.color)}>{s.icon}</div>
            <div><p className={cn("text-xs", s.color.includes("gradient") ? "text-white/70" : "text-muted-foreground")}>{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      {/* Pending ad approvals */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4"/>Pending Ad Approvals ({data?.pendingAds?.length || 0})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {(!data?.pendingAds || data.pendingAds.length === 0) ? (
            <p className="text-center text-muted-foreground py-8">No pending ads</p>
          ) : data.pendingAds.map((ad: any) => (
            <div key={ad.id} className="flex items-start gap-4 px-5 py-4 border-b last:border-0 flex-wrap">
              {ad.imageUrl && <img src={ad.imageUrl} alt="" className="h-16 w-24 rounded-lg object-cover shrink-0 border"/>}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{ad.slot?.name || "Ad Slot"}</p>
                <p className="text-xs text-muted-foreground">by {ad.vendor?.user?.firstName} {ad.vendor?.user?.lastName}</p>
                {ad.headline && <p className="text-xs mt-1">{ad.headline}</p>}
                {ad.linkUrl && <a href={ad.linkUrl} target="_blank" className="text-xs text-terracotta-500 hover:underline">{ad.linkUrl}</a>}
                <p className="text-xs text-muted-foreground mt-1">{formatDate(ad.createdAt)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="terracotta" onClick={()=>reviewAd(ad.id,"approve")} disabled={acting===ad.id} className="gap-1.5">
                  {acting===ad.id?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<CheckCircle2 className="h-3.5 w-3.5"/>}Approve
                </Button>
                <Button size="sm" variant="outline" onClick={()=>reviewAd(ad.id,"reject","Does not meet guidelines")} disabled={acting===ad.id} className="gap-1.5 text-red-500 border-red-200">
                  <XCircle className="h-3.5 w-3.5"/>Reject
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
