"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Store, Star, Package, ShieldCheck, MapPin } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";

function StoreContent() {
  const params = useParams();
  const [vendor,   setVendor]   = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    const id = params.id as string;
    Promise.all([
      fetch(`/api/vendors/${id}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/marketplace/products?vendorId=${id}&limit=50`).then(r => r.json()).catch(() => ({})),
    ]).then(([v, p]) => {
      if (v.success) setVendor(v.data);
      if (p.success) setProducts(p.data?.items || []);
      setLoading(false);
    });
  }, [params?.id]);

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;
  if (!vendor) return <div className="text-center py-24"><p className="text-muted-foreground">Store not found</p><Link href="/marketplace" className="text-terracotta-500 text-sm mt-2 inline-block">Browse marketplace</Link></div>;

  return (
    <div>
      {/* Store header */}
      <div className="bg-gradient-to-br from-earth-800 to-earth-900 text-white">
        <div className="container mx-auto px-4 lg:px-8 py-10">
          <Link href="/marketplace" className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-6"><ArrowLeft className="h-4 w-4" />Marketplace</Link>
          <div className="flex items-start gap-5 flex-wrap">
            <div className="h-20 w-20 rounded-2xl overflow-hidden bg-white/10 border border-white/20 shrink-0">
              {vendor.storeImage ? <img src={vendor.storeImage} alt={vendor.storeName} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center"><Store className="h-8 w-8 text-white/50" /></div>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{vendor.storeName}</h1>
                {vendor.approvalStatus === "APPROVED" && <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs"><ShieldCheck className="h-3 w-3 mr-1" />Verified Vendor</Badge>}
              </div>
              {vendor.storeDescription && <p className="mt-2 text-white/70 text-sm max-w-xl">{vendor.storeDescription}</p>}
              <div className="flex items-center gap-4 mt-3 text-sm text-white/60 flex-wrap">
                {vendor.avgRating > 0 && <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{vendor.avgRating} ({vendor.totalReviews} reviews)</span>}
                <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" />{products.length} products</span>
                {vendor.businessAddress && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{vendor.businessAddress}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div className="container mx-auto px-4 lg:px-8 py-8">
        {products.length === 0 ? (
          <EmptyState icon={<Package className="h-12 w-12" />} title="No products yet" description="This vendor hasn't listed any products yet" />
        ) : (<>
          <p className="text-sm text-muted-foreground mb-6">{products.length} product{products.length !== 1 ? "s" : ""}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map(p => (
              <Link key={p.id} href={`/marketplace/${p.id}`} className="group">
                <div className="rounded-xl border bg-background overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square bg-muted overflow-hidden">
                    {p.images?.[0] ? <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className="h-full w-full flex items-center justify-center text-4xl">📦</div>}
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2">{p.name}</h3>
                    <p className="font-bold text-terracotta-500 mt-1">{formatCurrency(p.price)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>)}
      </div>
    </div>
  );
}

export default function StorePage() {
  return <Suspense fallback={<div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>}><StoreContent /></Suspense>;
}
