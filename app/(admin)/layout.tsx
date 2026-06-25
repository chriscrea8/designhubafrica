"use client";
import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { cn } from "@/lib/utils";
import { adminNavItems } from "@/lib/constants";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (status === "loading") return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;
  if (status === "unauthenticated") { router.push("/login"); return null; }

  return (
    <div className="min-h-screen bg-background">
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)}/>}
      <div className={cn("fixed top-0 left-0 h-screen z-40 transition-transform duration-300", mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <Sidebar onNavigate={() => setMobileOpen(false)} items={adminNavItems} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>
      <div className={cn("transition-all duration-300 lg:pl-0", collapsed ? "lg:ml-16" : "lg:ml-60")}>
        <TopBar onMenuClick={() => setMobileOpen(!mobileOpen)} user={{ name: session?.user?.name || "User", email: session?.user?.email || "", avatar: session?.user?.image || "" }} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
