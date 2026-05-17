"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Card, CardContent, Button, EmptyState } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";

export default function WishlistPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/marketplace/saved");
    const json = await res.json();
    if (json.success) setProducts(json.data || []);
    setLoading(false);
  }

  async function remove(productId: string) {
    await fetch("/api/marketplace/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
    setProducts(prev => prev.filter(p => p.id !== productId));
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Wishlist</h1><p className="text-sm text-muted-foreground mt-1">{products.length} saved product{products.length !== 1 ? "s" : ""}</p></div>

      {products.length === 0 ? (
        <EmptyState icon={<Heart className="h-12 w-12" />} title="Your wishlist is empty" description="Browse the marketplace and save products you love" action={<Button variant="terracotta" asChild><Link href="/marketplace">Browse Products</Link></Button>} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => (
            <Card key={p.id} className="overflow-hidden group">
              <Link href={`/marketplace/${p.id}`}>
                <div className="aspect-square bg-muted overflow-hidden">
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="h-full w-full flex items-center justify-center text-4xl">📦</div>}
                </div>
              </Link>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{p.vendor?.storeName}</p>
                <h3 className="font-semibold text-sm line-clamp-2 mt-0.5">{p.name}</h3>
                <p className="font-bold text-terracotta-500 mt-1">{formatCurrency(p.price)}</p>
                <div className="flex gap-2 mt-2">
                  <Button variant="terracotta" size="sm" className="flex-1 gap-1 text-xs" asChild><Link href={`/marketplace/${p.id}`}><ShoppingCart className="h-3 w-3" />Buy</Link></Button>
                  <Button variant="outline" size="sm" onClick={() => remove(p.id)} className="px-2 text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
