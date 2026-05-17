"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, ShoppingCart, Truck, Shield, Star, Store, Package, ChevronLeft, ChevronRight, Check, Heart } from "lucide-react";
import { Card, CardContent, Button, Badge, Separator } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";

function ProductContent() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [product,  setProduct]  = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [qty,      setQty]      = useState(1);
  const [ordering, setOrdering] = useState(false);
  const [isSaved,  setIsSaved]  = useState(false);
  const [related,  setRelated]  = useState<any[]>([]);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/marketplace/products/${params.id}`).then(r => r.json()).then(res => {
      if (res.success) {
        setProduct(res.data);
        fetch(`/api/marketplace/products/${params.id}/related`).then(r => r.json()).then(rel => {
          if (rel.success) setRelated(rel.data || []);
        }).catch(() => {});
      }
      setLoading(false);
    }).catch(() => setLoading(false));
    fetch("/api/marketplace/saved").then(r => r.json()).then(res => {
      if (res.success) setIsSaved((res.data || []).some((p: any) => p.id === params.id));
    }).catch(() => {});
  }, [params?.id]);

  async function addToCart() {
    if (!session) { router.push("/login"); return; }
    setOrdering(true);
    const res = await fetch("/api/marketplace/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: [{ productId: product.id, quantity: qty }] }) });
    const json = await res.json();
    setOrdering(false);
    if (json.success && json.data?.authorizationUrl) window.location.href = json.data.authorizationUrl;
    else alert(json.error || "Could not initiate order.");
  }

  async function toggleSave() {
    if (!session) { router.push("/login"); return; }
    const res = await fetch("/api/marketplace/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id }) });
    const json = await res.json();
    if (json.success) setIsSaved(json.data?.saved ?? !isSaved);
  }

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;
  if (!product) return <div className="text-center py-24"><p className="text-muted-foreground">Product not found</p><Link href="/marketplace" className="text-terracotta-500 text-sm mt-2 inline-block">Browse marketplace</Link></div>;

  const images = product.images || [];
  const vendor = product.vendor;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4" />Marketplace</Link>
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-3">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
            {images.length > 0 ? <img src={images[imgIndex]} alt={product.name} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-6xl">📦</div>}
            {images.length > 1 && (<><button onClick={() => setImgIndex(prev => (prev - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"><ChevronLeft className="h-5 w-5" /></button><button onClick={() => setImgIndex(prev => (prev + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"><ChevronRight className="h-5 w-5" /></button></>)}
          </div>
          {images.length > 1 && <div className="flex gap-2 overflow-x-auto pb-1">{images.map((img: string, i: number) => <button key={i} onClick={() => setImgIndex(i)} className={cn("h-16 w-16 rounded-lg overflow-hidden border-2 shrink-0", imgIndex === i ? "border-terracotta-500" : "border-transparent")}><img src={img} alt="" className="h-full w-full object-cover" /></button>)}</div>}
        </div>
        <div className="space-y-5">
          <div>
            {product.category && <Badge variant="secondary" className="mb-2">{product.category}</Badge>}
            <h1 className="text-2xl lg:text-3xl font-bold">{product.name}</h1>
            <p className="text-3xl font-bold text-terracotta-500 mt-3">{formatCurrency(product.price)}</p>
            {product.shippingCost === 0 ? <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1"><Check className="h-3.5 w-3.5" />Free shipping</p> : <p className="text-sm text-muted-foreground mt-1">+ {formatCurrency(product.shippingCost)} shipping</p>}
          </div>
          <Separator />
          {(product.material || product.color || product.dimensions) && <div className="grid grid-cols-2 gap-3 text-sm">
            {product.material   && <div><p className="text-muted-foreground text-xs">Material</p><p className="font-medium">{product.material}</p></div>}
            {product.color      && <div><p className="text-muted-foreground text-xs">Color</p><p className="font-medium">{product.color}</p></div>}
            {product.dimensions && <div className="col-span-2"><p className="text-muted-foreground text-xs">Dimensions</p><p className="font-medium">{product.dimensions}</p></div>}
          </div>}
          <div><p className="text-sm font-medium mb-2">Description</p><p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p></div>
          <div className="flex items-center gap-4">
            <div className={cn("flex items-center gap-1.5 text-sm font-medium", product.inStock ? "text-emerald-600" : "text-red-500")}><Package className="h-4 w-4" />{product.inStock ? `${product.stockCount} in stock` : "Out of Stock"}</div>
            {product.inStock && <div className="flex items-center gap-2"><button onClick={() => setQty(prev => Math.max(1, prev - 1))} className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-accent text-lg">−</button><span className="w-8 text-center font-medium">{qty}</span><button onClick={() => setQty(prev => Math.min(product.stockCount, prev + 1))} className="h-8 w-8 rounded-md border flex items-center justify-center hover:bg-accent text-lg">+</button></div>}
          </div>
          <div className="flex gap-3">
            <Button variant="terracotta" className="flex-1 gap-2 h-12 text-base" disabled={!product.inStock || ordering} onClick={addToCart}>
              {ordering ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" /> : <ShoppingCart className="h-5 w-5" />}
              {product.inStock ? `Buy Now — ${formatCurrency(product.price * qty)}` : "Out of Stock"}
            </Button>
            <button onClick={toggleSave} className={cn("h-12 w-12 rounded-xl border-2 flex items-center justify-center transition-colors shrink-0", isSaved ? "border-red-200 bg-red-50 text-red-500" : "border-border text-muted-foreground hover:border-red-200 hover:text-red-400")} title={isSaved ? "Remove from wishlist" : "Save"}>
              <Heart className={cn("h-5 w-5", isSaved && "fill-red-400")} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40"><Shield className="h-4 w-4 shrink-0 text-terracotta-500" />Secure payment via Paystack</div>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40"><Truck className="h-4 w-4 shrink-0 text-terracotta-500" />{product.deliveryMethod === "pickup" ? "Pickup available" : "Delivery available"}</div>
          </div>
        </div>
      </div>
      {vendor && <Card className="mt-10"><CardContent className="p-5 flex items-start gap-4">
        <div className="h-14 w-14 rounded-xl overflow-hidden bg-muted shrink-0">{vendor.storeImage ? <img src={vendor.storeImage} alt={vendor.storeName} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><Store className="h-6 w-6 text-muted-foreground" /></div>}</div>
        <div className="flex-1"><h3 className="font-semibold">{vendor.storeName}</h3>{vendor.storeDescription && <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{vendor.storeDescription}</p>}<div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">{vendor.avgRating > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{vendor.avgRating}</span>}<span>{vendor._count?.products || 0} products</span></div></div>
        <Link href={`/marketplace/store/${vendor.id}`}><Button variant="outline" size="sm">Visit Store</Button></Link>
      </CardContent></Card>}
      {related.length > 0 && <div className="mt-10"><h2 className="text-xl font-bold mb-4">You Might Also Like</h2><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">{related.map(p => <Link key={p.id} href={`/marketplace/${p.id}`} className="group"><div className="rounded-xl border overflow-hidden hover:shadow-md transition-shadow"><div className="aspect-square bg-muted overflow-hidden">{p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform" /> : <div className="h-full w-full flex items-center justify-center text-3xl">📦</div>}</div><div className="p-2"><p className="text-xs font-medium line-clamp-2">{p.name}</p><p className="text-xs font-bold text-terracotta-500 mt-1">{formatCurrency(p.price)}</p></div></div></Link>)}</div></div>}
    </div>
  );
}

export default function ProductPage() {
  return <Suspense fallback={<div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>}><ProductContent /></Suspense>;
}
