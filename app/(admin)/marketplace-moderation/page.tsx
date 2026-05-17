"use client";
import React, { useEffect, useState } from "react";
import { Users, UserCheck, Store, DollarSign, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency } from "@/lib/utils";

export default function Page() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    fetch("/api/admin/analytics").then(r => r.json()).then(res => { if (res.success) setStats(res.data); });
  }, []);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Users" value={stats?.users || 0} change={18} changeLabel="this month" icon={<Users className="h-5 w-5" />} />
        <StatsCard title="Designers" value={stats?.designers || 0} icon={<UserCheck className="h-5 w-5" />} />
        <StatsCard title="Vendors" value={stats?.vendors || 0} icon={<Store className="h-5 w-5" />} />
        <StatsCard title="Revenue" value={formatCurrency(stats?.revenueThisMonth || 0)} icon={<DollarSign className="h-5 w-5" />} />
      </div>
      <Card><CardHeader><CardTitle>Management</CardTitle></CardHeader><CardContent>
        <p className="text-sm text-muted-foreground">Admin management features. Use the sidebar to navigate between sections.</p>
      </CardContent></Card>
    </div>
  );
}
