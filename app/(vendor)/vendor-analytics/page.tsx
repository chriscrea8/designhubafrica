"use client";
import React, { useEffect, useState } from "react";
import { Package, TrendingUp, ShoppingCart, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { StatsCard } from "@/components/cards";
import { formatCurrency } from "@/lib/utils";

export default function VendorAnalyticsPage() {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/marketplace/products?myStore=true&limit=100").then(r => r.json()),
      fetch("/api/vendor/subscription").then(r => r.json()),
    ]).then(([products, sub]) => {
      const items = products.data?.items || [];
      setData({ products: items, approved: items.filter((p: any) => p.isApproved).length, totalStock: items.reduce((s: number, p: any) => s + (p.stockCount || 0), 0), totalValue: items.reduce((s: number, p: any) => s + p.price, 0), subscription: sub.data?.subscription });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  const { products = [], approved = 0, totalStock = 0, totalValue = 0, subscription } = data || {};

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Store Analytics</h1><p className="text-sm text-muted-foreground mt-1">Track your listing performance</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Products"  value={products.length} icon={<Package className="h-5 w-5" />} />
        <StatsCard title="Live Listings"   value={approved}        icon={<TrendingUp className="h-5 w-5" />} />
        <StatsCard title="Total Stock"     value={totalStock}      icon={<ShoppingCart className="h-5 w-5" />} />
        <StatsCard title="Catalogue Value" value={formatCurrency(totalValue)} icon={<Star className="h-5 w-5" />} />
      </div>
      {subscription && <Card><CardContent className="p-5 flex items-center gap-6 flex-wrap">
        <div><p className="text-xs text-muted-foreground">Plan</p><p className="font-bold">{subscription.plan}</p></div>
        <div><p className="text-xs text-muted-foreground">Listing Usage</p><p className="font-bold">{subscription.listingLimit === 999 ? "Unlimited" : `${products.length}/${subscription.listingLimit}`}</p></div>
        <div><p className="text-xs text-muted-foreground">Boost Credits</p><p className="font-bold">{subscription.boostCredits}</p></div>
      </CardContent></Card>}
      <Card><CardHeader><CardTitle className="text-base">Products</CardTitle></CardHeader><CardContent className="p-0">
        {products.length === 0 ? <p className="text-center py-8 text-sm text-muted-foreground">No products yet</p>
        : products.slice(0, 10).map((p: any) => (
          <div key={p.id} className="flex items-center gap-4 px-5 py-4 border-b last:border-0">
            <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">{p.images?.[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center">📦</div>}</div>
            <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{p.name}</p><p className="text-xs text-muted-foreground">{p.category} · {p.moderationStatus}</p></div>
            <div className="text-right"><p className="font-semibold text-sm">{formatCurrency(p.price)}</p><p className="text-xs text-muted-foreground">Stock: {p.stockCount}</p></div>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}
