"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, Heart, Store, Shield, Package, X, ChevronDown } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";

const CATEGORIES = ["Furniture","Lighting","Decor","Curtains & Blinds","Paint","Tiles & Flooring","Kitchen Fittings","Bathroom Fittings","Doors & Windows","Roofing","Electrical Materials","Plumbing Materials","Wall Panels","Ceiling Materials","Office Furniture","Outdoor Furniture","Smart Home Devices","Construction Materials"];
const CONDITIONS = ["NEW","USED","REFURBISHED"];
const SORT_OPTS = [{ v:"newest",l:"Newest" },{ v:"price_asc",l:"Price: Low to High" },{ v:"price_desc",l:"Price: High to Low" },{ v:"popular",l:"Most Viewed" }];

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const [products,    setProducts]    = useState<any[]>([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState(searchParams?.get("q") || "");
  const [category,    setCategory]    = useState(searchParams?.get("cat") || "");
  const [condition,   setCondition]   = useState("");
  const [sort,        setSort]        = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [page,        setPage]        = useState(1);
  const [saved,       setSaved]       = useState<Set<string>>(new Set());
  const [inquiryProduct, setInquiryProduct] = useState<any>(null);
  const [inquiryMsg,  setInquiryMsg]  = useState("");

  const load = useCallback((reset = false) => {
    const p = new URLSearchParams({ limit:"24", page: reset ? "1" : String(page) });
    if (search)   p.set("search", search);
    if (category) p.set("category", category);
    if (condition)p.set("condition", condition);
    p.set("sort", sort);
    setLoading(true);
    fetch(`/api/marketplace/products?${p}`).then(r=>r.json()).then(res=>{
      if (res.success) {
        const items = res.data?.items || res.data || [];
        setProducts(prev => reset ? items : [...prev, ...items]);
        setTotal(res.data?.pagination?.total || items.length);
      }
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [search, category, condition, sort, page]);

  useEffect(() => { setPage(1); load(true); }, [search, category, condition, sort]);
  useEffect(() => { if (page > 1) load(); }, [page]);

  async function toggleSave(productId: string) {
    await fetch("/api/marketplace/saved", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ productId }) });
    setSaved(prev => { const n = new Set(prev); n.has(productId) ? n.delete(productId) : n.add(productId); return n; });
  }

  async function sendInquiry() {
    if (!inquiryMsg.trim() || !inquiryProduct) return;
    await fetch(`/api/products/${inquiryProduct.id}/inquire`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ message:inquiryMsg }) });
    setInquiryProduct(null); setInquiryMsg("");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero search */}
      <div className="bg-gradient-to-br from-earth-700 to-earth-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-3xl lg:text-4xl font-black mb-2">Interior Design Marketplace</h1>
          <p className="text-white/70 mb-6">Furniture · Tiles · Lighting · Decor · Building Materials</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products, brands, vendors…" className="w-full h-12 rounded-xl pl-12 pr-4 text-foreground bg-white text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-terracotta-300"/>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-6">
        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <button onClick={()=>setCategory("")} className={cn("px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 transition-all", !category?"bg-terracotta-500 text-white border-terracotta-500":"border-border text-muted-foreground hover:border-foreground/40")}>All</button>
          {CATEGORIES.map(c=>(
            <button key={c} onClick={()=>setCategory(category===c?"":c)} className={cn("px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 transition-all", category===c?"bg-terracotta-500 text-white border-terracotta-500":"border-border text-muted-foreground hover:border-foreground/40")}>{c}</button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <button onClick={()=>setShowFilters(!showFilters)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all", showFilters?"bg-terracotta-500 text-white border-terracotta-500":"border-border")}>
            <SlidersHorizontal className="h-3.5 w-3.5"/>Filters
          </button>
          <select value={sort} onChange={e=>setSort(e.target.value)} className="h-8 rounded-full border border-input bg-background px-3 text-sm">
            {SORT_OPTS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
          <p className="text-sm text-muted-foreground ml-auto">{loading && !products.length ? "Loading…" : `${total} product${total!==1?"s":""}`}</p>
        </div>

        {showFilters && (
          <div className="p-4 rounded-xl border bg-muted/10 mb-5 flex flex-wrap gap-4">
            <div><label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Condition</label>
              <div className="flex gap-2">{CONDITIONS.map(c=>(
                <button key={c} onClick={()=>setCondition(condition===c?"":c)} className={cn("px-3 py-1 rounded-full text-xs border transition-all capitalize", condition===c?"bg-terracotta-500 text-white border-terracotta-500":"border-border text-muted-foreground")}>{c.toLowerCase()}</button>
              ))}</div>
            </div>
            <div className="flex items-end"><button onClick={()=>{setCondition("");setCategory("");setSort("newest");}} className="text-xs text-terracotta-500 hover:underline flex items-center gap-1"><X className="h-3 w-3"/>Clear</button></div>
          </div>
        )}

        {/* Products grid */}
        {loading && !products.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({length:12}).map((_,i)=><div key={i} className="rounded-2xl bg-muted animate-pulse aspect-[3/4]"/>)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20"><Package className="h-12 w-12 text-muted-foreground mx-auto mb-3"/><p className="font-semibold text-lg">No products found</p><p className="text-sm text-muted-foreground mt-1">Try different filters or search terms</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((p:any)=>(
              <Card key={p.id} className="group overflow-hidden hover:shadow-md transition-shadow">
                <Link href={`/marketplace/${p.id}`}>
                  <div className="aspect-square overflow-hidden bg-muted">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"/> : <div className="h-full w-full flex items-center justify-center"><Package className="h-10 w-10 text-muted-foreground/20"/></div>}
                  </div>
                </Link>
                <CardContent className="p-3">
                  <p className="font-semibold text-sm line-clamp-1">{p.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{p.category}</p>
                  <p className="font-bold text-sm mt-1 text-terracotta-600">{formatCurrency(p.price)}</p>
                  {p.vendor?.storeName && (
                    <Link href={`/stores/${p.vendor.id}`} className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground hover:text-terracotta-500 transition-colors">
                      <Store className="h-3 w-3"/><span className="line-clamp-1">{p.vendor.storeName}</span>
                      {p.vendor.approvalStatus==="APPROVED" && <Shield className="h-2.5 w-2.5 text-emerald-500 shrink-0"/>}
                    </Link>
                  )}
                  <div className="flex gap-1.5 mt-2">
                    <button onClick={()=>{setInquiryProduct(p);setInquiryMsg("");}} className="flex-1 bg-terracotta-500 text-white rounded-lg text-xs py-1.5 hover:bg-terracotta-600 transition-colors">Inquire</button>
                    <button onClick={()=>toggleSave(p.id)} className={cn("h-7 w-7 rounded-lg border flex items-center justify-center transition-colors shrink-0", saved.has(p.id)?"bg-red-50 border-red-200":"border-border hover:bg-accent")}>
                      <Heart className={cn("h-3.5 w-3.5", saved.has(p.id)?"fill-red-500 text-red-500":"text-muted-foreground")}/>
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {products.length < total && !loading && (
          <div className="text-center mt-8"><Button variant="outline" onClick={()=>setPage(prev=>prev+1)} className="px-8">Load More</Button></div>
        )}
        {loading && products.length > 0 && <div className="flex justify-center mt-6"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-terracotta-500"/></div>}
      </div>

      {/* Inquiry modal */}
      {inquiryProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={()=>setInquiryProduct(null)}>
          <div className="bg-background rounded-2xl w-full max-w-md p-5 shadow-xl" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold mb-1">Contact Vendor</h3>
            <p className="text-sm text-muted-foreground mb-3">About: <strong>{inquiryProduct.name}</strong></p>
            <textarea value={inquiryMsg} onChange={e=>setInquiryMsg(e.target.value)} rows={4} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Hi, I'm interested in this product. Is it available? What's the best price?"/>
            <div className="flex gap-2 mt-4">
              <Button variant="terracotta" className="flex-1" onClick={sendInquiry} disabled={!inquiryMsg.trim()}>Send Message</Button>
              <Button variant="outline" onClick={()=>setInquiryProduct(null)}>Cancel</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">Transactions happen directly between you and the vendor.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return <Suspense fallback={<div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><MarketplaceContent/></Suspense>;
}
