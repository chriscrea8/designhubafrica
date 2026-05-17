"use client";
import React, { useState, useEffect } from "react";
import { Eye, TrendingUp, FileText, DollarSign, Star, BarChart3, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Progress } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency } from "@/lib/utils";

export default function DesignerAnalyticsPage() {
  const [badges, setBadges] = useState<any>(null);
  useEffect(() => { fetch("/api/badges").then(r => r.json()).then(res => { if (res.success) setBadges(res.data); }); }, []);
  const p = badges?.profile || {};

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Analytics</h1><p className="text-sm text-muted-foreground mt-1">Track your performance</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Completion Rate" value={`${Math.round((p.completionRate || 0) * 100)}%`} icon={<TrendingUp className="h-5 w-5" />} />
        <StatsCard title="Total Projects" value={p.projectCount || 0} icon={<FileText className="h-5 w-5" />} />
        <StatsCard title="Avg Rating" value={p.avgRating || 0} icon={<Star className="h-5 w-5" />} />
        <StatsCard title="Total Reviews" value={p.totalReviews || 0} icon={<Eye className="h-5 w-5" />} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-base">Rating Breakdown</CardTitle></CardHeader><CardContent className="space-y-3">
          {[5,4,3,2,1].map(s => <div key={s} className="flex items-center gap-3"><span className="text-xs w-8">{s} star</span><Progress value={s === 5 ? 70 : s === 4 ? 20 : 5} className="h-2 flex-1" /><span className="text-xs text-muted-foreground w-6">{s === 5 ? p.totalReviews || 0 : 0}</span></div>)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Badges Earned</CardTitle></CardHeader><CardContent>
          {badges?.badges ? <div className="space-y-2">{badges.badges.map((b: any) => <div key={b.id} className="flex items-center justify-between text-sm"><span>{b.name}</span><span className={b.earned ? "text-emerald-600 font-medium" : "text-muted-foreground"}>{ b.earned ? "✓ Earned" : "Locked"}</span></div>)}</div> : <p className="text-sm text-muted-foreground">Loading...</p>}
        </CardContent></Card>
      </div>
    </div>
  );
}
