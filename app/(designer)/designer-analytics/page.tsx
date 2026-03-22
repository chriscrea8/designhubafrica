"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { Eye, TrendingUp, FileText, DollarSign, Users, Star, BarChart3, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Progress } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency, cn } from "@/lib/utils";

export default function DesignerAnalyticsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Analytics</h1><p className="text-sm text-muted-foreground mt-1">Track your performance and grow your practice</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Profile Views" value="1,247" change={23} changeLabel="vs last month" icon={<Eye className="h-5 w-5" />} />
        <StatsCard title="Proposal Win Rate" value="42%" change={8} changeLabel="vs last month" icon={<TrendingUp className="h-5 w-5" />} />
        <StatsCard title="Revenue (30d)" value={formatCurrency(2185000)} change={18} icon={<DollarSign className="h-5 w-5" />} />
        <StatsCard title="Avg Response Time" value="2.4h" change={-15} changeLabel="faster" icon={<Star className="h-5 w-5" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />Revenue (Last 6 Months)</CardTitle></CardHeader><CardContent>
          <div className="space-y-3">{[{ month: "Mar", amount: 2185000 }, { month: "Feb", amount: 1850000 }, { month: "Jan", amount: 1425000 }, { month: "Dec", amount: 2100000 }, { month: "Nov", amount: 1680000 }, { month: "Oct", amount: 1200000 }].map(m => (
            <div key={m.month} className="flex items-center gap-3"><span className="text-xs font-medium w-8">{m.month}</span><div className="flex-1 bg-muted rounded-full h-6 overflow-hidden"><div className="h-full bg-terracotta-500 rounded-full flex items-center justify-end px-2" style={{width: `${(m.amount / 2500000) * 100}%`}}><span className="text-[10px] text-white font-medium">{formatCurrency(m.amount)}</span></div></div></div>
          ))}</div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" />Client Locations</CardTitle></CardHeader><CardContent>
          <div className="space-y-3">{[{ city: "Lagos", count: 12, pct: 45 }, { city: "Abuja", count: 6, pct: 23 }, { city: "Accra", count: 4, pct: 15 }, { city: "Nairobi", count: 3, pct: 11 }, { city: "Other", count: 2, pct: 6 }].map(c => (
            <div key={c.city}><div className="flex justify-between text-xs mb-1"><span className="font-medium">{c.city}</span><span className="text-muted-foreground">{c.count} clients ({c.pct}%)</span></div><Progress value={c.pct} className="h-2" /></div>
          ))}</div>
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Proposal Stats</CardTitle></CardHeader><CardContent className="space-y-4">
          {[{ label: "Proposals Sent", value: 24 }, { label: "Accepted", value: 10 }, { label: "Declined", value: 5 }, { label: "Pending", value: 3 }, { label: "Expired", value: 6 }].map(s => (
            <div key={s.label} className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{s.label}</span><span className="text-sm font-bold">{s.value}</span></div>
          ))}
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4" />Rating Breakdown</CardTitle></CardHeader><CardContent className="space-y-3">
          {[{ stars: 5, count: 89, pct: 70 }, { stars: 4, count: 28, pct: 22 }, { stars: 3, count: 7, pct: 6 }, { stars: 2, count: 2, pct: 1.5 }, { stars: 1, count: 1, pct: 0.5 }].map(r => (
            <div key={r.stars} className="flex items-center gap-3"><div className="flex items-center gap-0.5 w-16">{Array.from({length:5}).map((_,i) => <Star key={i} className={cn("h-3 w-3", i < r.stars ? "fill-amber-400 text-amber-400" : "text-gray-200")} />)}</div><Progress value={r.pct} className="h-2 flex-1" /><span className="text-xs text-muted-foreground w-8 text-right">{r.count}</span></div>
          ))}
        </CardContent></Card>
      </div>
    </div>
  );
}
