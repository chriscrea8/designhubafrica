"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import { LayoutDashboard, FolderKanban, Heart, ShoppingBag, MessageSquare, Settings, Image, FileText, DollarSign, Package, Warehouse, Users, UserCheck, Store, ShieldCheck, BarChart3, ChevronLeft, LogOut, HelpCircle, AlertTriangle, Wallet, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem } from "@/lib/types";
import { Avatar, Badge, Separator } from "@/components/ui";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = { LayoutDashboard, FolderKanban, Heart, ShoppingBag, MessageSquare, Settings, Image, FileText, DollarSign, Package, Warehouse, Users, UserCheck, Store, ShieldCheck, BarChart3, AlertTriangle, Wallet, Search };

interface SidebarProps { items: NavItem[]; user: { name: string; email: string; avatar: string; role: string }; brandLabel: string; collapsed?: boolean; onToggleCollapse?: () => void; }

export function Sidebar({ items, user, brandLabel, collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside className={cn("fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-background transition-all duration-300", collapsed ? "w-[68px]" : "w-64")}>
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-terracotta-500"><span className="text-white font-bold text-sm">DH</span></div>
          {!collapsed && <div className="flex flex-col overflow-hidden"><span className="font-bold text-sm leading-tight whitespace-nowrap">DesignHub</span><span className="text-[9px] font-medium text-terracotta-500 uppercase tracking-widest leading-none whitespace-nowrap">{brandLabel}</span></div>}
        </Link>
        <button onClick={onToggleCollapse} className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent"><ChevronLeft className={cn("h-4 w-4 text-muted-foreground transition-transform", collapsed && "rotate-180")} /></button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4"><ul className="space-y-1">
        {items.map((item) => { const isActive = pathname === item.href; const Icon = item.icon ? iconMap[item.icon] : null;
          return <li key={item.href}><Link href={item.href} className={cn("group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200", isActive ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground")}>
            {isActive && <motion.div layoutId="sidebarActive" className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-terracotta-500" />}
            {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
            {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
            {!collapsed && item.badge && <Badge variant={isActive ? "default" : "secondary"} className="h-5 min-w-[20px] flex items-center justify-center text-[10px]">{item.badge}</Badge>}
          </Link></li>;
        })}
      </ul></nav>
      <div className="border-t p-3">
        <button onClick={() => signOut({ callbackUrl: "/" })} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors">
          <LogOut className="h-[18px] w-[18px] shrink-0" />{!collapsed && <span>Log Out</span>}
        </button>
        <Separator className="my-2" />
        <div className="flex items-center gap-3 rounded-lg px-3 py-2"><Avatar src={user.avatar} fallback={user.name.slice(0, 2)} size="sm" />{!collapsed && <div className="flex-1 overflow-hidden"><p className="text-sm font-medium truncate">{user.name}</p><p className="text-xs text-muted-foreground truncate">{user.role}</p></div>}</div>
      </div>
    </aside>
  );
}
