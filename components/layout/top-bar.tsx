"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, Menu, ChevronRight, Settings, LogOut, MessageSquare, Clock } from "lucide-react";
import { Button, Input, Avatar, Badge, Separator } from "@/components/ui";
import { cn, formatRelativeTime } from "@/lib/utils";
import { BreadcrumbItem } from "@/lib/types";

interface TopBarProps { breadcrumbs?: BreadcrumbItem[]; onMenuClick?: () => void; user: { name: string; email: string; avatar: string }; }

export function TopBar({ breadcrumbs, onMenuClick, user }: TopBarProps) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    // Fetch notifications
    fetch("/api/notifications").then(r => r.json()).then(res => {
      if (res.success) { setNotifications(res.data?.items || []); setUnreadCount(res.data?.unread || 0); }
    }).catch(() => {});

    // Poll every 30s
    const interval = setInterval(() => {
      fetch("/api/notifications").then(r => r.json()).then(res => {
        if (res.success) { setNotifications(res.data?.items || []); setUnreadCount(res.data?.unread || 0); }
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  function handleSearch(e: React.FormEvent) { e.preventDefault(); if (searchQuery.trim()) router.push(`/designers?search=${encodeURIComponent(searchQuery.trim())}`); }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-xl px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-md hover:bg-accent"><Menu className="h-5 w-5" /></button>
        {breadcrumbs && breadcrumbs.length > 0 && <nav className="hidden sm:flex items-center gap-1.5 text-sm">{breadcrumbs.map((c, i) => <React.Fragment key={i}>{i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}{c.href ? <Link href={c.href} className="text-muted-foreground hover:text-foreground">{c.label}</Link> : <span className="font-medium">{c.label}</span>}</React.Fragment>)}</nav>}
      </div>
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearch} className="hidden md:block"><Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search…" className="w-64 h-9 pl-9 bg-muted/50 border-0" icon={<Search className="h-4 w-4" />} /></form>

        {/* Notifications Bell */}
        <div className="relative">
          <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} className="relative p-2 rounded-md hover:bg-accent">
            <Bell className="h-5 w-5 text-muted-foreground" />
            {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-terracotta-500 text-white text-[10px] flex items-center justify-center font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </button>
          <AnimatePresence>{notifOpen && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 top-12 w-96 rounded-xl border bg-card shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-terracotta-500 hover:underline">Mark all read</button>}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length > 0 ? notifications.slice(0, 10).map(n => (
                <Link key={n.id} href={n.link || "#"} onClick={() => setNotifOpen(false)} className={cn("flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-accent/30 transition-colors", !n.isRead && "bg-terracotta-50/30")}>
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-0.5", n.type === "new_message" ? "bg-blue-50 text-blue-500" : n.type === "proposal_accepted" ? "bg-emerald-50 text-emerald-500" : "bg-terracotta-50 text-terracotta-500")}>
                    {n.type === "new_message" ? <MessageSquare className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm line-clamp-1", !n.isRead && "font-semibold")}>{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatRelativeTime(n.createdAt)}</p>
                  </div>
                  {!n.isRead && <div className="h-2 w-2 rounded-full bg-terracotta-500 shrink-0 mt-2" />}
                </Link>
              )) : <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>}
            </div>
          </motion.div>}</AnimatePresence>
        </div>

        {/* Profile */}
        <div className="relative">
          <button onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent"><Avatar src={user.avatar} fallback={user.name.slice(0, 2)} size="sm" /></button>
          <AnimatePresence>{profileOpen && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 top-12 w-56 rounded-xl border bg-card shadow-lg overflow-hidden z-50">
            <div className="px-4 py-3 border-b"><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
            <div className="py-1"><Link href="/settings" className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:bg-accent" onClick={() => setProfileOpen(false)}><Settings className="h-4 w-4" />Settings</Link></div>
            <div className="border-t py-1"><button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 w-full"><LogOut className="h-4 w-4" />Log out</button></div>
          </motion.div>}</AnimatePresence>
        </div>
      </div>
    </header>
  );
}
