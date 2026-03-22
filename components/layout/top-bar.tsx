"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Search, Menu, ChevronRight, Settings, LogOut } from "lucide-react";
import { Button, Input, Avatar, Badge, Separator } from "@/components/ui";
import { cn } from "@/lib/utils";
import { BreadcrumbItem } from "@/lib/types";

interface TopBarProps { breadcrumbs?: BreadcrumbItem[]; onMenuClick?: () => void; user: { name: string; email: string; avatar: string }; }

export function TopBar({ breadcrumbs, onMenuClick, user }: TopBarProps) {
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/designers?search=${encodeURIComponent(searchQuery.trim())}`);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-xl px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-md hover:bg-accent"><Menu className="h-5 w-5" /></button>
        {breadcrumbs && breadcrumbs.length > 0 && <nav className="hidden sm:flex items-center gap-1.5 text-sm">{breadcrumbs.map((c, i) => <React.Fragment key={i}>{i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}{c.href ? <Link href={c.href} className="text-muted-foreground hover:text-foreground">{c.label}</Link> : <span className="font-medium">{c.label}</span>}</React.Fragment>)}</nav>}
      </div>
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearch} className="hidden md:block">
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search designers, products…" className="w-64 h-9 pl-9 bg-muted/50 border-0" icon={<Search className="h-4 w-4" />} />
        </form>
        <div className="relative">
          <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} className="relative p-2 rounded-md hover:bg-accent"><Bell className="h-5 w-5 text-muted-foreground" /><span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-terracotta-500" /></button>
          <AnimatePresence>{notifOpen && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="absolute right-0 top-12 w-80 rounded-xl border bg-card shadow-lg p-4 z-50"><p className="text-sm font-semibold mb-2">Notifications</p><p className="text-xs text-muted-foreground">No new notifications</p></motion.div>}</AnimatePresence>
        </div>
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
