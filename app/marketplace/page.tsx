"use client";
import React, { useState, useEffect } from "react";
import { ProductCard } from "@/components/cards";
import { SearchBar, Pagination } from "@/components/forms/search-filter";
import { mockProducts } from "@/data/mock-data";
import { cn } from "@/lib/utils";

const cats = ["All", "Furniture", "Lighting", "Textiles", "Wall Decor", "Rugs & Carpets"];

export default function MarketplacePage() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (cat !== "All") params.set("category", cat);
    if (search) params.set("search", search);
    fetch(`/api/marketplace/products?${params}`).then(r => r.json()).then(d => {
      if (d.success && d.data?.items?.length > 0) setProducts(d.data.items);
      else setProducts(mockProducts as any[]);
      setLoading(false);
    }).catch(() => { setProducts(mockProducts as any[]); setLoading(false); });
  }, [cat, search]);

  return (
    <div className="py-8 lg:py-12">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-8"><h1 className="text-3xl lg:text-4xl font-bold">Marketplace</h1><p className="mt-2 text-muted-foreground">African-made furniture, decor, and building materials</p></div>
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4">{cats.map(c => <button key={c} onClick={() => setCat(c)} className={cn("px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap", cat === c ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>{c}</button>)}</div>
        <SearchBar placeholder="Search products..." value={search} onChange={setSearch} showFilter={false} className="mb-6" />
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="aspect-square bg-muted rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">{products.map(p => <ProductCard key={p.id} product={p} />)}</div>
        )}
      </div>
    </div>
  );
}
