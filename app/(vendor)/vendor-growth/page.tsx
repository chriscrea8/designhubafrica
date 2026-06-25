"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Rocket, Star, Store, BarChart3, Zap, CheckCircle2, Clock, DollarSign, TrendingUp, Eye, MousePointer, Crown, Sparkles, Loader2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const BOOST_PLANS = [
  { name:"Starter",  days:3,  price:2000,  score:20, color:"bg-gray-100 text-gray-700" },
  { name:"Standard", days:7,  price:5000,  score:50, color:"bg-blue-50 text-blue-700" },
  { name:"Premium",  days:14, price:10000, score:80, color:"bg-purple-50 text-purple-700" },
  { name:"Elite",    days:30, price:20000, score:100,color:"bg-amber-50 text-amber-700" },
];

const FEATURED_STORE_PLANS = [
  { days:7,  price:15000, label:"1 Week"  },
  { days:14, price:25000, label:"2 Weeks" },
  { days:30, price:45000, label:"1 Month" },
];

function GrowthContent() {
  const searchParams  = useSearchParams();
  const promoSuccess  = searchParams?.get("promo") === "success";
  const [data,        setData]        = useState<any>(null);
  const [plans,       setPlans]       = useState<any[]>([]);
  const [products,    setProducts]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState<"boost"|"featured_store"|null>(null);
  const [selectedProd,setSelectedProd]= useState("");
  const [selectedPlan,setSelectedPlan]= useState<any>(null);
  const [paying,      setPaying]      = useState(false);
  const [activeTab,   setActiveTab]   = useState("overview");

  useEffect(() => {
    Promise.all([
      fetch("/api/promotions/analytics").then(r=>r.json()).catch(()=>({})),
      fetch("/api/promotions/plans?type=BOOST").then(r=>r.json()).catch(()=>({})),
      fetch("/api/products?mine=true&limit=100").then(r=>r.json()).catch(()=>({})),
    ]).then(([analytics, boostPlans, prods]) => {
      if (analytics.success) setData(analytics.data);
      if (boostPlans.success) setPlans(boostPlans.data || []);
      const productList = prods.data?.items || prods.data || [];
      setProducts(productList);
      setLoading(false);
    });
  }, []);

  async function purchase(type: "boost" | "featured_store") {
    setPaying(true);
    let res;
    if (type === "boost") {
      if (!selectedProd || !selectedPlan) { setPaying(false); return; }
      res = await fetch("/api/promotions/boost", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ productId: selectedProd, planId: selectedPlan.id }) });
    } else {
      if (!selectedPlan) { setPaying(false); return; }
      res = await fetch("/api/promotions/featured-store", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ durationDays: selectedPlan.days }) });
    }
    const json = await res!.json();
    setPaying(false);
    if (json.success && json.data.checkoutUrl) {
      window.location.href = json.data.checkoutUrl;
    }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Rocket className="h-6 w-6 text-terracotta-500"/>Growth Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Boost visibility · Feature your store · Run ads</p></div>
      </div>

      {promoSuccess && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3"><CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0"/><p className="text-emerald-700 font-medium">Payment successful! Your promotion is being activated.</p></div>}

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {[{v:"overview",l:"Overview"},{v:"boost",l:"Boost Products"},{v:"featured",l:"Featured Store"},{v:"history",l:"History"}].map(t=>(
          <button key={t.v} onClick={()=>setActiveTab(t.v)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap", activeTab===t.v?"border-terracotta-500 text-foreground":"border-transparent text-muted-foreground")}>{t.l}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label:"Active Boosts",     value: data?.activeBoosts?.length || 0,  icon:<Zap className="h-5 w-5"/>,          color:"bg-amber-50 text-amber-600" },
              { label:"Total Impressions", value: data?.totalImpressions || 0,       icon:<Eye className="h-5 w-5"/>,           color:"bg-blue-50 text-blue-600" },
              { label:"Total Clicks",      value: data?.totalClicks || 0,            icon:<MousePointer className="h-5 w-5"/>,  color:"bg-purple-50 text-purple-600" },
              { label:"Total Spend",       value: formatCurrency(data?.totalSpend||0),icon:<DollarSign className="h-5 w-5"/>,  color:"bg-red-50 text-red-600" },
            ].map(s=>(
              <Card key={s.label}><CardContent className="p-4 flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", s.color)}>{s.icon}</div>
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-xl font-bold">{s.value}</p></div>
              </CardContent></Card>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2"><Zap className="h-5 w-5 text-amber-600"/><h3 className="font-bold">Boost a Product</h3></div>
                <p className="text-sm text-muted-foreground mb-4">Put your products at the top of search results and category pages</p>
                <Button variant="terracotta" onClick={()=>setModal("boost")} className="w-full">Boost Now from {formatCurrency(2000)}</Button>
              </CardContent>
            </Card>
            <Card className={cn("border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50", data?.featuredStore && "opacity-60")}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2"><Crown className="h-5 w-5 text-purple-600"/><h3 className="font-bold">Feature Your Store</h3></div>
                {data?.featuredStore ? (
                  <p className="text-sm text-emerald-600 mb-4">✓ Active until {formatDate(data.featuredStore.endDate)}</p>
                ) : (
                  <p className="text-sm text-muted-foreground mb-4">Get premium placement on the homepage and marketplace discovery</p>
                )}
                <Button variant="outline" onClick={()=>setModal("featured_store")} disabled={!!data?.featuredStore} className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                  {data?.featuredStore ? "Currently Active" : `Feature Store from ${formatCurrency(15000)}`}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Active boosts */}
          {data?.activeBoosts?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Active Boosts</CardTitle></CardHeader>
              <CardContent className="p-0">
                {data.activeBoosts.map((b: any) => (
                  <div key={b.id} className="flex items-center gap-3 px-5 py-3 border-b last:border-0">
                    <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">{b.product?.images?.[0] && <img src={b.product.images[0]} alt="" className="h-full w-full object-cover"/>}</div>
                    <div className="flex-1 min-w-0"><p className="font-medium text-sm line-clamp-1">{b.product?.name}</p><p className="text-xs text-muted-foreground">{b.promotionPlan?.name} · Expires {formatDate(b.endDate)}</p></div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{b.impressions} impressions</p>
                      <p className="text-xs font-medium text-terracotta-500">{b.clicks} clicks</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Boost Tab */}
      {activeTab === "boost" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Boosted products appear higher in search results and category pages. Maximum 20 active boosts.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BOOST_PLANS.map(plan => (
              <Card key={plan.name} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => { setSelectedPlan({...plan, id: plans.find(p=>p.name===plan.name.toUpperCase())?.id||plan.name}); setModal("boost"); }}>
                <CardContent className="p-5 text-center">
                  <Badge className={cn("mb-3", plan.color)}>{plan.name}</Badge>
                  <p className="text-2xl font-black">{formatCurrency(plan.price)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{plan.days} days</p>
                  <p className="text-xs mt-2 text-muted-foreground">Boost score: <span className="font-bold text-foreground">{plan.score}/100</span></p>
                  <Button variant="terracotta" size="sm" className="w-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity">Select</Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {data?.activeBoosts?.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Your Active Boosts ({data.activeBoosts.length}/20)</h3>
              {data.activeBoosts.map((b: any) => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border">
                  <Zap className="h-4 w-4 text-amber-500 shrink-0"/>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium line-clamp-1">{b.product?.name}</p><p className="text-xs text-muted-foreground">Expires {formatDate(b.endDate)}</p></div>
                  <Badge className="bg-emerald-50 text-emerald-700 text-[10px]">Active</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Featured Store Tab */}
      {activeTab === "featured" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Featured stores get prominent placement on the homepage, marketplace discovery, and category pages.</p>
          {data?.featuredStore && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
              <Crown className="h-5 w-5 text-emerald-600 shrink-0"/>
              <div><p className="font-semibold text-emerald-800">Your store is currently featured!</p><p className="text-sm text-emerald-600">Active until {formatDate(data.featuredStore.endDate)} · {data.featuredStore.impressions} impressions</p></div>
            </div>
          )}
          <div className="grid sm:grid-cols-3 gap-4">
            {FEATURED_STORE_PLANS.map(plan => (
              <Card key={plan.days} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setSelectedPlan(plan); setModal("featured_store"); }}>
                <CardContent className="p-5 text-center">
                  <p className="text-lg font-bold">{plan.label}</p>
                  <p className="text-3xl font-black mt-2">{formatCurrency(plan.price)}</p>
                  <ul className="text-xs text-muted-foreground mt-3 space-y-1 text-left">
                    <li>✓ Homepage placement</li><li>✓ Featured badge</li><li>✓ Category priority</li><li>✓ Search boost</li>
                  </ul>
                  <Button variant="terracotta" size="sm" className="w-full mt-4">Get Featured</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="space-y-3">
          {(!data?.txns || data.txns.length === 0) ? <p className="text-center text-muted-foreground py-10">No transaction history yet</p>
          : data.txns.map((t: any) => (
            <div key={t.id} className="flex items-center gap-3 p-4 rounded-xl border">
              <div className="h-10 w-10 rounded-xl bg-terracotta-100 flex items-center justify-center shrink-0"><DollarSign className="h-5 w-5 text-terracotta-600"/></div>
              <div className="flex-1"><p className="font-medium text-sm capitalize">{t.transactionType.replace(/_/g," ").toLowerCase()}</p><p className="text-xs text-muted-foreground">{formatDate(t.createdAt)}</p></div>
              <div className="text-right"><p className="font-bold">{formatCurrency(t.amount)}</p><Badge className={cn("text-[10px]", t.status==="successful"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700")}>{t.status}</Badge></div>
            </div>
          ))}
        </div>
      )}

      {/* Boost Modal */}
      {modal === "boost" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={()=>setModal(null)}>
          <div className="bg-background rounded-2xl w-full max-w-md p-5 shadow-xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-lg">Boost a Product</h3><button onClick={()=>setModal(null)}><X className="h-5 w-5 text-muted-foreground"/></button></div>
            <div className="space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">Select Product</label>
                <select value={selectedProd} onChange={e=>setSelectedProd(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Choose a product…</option>
                  {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select></div>
              <div><label className="text-sm font-medium mb-1.5 block">Select Plan</label>
                <div className="grid grid-cols-2 gap-2">
                  {BOOST_PLANS.map(plan => {
                    const dbPlan = plans.find(p => p.name.toUpperCase() === plan.name.toUpperCase()) || plan;
                    return <button key={plan.name} onClick={()=>setSelectedPlan({...plan, id: dbPlan.id})} className={cn("p-3 rounded-xl border text-left transition-all", selectedPlan?.name===plan.name?"border-terracotta-400 bg-terracotta-50/20":"border-border hover:border-terracotta-300")}>
                      <p className="font-semibold text-sm">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.days} days</p>
                      <p className="font-bold text-sm mt-1">{formatCurrency(plan.price)}</p>
                    </button>;
                  })}
                </div></div>
            </div>
            <Button variant="terracotta" className="w-full mt-5 gap-2" onClick={()=>purchase("boost")} disabled={paying||!selectedProd||!selectedPlan}>
              {paying&&<Loader2 className="h-4 w-4 animate-spin"/>}Pay {selectedPlan ? formatCurrency(selectedPlan.price) : ""} & Boost
            </Button>
          </div>
        </div>
      )}

      {/* Featured Store Modal */}
      {modal === "featured_store" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={()=>setModal(null)}>
          <div className="bg-background rounded-2xl w-full max-w-md p-5 shadow-xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-lg">Feature Your Store</h3><button onClick={()=>setModal(null)}><X className="h-5 w-5 text-muted-foreground"/></button></div>
            <div className="grid gap-2 mb-4">
              {FEATURED_STORE_PLANS.map(plan => (
                <button key={plan.days} onClick={()=>setSelectedPlan(plan)} className={cn("p-4 rounded-xl border flex items-center justify-between transition-all", selectedPlan?.days===plan.days?"border-terracotta-400 bg-terracotta-50/20":"border-border hover:border-terracotta-300")}>
                  <div><p className="font-semibold">{plan.label}</p><p className="text-xs text-muted-foreground">{plan.days} days featured placement</p></div>
                  <p className="font-bold text-lg">{formatCurrency(plan.price)}</p>
                </button>
              ))}
            </div>
            <Button variant="terracotta" className="w-full gap-2" onClick={()=>purchase("featured_store")} disabled={paying||!selectedPlan}>
              {paying&&<Loader2 className="h-4 w-4 animate-spin"/>}<Crown className="h-4 w-4"/>Pay {selectedPlan ? formatCurrency(selectedPlan.price) : ""}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorGrowthPage() {
  return <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><GrowthContent/></Suspense>;
}
