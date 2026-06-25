"use client";
import React, { useEffect, useState } from "react";
import { BarChart3, Eye, Heart, MessageSquare, FileText, Send, CheckCircle2, TrendingUp, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";

const SOURCE_LABELS: Record<string,string> = {
  PRODUCT_VIEW:"Product View", PRODUCT_SAVE:"Product Save", STORE_VISIT:"Store Visit",
  PRODUCT_INQUIRY:"Inquiry", RFQ_SUBMITTED:"RFQ", QUOTE_ACCEPTED:"Quote Accepted",
};

export default function VendorAnalyticsPage() {
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/marketplace/analytics").then(r=>r.json()).then(res => {
      if (res.success) setData(res.data);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Store Analytics</h1><p className="text-sm text-muted-foreground mt-1">Performance metrics for your store and products</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label:"Products", value: data.productCount, icon: <Package className="h-5 w-5"/>, color:"bg-blue-50 text-blue-600" },
          { label:"Saved by Buyers", value: data.savedCount, icon: <Heart className="h-5 w-5"/>, color:"bg-red-50 text-red-600" },
          { label:"Inquiries", value: data.inquiryCount, icon: <MessageSquare className="h-5 w-5"/>, color:"bg-amber-50 text-amber-600" },
          { label:"RFQs Received", value: data.rfqCount, icon: <FileText className="h-5 w-5"/>, color:"bg-purple-50 text-purple-600" },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-5 flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", s.color)}>{s.icon}</div>
            <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-2xl font-bold">{s.value}</p></div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-terracotta-500 to-terracotta-600 border-0 text-white">
          <CardContent className="p-5">
            <p className="text-white/70 text-xs mb-1">Quotes Sent</p>
            <p className="text-3xl font-bold">{data.quoteCount}</p>
          </CardContent>
        </Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground mb-1">Quotes Accepted</p>
          <p className="text-3xl font-bold">{data.acceptedQuotes}</p>
        </CardContent></Card>
        <Card className={cn(data.acceptanceRate >= 50 ? "bg-emerald-50 border-emerald-200" : "")}>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-1">Acceptance Rate</p>
            <p className="text-3xl font-bold">{data.acceptanceRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent leads */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Leads</CardTitle></CardHeader>
        <CardContent className="p-0">
          {(!data.leads || data.leads.length === 0) ? (
            <p className="text-center text-muted-foreground py-8">No leads yet</p>
          ) : data.leads.map((lead: any) => (
            <div key={lead.id} className="flex items-center gap-4 px-5 py-3 border-b last:border-0">
              <div className="h-8 w-8 rounded-full bg-terracotta-100 flex items-center justify-center text-xs font-bold text-terracotta-600 shrink-0">
                {lead.sourceType?.[0]}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{SOURCE_LABELS[lead.sourceType] || lead.sourceType}</p>
                <p className="text-xs text-muted-foreground">{lead.product?.name || lead.rfq?.title || "—"}</p>
              </div>
              <span className="text-xs text-muted-foreground">{formatDate(lead.createdAt)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
