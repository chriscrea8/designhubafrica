"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { DollarSign, FolderKanban, Star, Wrench, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default function ArtisanDashboardPage() {
  const { data: session } = useSession();
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Welcome, {session?.user?.firstName || "Artisan"}!</h1><p className="text-sm text-muted-foreground mt-1">Manage your artisan practice</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Earnings" value={formatCurrency(850000, "NGN")} change={15} changeLabel="vs last month" icon={<DollarSign className="h-5 w-5" />} />
        <StatsCard title="Active Jobs" value="2" icon={<FolderKanban className="h-5 w-5" />} />
        <StatsCard title="Proposals" value="4" icon={<FileText className="h-5 w-5" />} />
        <StatsCard title="Rating" value="4.7" icon={<Star className="h-5 w-5" />} />
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-3">
          {[{ label: "My Services", href: "/artisan-services", icon: Wrench }, { label: "Proposals", href: "/artisan-proposals", icon: FileText }, { label: "Earnings", href: "/artisan-earnings", icon: DollarSign }, { label: "Active Jobs", href: "/artisan-jobs", icon: FolderKanban }].map(a => (
            <Link key={a.href} href={a.href} className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors"><a.icon className="h-5 w-5 text-terracotta-500" /><span className="text-xs font-medium">{a.label}</span></Link>
          ))}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Service Categories</CardTitle></CardHeader><CardContent>
          <div className="flex flex-wrap gap-2">
            {["Carpentry", "Electrical", "Painting", "Tiling", "Plumbing", "POP Installation", "Furniture Making", "Welding"].map(c => (
              <span key={c} className="px-3 py-1.5 rounded-full bg-earth-50 text-earth-700 text-xs font-medium border border-earth-200">{c}</span>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
