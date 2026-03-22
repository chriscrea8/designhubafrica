"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DollarSign, FolderKanban, Eye, Star, FileText, ArrowRight, Bell, Award, Shield, Zap, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Progress } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency, formatRelativeTime, cn } from "@/lib/utils";
import Link from "next/link";

export default function DesignerDashboardPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<any>({ items: [], unread: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notifications").then(r => r.json()).then(res => {
      if (res.success) setNotifications(res.data || { items: [], unread: 0 });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Badges are fetched from /api/badges — hardcoded fallback for now
  const badges = [
    { name: "Verified Designer", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600 border-emerald-200", earned: true },
    { name: "Top Rated", icon: Star, color: "bg-amber-50 text-amber-600 border-amber-200", earned: true },
    { name: "Fast Responder", icon: Zap, color: "bg-blue-50 text-blue-600 border-blue-200", earned: true },
    { name: "Elite Pro", icon: Award, color: "bg-purple-50 text-purple-600 border-purple-200", earned: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Welcome, {session?.user?.firstName || "Designer"}!</h1><p className="text-sm text-muted-foreground mt-1">Here is your practice overview</p></div>
        <Button variant="terracotta" size="sm" asChild><Link href="/find-projects" className="gap-2"><FileText className="h-4 w-4" />Find Projects</Link></Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Monthly Earnings" value={formatCurrency(2185000)} change={18} changeLabel="vs last month" icon={<DollarSign className="h-5 w-5" />} />
        <StatsCard title="Active Projects" value="2" icon={<FolderKanban className="h-5 w-5" />} />
        <StatsCard title="Profile Views" value="1,247" change={23} icon={<Eye className="h-5 w-5" />} />
        <StatsCard title="Avg Rating" value="4.9" icon={<Star className="h-5 w-5" />} />
      </div>

      {/* Trust Badges */}
      <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4" />Trust Badges</CardTitle></CardHeader><CardContent>
        <div className="flex flex-wrap gap-3">{badges.map(b => (
          <div key={b.name} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium", b.earned ? b.color : "bg-muted/50 text-muted-foreground border-border opacity-50")}>
            <b.icon className="h-4 w-4" />{b.name}
            {!b.earned && <span className="text-[10px]">(Locked)</span>}
          </div>
        ))}</div>
      </CardContent></Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Notifications */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Recent Activity</h2><Link href="/client-messages" className="text-xs text-terracotta-500 hover:underline">View all</Link></div>
          <Card><CardContent className="p-0">
            {notifications.items?.length > 0 ? notifications.items.slice(0, 6).map((n: any) => (
              <Link key={n.id} href={n.link || "#"} className="flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-accent/30">
                <div className="h-8 w-8 rounded-full bg-terracotta-50 flex items-center justify-center shrink-0 mt-0.5"><Bell className="h-4 w-4 text-terracotta-500" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium line-clamp-1">{n.title}</p><p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p><p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p></div>
                {!n.isRead && <div className="h-2 w-2 rounded-full bg-terracotta-500 shrink-0 mt-2" />}
              </Link>
            )) : <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet</div>}
          </CardContent></Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <Card><CardContent className="p-4 grid grid-cols-2 gap-3">
            {[{ label: "Portfolio", href: "/portfolio", icon: Eye }, { label: "Proposals", href: "/proposals", icon: FileText }, { label: "Earnings", href: "/earnings", icon: DollarSign }, { label: "Analytics", href: "/designer-analytics", icon: Star }, { label: "Verification", href: "/designer-verification", icon: Shield }, { label: "Messages", href: "/client-messages", icon: Bell }].map(a => (
              <Link key={a.href} href={a.href} className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors"><a.icon className="h-5 w-5 text-terracotta-500" /><span className="text-xs font-medium text-center">{a.label}</span></Link>
            ))}
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
