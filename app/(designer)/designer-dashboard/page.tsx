"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { DollarSign, FolderKanban, Eye, Star, FileText, Bell, Award, CheckCircle2, Zap, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency, formatRelativeTime, cn } from "@/lib/utils";
import Link from "next/link";

export default function DesignerDashboardPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<any>({ items: [], unread: 0 });
  const [badges, setBadges] = useState<any[]>([]);
  const [stats, setStats] = useState({ earnings: 0, projects: 0, proposals: 0, rating: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/notifications").then(r => r.json()),
      fetch("/api/badges").then(r => r.json()),
    ]).then(([notifRes, badgeRes]) => {
      if (notifRes.success) setNotifications(notifRes.data || { items: [], unread: 0 });
      if (badgeRes.success) {
        setBadges(badgeRes.data?.badges || []);
        const p = badgeRes.data?.profile;
        if (p) setStats({ earnings: 0, projects: p.projectCount || 0, proposals: 0, rating: p.avgRating || 0 });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const earnedBadges = badges.filter(b => b.earned);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Welcome, {session?.user?.firstName || "Designer"}!</h1><p className="text-sm text-muted-foreground mt-1">Here is your practice overview</p></div>
        <Button variant="terracotta" size="sm" asChild><Link href="/find-projects" className="gap-2"><Search className="h-4 w-4" />Find Projects</Link></Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Projects" value={stats.projects} icon={<FolderKanban className="h-5 w-5" />} />
        <StatsCard title="Avg Rating" value={stats.rating || "—"} icon={<Star className="h-5 w-5" />} />
        <StatsCard title="Unread" value={notifications.unread} icon={<Bell className="h-5 w-5" />} />
        <StatsCard title="Badges" value={earnedBadges.length} icon={<Award className="h-5 w-5" />} />
      </div>

      {earnedBadges.length > 0 && <Card><CardContent className="p-4"><div className="flex flex-wrap gap-2">{earnedBadges.map(b => <Badge key={b.id} variant="success" className="gap-1.5 text-xs"><CheckCircle2 className="h-3 w-3" />{b.name}</Badge>)}</div></CardContent></Card>}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Notifications</h2><Link href="/client-messages" className="text-xs text-terracotta-500 hover:underline">View all</Link></div>
          <Card><CardContent className="p-0">
            {notifications.items?.length > 0 ? notifications.items.slice(0, 6).map((n: any) => (
              <Link key={n.id} href={n.link || "#"} className="flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-accent/30">
                <div className="h-8 w-8 rounded-full bg-terracotta-50 flex items-center justify-center shrink-0"><Bell className="h-4 w-4 text-terracotta-500" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium line-clamp-1">{n.title}</p><p className="text-xs text-muted-foreground">{n.message}</p><p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p></div>
              </Link>
            )) : <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet</div>}
          </CardContent></Card>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <Card><CardContent className="p-4 grid grid-cols-2 gap-3">
            {[{ label: "Find Projects", href: "/find-projects", icon: Search }, { label: "Portfolio", href: "/portfolio", icon: Eye }, { label: "Earnings", href: "/earnings", icon: DollarSign }, { label: "Verification", href: "/designer-verification", icon: CheckCircle2 }].map(a => (
              <Link key={a.href} href={a.href} className="flex flex-col items-center gap-2 p-3 rounded-lg border hover:bg-accent/50 transition-colors"><a.icon className="h-5 w-5 text-terracotta-500" /><span className="text-xs font-medium">{a.label}</span></Link>
            ))}
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
