"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { publicNavItems } from "@/lib/constants";

const dashboardRoutes: Record<string, string> = {
  CLIENT: "/dashboard",
  DESIGNER: "/designer-dashboard",
  ARTISAN: "/artisan-dashboard",
  VENDOR: "/vendor-dashboard",
  ADMIN: "/admin-dashboard",
};

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && session?.user;
  const dashboardUrl = isLoggedIn ? dashboardRoutes[(session.user as any).role] || "/dashboard" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <Link href={isLoggedIn ? dashboardUrl : "/"} className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-terracotta-500 shadow-sm"><span className="text-white font-bold text-sm">DH</span></div>
          <div className="flex flex-col"><span className="font-bold text-base leading-tight tracking-tight">DesignHub</span><span className="text-[10px] font-medium text-terracotta-500 uppercase tracking-widest leading-none">Africa</span></div>
        </Link>
        <nav className="hidden md:flex items-center gap-1">
          {publicNavItems.map((item) => <Link key={item.href} href={item.href} className={cn("relative px-3.5 py-2 text-sm font-medium rounded-md transition-colors", pathname === item.href ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent")}>{item.title}{pathname === item.href && <motion.div layoutId="activeTab" className="absolute inset-x-1 -bottom-[17px] h-0.5 bg-terracotta-500 rounded-full" />}</Link>)}
        </nav>
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn ? (
            <Button variant="terracotta" size="sm" asChild>
              <Link href={dashboardUrl} className="gap-2"><LayoutDashboard className="h-4 w-4" />Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link href="/login">Log in</Link></Button>
              <Button variant="terracotta" size="sm" asChild><Link href="/register">Get Started</Link></Button>
            </>
          )}
        </div>
        <button className="md:hidden p-2 rounded-md hover:bg-accent" onClick={() => setOpen(!open)}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
      </div>
      <AnimatePresence>{open && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-t bg-background overflow-hidden"><nav className="container mx-auto px-4 py-4 flex flex-col gap-1">{publicNavItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="px-3 py-2.5 rounded-md text-sm font-medium hover:bg-accent">{item.title}</Link>)}<div className="flex flex-col gap-2 mt-4 pt-4 border-t">{isLoggedIn ? <Button variant="terracotta" asChild><Link href={dashboardUrl}>Dashboard</Link></Button> : <><Button variant="outline" asChild><Link href="/login">Log in</Link></Button><Button variant="terracotta" asChild><Link href="/register">Get Started</Link></Button></>}</div></nav></motion.div>}</AnimatePresence>
    </header>
  );
}
