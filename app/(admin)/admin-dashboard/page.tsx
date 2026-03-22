"use client";
import React, { useEffect, useState } from "react";
import { Users, UserCheck, Store, DollarSign, FolderKanban, ShoppingBag, AlertTriangle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics").then(r => r.json()).then(res => {
      if (res.success) setStats(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value={stats?.users || 0} change={18} changeLabel="this month" icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Designers" value={stats?.designers || 0} icon={<UserCheck className="h-5 w-5" />} />
        <StatsCard title="Vendors" value={stats?.vendors || 0} icon={<Store className="h-5 w-5" />} />
        <StatsCard title="Revenue (Month)" value={formatCurrency(stats?.revenueThisMonth || 0)} icon={<DollarSign className="h-5 w-5" />} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-base">Platform Overview</CardTitle></CardHeader><CardContent className="space-y-3">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Projects</span><span className="font-medium">{stats?.projects || 0}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Orders</span><span className="font-medium">{stats?.orders || 0}</span></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-3">
          {[{ label: "Approvals", href: "/designer-approvals" }, { label: "Products", href: "/marketplace-moderation" }, { label: "Disputes", href: "/disputes" }, { label: "Financial", href: "/escrow" }].map(a => (
            <a key={a.href} href={a.href} className="flex items-center justify-center p-3 rounded-lg border hover:bg-accent/50 text-sm font-medium transition-colors">{a.label}</a>
          ))}
        </CardContent></Card>
      </div>
    </div>
  );
}
