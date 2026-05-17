"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { cn } from "@/lib/utils";
import { dashboardNavItems } from "@/lib/constants";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navItems, setNavItems] = useState(dashboardNavItems);

  useEffect(() => {
    // Fetch unread notification count for badge
    fetch("/api/notifications").then(r => r.json()).then(res => {
      if (res.success && res.data?.unread > 0) {
        setNavItems(prev => prev.map(item => item.href === "/messages" ? { ...item, badge: res.data.unread } : item));
      }
    }).catch(() => {});
  }, []);

  if (status === "loading") return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;
  if (status === "unauthenticated") { router.push("/login"); return null; }
  const user = { name: session?.user?.name || "User", email: session?.user?.email || "", avatar: session?.user?.image || "", role: "Client" };
  return <div className="min-h-screen bg-background">{mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />}<div className={cn("lg:block", mobileOpen ? "block" : "hidden")}><Sidebar items={navItems} user={user} brandLabel="Dashboard" collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} /></div><div className={cn("transition-all duration-300", collapsed ? "lg:ml-[68px]" : "lg:ml-64")}><TopBar onMenuClick={() => setMobileOpen(!mobileOpen)} user={user} /><main className="p-4 lg:p-6">{children}</main></div></div>;
}
