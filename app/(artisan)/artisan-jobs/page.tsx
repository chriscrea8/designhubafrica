"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { DollarSign, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency } from "@/lib/utils";

export default function Page() {
  const { data: session } = useSession();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Artisan Panel</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Earnings" value={formatCurrency(850000, "NGN")} change={15} icon={<DollarSign className="h-5 w-5" />} />
        <StatsCard title="Active Jobs" value="2" icon={<Wrench className="h-5 w-5" />} />
        <StatsCard title="Completed" value="14" icon={<Wrench className="h-5 w-5" />} />
        <StatsCard title="Rating" value="4.7" icon={<Wrench className="h-5 w-5" />} />
      </div>
      <Card><CardHeader><CardTitle>Content</CardTitle></CardHeader><CardContent>
        <p className="text-sm text-muted-foreground">Manage your artisan work from this page.</p>
      </CardContent></Card>
    </div>
  );
}
