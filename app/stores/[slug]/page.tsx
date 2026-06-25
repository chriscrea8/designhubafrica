"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Star, Package, Shield, Search, Heart, MessageSquare, ExternalLink, ArrowLeft } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";

function StorefrontContent() {
  const params = useParams();
  const [vendor,   setVendor]   = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");
  const [inquiryModal, setInquiryModal] = useState<any>(null);
  const [inquiryMsg,   setInquiryMsg]   = useState("");
  const [sending, setSending] = useState(false);
  const [saved, setSaved]     = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!params?.slug) return;
    Promise.all([
      fetch(`/api/marketplace/store/${params.slug}`).then(r=>r.json()).catch(()=>({})),
      fetch(`/api/marketplace/products?vendor=${params.slug}&limit=50`).then(r=>r.json()).catch(()=>({})),
    ]).then(([v, p]) => {
      if (v.success) setVendor(v.data);
      if (p.success) setProducts(p.data?.items || p.data || []);
      setLoading(false);
    });
  }, [params?.slug]);

  async function sendInquiry() {
    if (!inquiryMsg.trim() || !inquiryModal) return;
    setSending(true);
    await fetch(`/api/products/${inquiryModal.id}/inquire`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ message: inquiryMsg }) });
    setSending(false); setInquiryModal(null); setInquiryMsg("");
  }

  async function toggleSave(productId: string) {
    await fetch("/api/marketplace/saved", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ productId }) });
    setSaved(prev => { const n = new Set(prev); n.has(productId) ? n.delete(productId) : n.add(productId); return n; });
  }

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;
  if (!vendor) return <div className="text-center py-24"><p className="text-muted-foreground">Store not found</p><Link href="/marketplace" className="text-terracotta-500 text-sm mt-2 inline-block">← Browse marketplace</Link></div>;

  const categories = ["All", ...Array.from(new Set(products.map((p:any) => p.category).filter(Boolean)))];
  const filtered = products.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === "All" || p.category === category;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-44 lg:h-56 bg-gradient-to-br from-terracotta-500 to-earth-700 overflow-hidden">
        {vendor.storeImage && <img src={vendor.storeImage} alt="" className="h-full w-full object-cover opacity-70"/>}
        <div className="absolute top-4 left-4"><Link href="/marketplace" className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm"><ArrowLeft className="h-4 w-4"/>Marketplace</Link></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-6xl">
        {/* Store header */}
        <div className="relative -mt-12 mb-6 flex items-end gap-4 flex-wrap">
          <div className="h-20 w-20 rounded-2xl bg-white border-4 border-background shadow-lg overflow-hidden shrink-0 flex items-center justify-center bg-terracotta-50">
            {vendor.storeImage ? <img src={vendor.storeImage} alt={vendor.storeName} className="h-full w-full object-cover"/> : <span className="text-3xl font-black text-terracotta-600">{vendor.storeName?.[0]}</span>}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black">{vendor.storeName}</h1>
              {vendor.approvalStatus === "APPROVED" && <Badge className="bg-emerald-50 text-emerald-700 text-[10px] gap-1"><Shield className="h-3 w-3"/>Verified</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              {vendor.user?.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/>{vendor.user.location}</span>}
              {vendor.avgRating > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400"/>{vendor.avgRating} ({vendor.totalReviews})</span>}
              <span className="flex items-center gap-1"><Package className="h-3 w-3"/>{products.length} products</span>
            </div>
          </div>
        </div>

        {vendor.storeDescription && <p className="text-sm text-muted-foreground mb-6 max-w-2xl">{vendor.storeDescription}</p>}

        {/* Search + category filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search this store…" className="w-full h-10 rounded-xl border border-input bg-background pl-9 pr-3 text-sm"/>
          </div>
          <div className="flex gap-1.5 overflow-x-auto">
            {categories.map(cat => (
              <button key={cat} onClick={()=>setCategory(cat)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all shrink-0", category===cat?"bg-terracotta-500 text-white border-terracotta-500":"border-border text-muted-foreground hover:border-foreground/40")}>{cat}</button>
            ))}
          </div>
        </div>

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16"><Package className="h-10 w-10 text-muted-foreground mx-auto mb-3"/><p className="text-muted-foreground">No products found</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
            {filtered.map((p:any) => (
              <Card key={p.id} className="group overflow-hidden hover:shadow-md transition-shadow">
                <Link href={`/marketplace/${p.id}`}>
                  <div className="aspect-square overflow-hidden bg-muted relative">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"/> : <div className="h-full w-full flex items-center justify-center"><Package className="h-10 w-10 text-muted-foreground/30"/></div>}
                  </div>
                </Link>
                <CardContent className="p-3">
                  <p className="font-semibold text-sm line-clamp-1">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.category}</p>
                  <p className="font-bold text-sm mt-1">{formatCurrency(p.price)}</p>
                  <div className="flex gap-1.5 mt-2">
                    <button onClick={()=>setInquiryModal(p)} className="flex-1 bg-terracotta-500 text-white rounded-lg text-xs py-1.5 hover:bg-terracotta-600 transition-colors flex items-center justify-center gap-1"><MessageSquare className="h-3 w-3"/>Inquire</button>
                    <button onClick={()=>toggleSave(p.id)} className={cn("h-7 w-7 rounded-lg border flex items-center justify-center transition-colors", saved.has(p.id)?"bg-red-50 border-red-200":"border-border hover:bg-accent")}><Heart className={cn("h-3.5 w-3.5", saved.has(p.id)?"fill-red-500 text-red-500":"text-muted-foreground")}/></button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Inquiry modal */}
      {inquiryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={()=>setInquiryModal(null)}>
          <div className="bg-background rounded-2xl w-full max-w-md p-5 shadow-xl" onClick={e=>e.stopPropagation()}>
            <h3 className="font-bold mb-1">Contact Vendor</h3>
            <p className="text-sm text-muted-foreground mb-4">Re: <strong>{inquiryModal.name}</strong></p>
            <textarea value={inquiryMsg} onChange={e=>setInquiryMsg(e.target.value)} rows={4} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Hi, I'm interested in this product. Can you tell me more about availability and price?"/>
            <div className="flex gap-2 mt-4">
              <Button variant="terracotta" className="flex-1" onClick={sendInquiry} disabled={sending||!inquiryMsg.trim()}>Send Inquiry</Button>
              <Button variant="outline" onClick={()=>setInquiryModal(null)}>Cancel</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Transactions happen offline. No payments on this platform.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StorefrontPage() {
  return <Suspense fallback={<div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><StorefrontContent/></Suspense>;
}
