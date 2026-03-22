"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FolderKanban, Heart, ShoppingBag, MessageSquare, Plus, ArrowRight, Clock, TrendingUp, Wallet, Star, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress, Avatar } from "@/components/ui";
import { StatsCard, ProjectCard, DesignerCard } from "@/components/cards";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { mockDesigners } from "@/data/mock-data";

export default function DashboardPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any>({ items: [], unread: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/notifications").then(r => r.json()),
    ]).then(([projRes, notifRes]) => {
      if (projRes.success) setProjects(projRes.data?.items || []);
      if (notifRes.success) setNotifications(notifRes.data || { items: [], unread: 0 });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const active = projects.filter(p => ["IN_PROGRESS", "REVIEW", "OPEN"].includes(p.status));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Welcome back, {session?.user?.firstName || "there"}!</h1><p className="text-sm text-muted-foreground mt-1">Manage your projects and find designers</p></div>
        <Button variant="terracotta" className="gap-2" asChild><Link href="/projects/new"><Plus className="h-4 w-4" /> Start a Project</Link></Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Projects" value={active.length} icon={<FolderKanban className="h-5 w-5" />} />
        <StatsCard title="Total Projects" value={projects.length} icon={<TrendingUp className="h-5 w-5" />} />
        <StatsCard title="Unread" value={notifications.unread || 0} icon={<MessageSquare className="h-5 w-5" />} />
        <StatsCard title="Wallet" value={formatCurrency(3500000)} icon={<Wallet className="h-5 w-5" />} />
      </div>

      {/* Quick start — if no projects */}
      {projects.length === 0 && !loading && (
        <Card className="bg-gradient-to-r from-terracotta-50 to-earth-50 border-terracotta-200"><CardContent className="p-8 text-center">
          <h2 className="text-xl font-bold">Ready to transform your space?</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Create a project brief and get proposals from verified designers across Africa.</p>
          <Button variant="terracotta" size="lg" className="mt-6 gap-2" asChild><Link href="/projects/new"><Plus className="h-4 w-4" />Create Your First Project</Link></Button>
        </CardContent></Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Projects */}
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Your Projects</h2><Link href="/projects" className="text-sm text-terracotta-500 hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link></div>
          {loading ? <div className="grid sm:grid-cols-2 gap-4">{[1,2].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}</div>
          : projects.length === 0 ? <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No projects yet</CardContent></Card>
          : <div className="grid sm:grid-cols-2 gap-4">{projects.slice(0, 4).map(p => <ProjectCard key={p.id} project={p} />)}</div>}

          {/* Recommended Designers */}
          <div><h2 className="text-lg font-semibold mb-4">Recommended Designers</h2><div className="grid sm:grid-cols-2 gap-4">{(mockDesigners as any[]).slice(0, 2).map(d => <DesignerCard key={d.id} designer={d} />)}</div></div>
        </div>

        {/* Activity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Activity</h2></div>
          <Card><CardContent className="p-0">
            {notifications.items?.length > 0 ? notifications.items.slice(0, 5).map((n: any) => (
              <Link key={n.id} href={n.link || "#"} className="flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-accent/30">
                <div className="h-8 w-8 rounded-full bg-terracotta-50 flex items-center justify-center shrink-0"><Clock className="h-4 w-4 text-terracotta-500" /></div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium line-clamp-1">{n.title}</p><p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p><p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p></div>
              </Link>
            )) : <div className="p-6 text-center text-sm text-muted-foreground">No recent activity</div>}
          </CardContent></Card>

          {/* Quick Links */}
          <Card><CardHeader><CardTitle className="text-sm">Quick Links</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-2">
            {[{ label: "Find Designers", href: "/designers", icon: Star }, { label: "Marketplace", href: "/marketplace", icon: ShoppingBag }, { label: "Messages", href: "/messages", icon: MessageSquare }, { label: "Wallet", href: "/wallet", icon: Wallet }].map(l => (
              <Link key={l.href} href={l.href} className="flex flex-col items-center gap-1.5 p-3 rounded-lg border hover:bg-accent/50 transition-colors"><l.icon className="h-4 w-4 text-terracotta-500" /><span className="text-xs font-medium">{l.label}</span></Link>
            ))}
          </CardContent></Card>
        </div>
      </div>
    </div>
  );
}
