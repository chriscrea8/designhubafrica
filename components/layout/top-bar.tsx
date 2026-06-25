"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bell, ChevronRight, Settings, LogOut, Menu, X, Check } from "lucide-react";
import { Avatar } from "@/components/ui";
import { cn } from "@/lib/utils";

interface TopBarProps {
  onMenuClick: () => void;
  user: { name: string; email: string; avatar: string };
}

export function TopBar({ onMenuClick, user }: TopBarProps) {
  const pathname = usePathname();
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/notifications?limit=8").then(r=>r.json()).then(res => {
      if (res.success) {
        setNotifications(res.data?.items || res.data || []);
        setUnreadCount(res.data?.unread || 0);
      }
    }).catch(()=>{});
  }, [pathname]);

  // Click outside closes both dropdowns
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" }).catch(()=>{});
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur sticky top-0 z-20 flex items-center px-4 gap-3">
      <button onClick={onMenuClick} className="lg:hidden p-1.5 rounded-md hover:bg-accent text-muted-foreground">
        <Menu className="h-5 w-5"/>
      </button>

      <div className="flex-1"/>

      <div className="flex items-center gap-1">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen(prev => !prev); setProfileOpen(false); }}
            className="relative p-2 rounded-md hover:bg-accent text-muted-foreground"
          >
            <Bell className="h-5 w-5"/>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-background border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <span className="font-semibold text-sm">Notifications</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && <button onClick={markAllRead} className="text-xs text-terracotta-500 hover:underline flex items-center gap-1"><Check className="h-3 w-3"/>Mark all read</button>}
                  <button onClick={() => setNotifOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4"/></button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No notifications</p>
                ) : notifications.map(n => (
                  <Link key={n.id} href={n.link||"#"} onClick={() => setNotifOpen(false)}
                    className={cn("flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-accent/30 transition-colors", !n.isRead && "bg-terracotta-50/30 dark:bg-terracotta-900/10")}>
                    {!n.isRead && <span className="h-2 w-2 rounded-full bg-terracotta-500 mt-1.5 shrink-0"/>}
                    <div className={cn("flex-1 min-w-0", n.isRead && "pl-4")}>
                      <p className="text-sm font-medium line-clamp-1">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{n.message}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="border-t px-4 py-2">
                <Link href="/notifications" onClick={() => setNotifOpen(false)} className="text-xs text-terracotta-500 hover:underline">View all notifications →</Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => { setProfileOpen(prev => !prev); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <Avatar src={user.avatar} fallback={user.name.slice(0,2)} size="sm"/>
            <span className="hidden sm:block text-sm font-medium max-w-24 truncate">{user.name.split(" ")[0]}</span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-background border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
              <div className="py-1">
                <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"><Settings className="h-4 w-4"/>Settings</Link>
              </div>
              <div className="border-t py-1">
                <button onClick={() => signOut({ callbackUrl: "/" })} className="flex items-center gap-2.5 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 w-full transition-colors">
                  <LogOut className="h-4 w-4"/>Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
