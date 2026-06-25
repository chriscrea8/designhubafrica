"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Rocket,
  LayoutDashboard, FolderKanban, Heart, ShoppingBag, MessageSquare, Settings,
  Image, FileText, DollarSign, Package, Warehouse, Users, UserCheck, Store,
  ShieldCheck, BarChart3, AlertTriangle, Search, HelpCircle, Calendar,
  Hammer, Briefcase, BookMarked, Building2, MapPin, Settings2, CalendarCheck,
  Sparkles, Receipt, Star, ShoppingCart, ChevronLeft, ChevronRight, LogOut,
  Wallet, Inbox, LayoutGrid, Layers, Activity, ClipboardList, Truck,
  Tag, Globe, PenTool, Lightbulb, Banknote, Archive, Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavItem } from "@/lib/constants";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  LayoutDashboard, FolderKanban, Heart, ShoppingBag, MessageSquare, Settings,
  Image, FileText, DollarSign, Package, Warehouse, Users, UserCheck, Store,
  ShieldCheck, BarChart3, AlertTriangle, Search, HelpCircle, Calendar,
  Hammer, Briefcase, BookMarked, Building2, MapPin, Settings2, CalendarCheck,
  Sparkles, Receipt, Star, ShoppingCart, Wallet, Inbox, LayoutGrid, Layers,
  Activity, ClipboardList, Truck, Tag, Globe, PenTool, Lightbulb, Banknote,
  Archive, Bell,
};

interface SidebarProps {
  items: NavItem[];
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;   // Called when a nav link is clicked (close mobile menu)
  // legacy props
  user?: any;
  brandLabel?: string;
  onToggleCollapse?: () => void;
}

export function Sidebar({ items, collapsed = false, onToggle, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "flex flex-col h-screen bg-background border-r transition-all duration-300 overflow-hidden",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Collapse toggle */}
      <div className="flex items-center justify-end px-3 py-3 border-b shrink-0">
        <button onClick={onToggle} className="h-7 w-7 rounded-md flex items-center justify-center hover:bg-accent text-muted-foreground" title={collapsed ? "Expand" : "Collapse"}>
          {collapsed ? <ChevronRight className="h-4 w-4"/> : <ChevronLeft className="h-4 w-4"/>}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && item.href !== "/dashboard" && item.href !== "/designer-dashboard" && pathname.startsWith(item.href + "/"));
          const Icon = item.icon ? (iconMap[item.icon] || null) : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}  // Close mobile menu on navigation
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                isActive ? "bg-terracotta-50 text-terracotta-600 dark:bg-terracotta-900/20" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.title : undefined}
            >
              {Icon && <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-[18px] w-[18px]")}/>}
              {!collapsed && <span className="truncate flex-1">{item.title}</span>}
              {!collapsed && item.badge != null && (
                <span className="ml-auto text-[10px] font-bold bg-terracotta-500 text-white rounded-full h-4 min-w-4 px-1 flex items-center justify-center shrink-0">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      {!collapsed && (
        <div className="border-t px-2 py-3 shrink-0">
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut className="h-[18px] w-[18px] shrink-0"/><span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
}
