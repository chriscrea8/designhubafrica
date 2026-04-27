"use client";
import React from "react";
import { useSession } from "next-auth/react";
import { DollarSign, Package, ShoppingBag, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency } from "@/lib/utils";

export default function Page() {
  const { data: session } = useSession();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendor Panel</h1>
        <Button variant="terracotta">Add New</Button>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Revenue" value={formatCurrency(29585000, "NGN")} change={22} icon={<DollarSign className="h-5 w-5" />} />
        <StatsCard title="Orders" value="47" icon={<ShoppingBag className="h-5 w-5" />} />
        <StatsCard title="Products" value="6" icon={<Package className="h-5 w-5" />} />
        <StatsCard title="Store Views" value="3,842" icon={<Eye className="h-5 w-5" />} />
      </div>
      <Card><CardHeader><CardTitle>Content</CardTitle></CardHeader><CardContent>
        <p className="text-sm text-muted-foreground">Manage your store from this page. Features are actively being developed.</p>
      </CardContent></Card>
    </div>
  );
}
