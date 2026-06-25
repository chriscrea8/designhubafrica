"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { cn } from "@/lib/utils";
import { dashboardNavItems } from "@/lib/constants";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed,   setCollapsed]   = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [navItems,    setNavItems]    = useState(dashboardNavItems);

  useEffect(() => {
    // Badge for messages = unread message count (not all notifications)
    fetch("/api/messages/conversations").then(r=>r.json()).then(res => {
      if (res.success) {
        const convs = Array.isArray(res.data) ? res.data : (res.data?.items || []);
        const unread = convs.filter((c: any) => c.messages?.length > 0 && !c.participants?.find((p: any) => p.userId === "self")?.lastReadAt).length;
        if (unread > 0) setNavItems(prev => prev.map(item => item.href === "/messages" ? { ...item, badge: unread } : item));
      }
    }).catch(()=>{});
  }, []);

  if (status === "loading") return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;
  if (status === "unauthenticated") { router.push("/login"); return null; }

  // Role-based redirect — each role has its own dashboard
  const userRole = (session?.user as any)?.role;
  const clientOnlyPaths = ["/dashboard", "/projects", "/messages", "/invoices", "/consultations", "/job-requests", "/moodboards", "/wishlist", "/saved-designers", "/business", "/artisans", "/designers", "/marketplace"];
  const sharedPaths = ["/site-visits", "/support", "/settings", "/inspiration", "/rfq", "/consultation-success"];
  const isOnClientPath = clientOnlyPaths.some(p => pathname === p || pathname.startsWith(p + "/"));
  if (isOnClientPath && userRole === "DESIGNER") { router.replace("/designer-dashboard"); return null; }
  if (isOnClientPath && userRole === "VENDOR")   { router.replace("/vendor-dashboard");   return null; }
  if (isOnClientPath && userRole === "ARTISAN")  { router.replace("/artisan-dashboard");  return null; }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)}/>}

      {/* Fixed sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-screen z-40 transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <Sidebar onNavigate={() => setMobileOpen(false)} items={navItems} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Main content — offset by sidebar width */}
      <div className={cn("transition-all duration-300 lg:pl-0", collapsed ? "lg:ml-16" : "lg:ml-60")}>
        <TopBar onMenuClick={() => setMobileOpen(!mobileOpen)} user={{ name: session?.user?.name || "User", email: session?.user?.email || "", avatar: session?.user?.image || "" }} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
