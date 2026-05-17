"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, X, Star, ShoppingCart } from "lucide-react";
import { Button, Badge, EmptyState } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";

const CATEGORIES = ["All","Furniture","Lighting","Tiles","Paint","Kitchen Fittings","Bathroom Fittings","Decor","Construction Materials"];
const SORT_OPTIONS = [{ value:"newest", label:"Newest" },{ value:"price_low", label:"Price: Low to High" },{ value:"price_high", label:"Price: High to Low" }];

function ProductCard({ product }: { product: any }) {
  return (
    <Link href={`/marketplace/${product.id}`} className="group">
      <div className="rounded-xl border bg-background overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative aspect-square bg-muted overflow-hidden">
          {product.images?.[0]
            ? <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
            : <div className="h-full w-full flex items-center justify-center text-4xl">📦</div>}
          {!product.inStock && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Badge className="bg-black/80 text-white text-xs">Out of Stock</Badge></div>}
        </div>
        <div className="p-3">
          <p className="text-xs text-muted-foreground mb-1">{product.vendor?.storeName || "Vendor"}</p>
          <h3 className="font-semibold text-sm line-clamp-2 leading-snug">{product.name}</h3>
          <div className="flex items-center justify-between mt-2">
            <p className="font-bold text-terracotta-500">{formatCurrency(product.price)}</p>
            {product.shippingCost === 0 && <span className="text-[10px] text-emerald-600 font-medium">Free shipping</span>}
          </div>
          {product.category && <Badge variant="secondary" className="text-[10px] mt-2">{product.category}</Badge>}
        </div>
      </div>
    </Link>
  );
}

function MarketplaceBrowse() {
  const searchParams = useSearchParams();
  const [products,   setProducts]   = useState<any[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState(searchParams?.get("search") || "");
  const [category,   setCategory]   = useState(searchParams?.get("category") || "All");
  const [sort,       setSort]       = useState("newest");
  const [showFilter, setShowFilter] = useState(false);
  const [minPrice,   setMinPrice]   = useState("");
  const [maxPrice,   setMaxPrice]   = useState("");

  const fetch_ = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit: "24", sort });
    if (search) p.set("search", search);
    if (category !== "All") p.set("category", category);
    if (minPrice) p.set("minPrice", minPrice);
    if (maxPrice) p.set("maxPrice", maxPrice);
    fetch(`/api/marketplace/products?${p}`).then(r => r.json()).then(res => {
      if (res.success) { setProducts(res.data?.items || []); setTotal(res.data?.pagination?.total || 0); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [search, category, sort, minPrice, maxPrice]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const hasFilters = category !== "All" || minPrice || maxPrice;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold">Design Marketplace</h1>
        <p className="mt-2 text-muted-foreground">Shop premium interior products from verified vendors across Africa</p>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
        <Button variant={showFilter ? "terracotta" : "outline"} onClick={() => setShowFilter(!showFilter)} className="h-11 gap-2 shrink-0">
          <SlidersHorizontal className="h-4 w-4" />Filters
          {hasFilters && <Badge className="bg-white text-terracotta-500 text-[10px] px-1.5">ON</Badge>}
        </Button>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap mb-4">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all", category === c ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border text-muted-foreground hover:border-foreground/40")}>{c}</button>
        ))}
      </div>

      {/* Filter panel */}
      {showFilter && (
        <div className="p-5 rounded-xl border bg-muted/20 mb-6 space-y-4">
          <div className="grid sm:grid-cols-3 gap-4 items-end">
            <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Min Price (₦)</label><input type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="0" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" /></div>
            <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Max Price (₦)</label><input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Any" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" /></div>
            <div><label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">Sort By</label>
              <select value={sort} onChange={e => setSort(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select></div>
          </div>
          {hasFilters && <button onClick={() => { setCategory("All"); setMinPrice(""); setMaxPrice(""); }} className="text-xs text-terracotta-500 hover:underline flex items-center gap-1"><X className="h-3 w-3" />Clear filters</button>}
        </div>
      )}

      <p className="text-sm text-muted-foreground mb-6">{loading ? "Loading…" : `${total} product${total !== 1 ? "s" : ""} found`}</p>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({length: 10}).map((_,i) => <div key={i} className="aspect-square rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon={<ShoppingCart className="h-12 w-12" />} title="No products found" description={hasFilters || search ? "Try adjusting your filters" : "No products available yet"} action={hasFilters ? <Button variant="outline" onClick={() => { setCategory("All"); setMinPrice(""); setMaxPrice(""); }}>Clear filters</Button> : undefined} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return <Suspense fallback={<div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>}><MarketplaceBrowse /></Suspense>;
}
