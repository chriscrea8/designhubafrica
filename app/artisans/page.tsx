"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, Star, MapPin, Briefcase, ShieldCheck, X } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All","Carpenter","Electrician","Painter","POP Installer","Furniture Maker","Tiler","Welder","Plumber","Curtain Installer"];

function ArtisanCard({ a }: { a: any }) {
  const name = `${a.user?.firstName||""} ${a.user?.lastName||""}`.trim();
  const isVerified = a.verification?.status === "VERIFIED";
  const isAvailable = a.availabilityStatus === "AVAILABLE";
  return (
    <Link href={`/artisans/${a.id}`} className="group">
      <div className="rounded-2xl border bg-background overflow-hidden hover:shadow-md transition-all">
        {/* Portfolio preview */}
        <div className="aspect-video bg-muted overflow-hidden relative">
          {a.portfolio?.[0]
            ? <img src={a.portfolio[0].imageUrl} alt={name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"/>
            : <div className="h-full w-full flex items-center justify-center text-4xl bg-gradient-to-br from-terracotta-50 to-earth-50">🔨</div>}
          <div className="absolute top-2 left-2 flex gap-1.5">
            {isVerified && <Badge className="bg-blue-500 text-white text-[10px] gap-1"><ShieldCheck className="h-2.5 w-2.5"/>Verified</Badge>}
            <Badge className={cn("text-[10px]", isAvailable?"bg-emerald-500 text-white":"bg-gray-500 text-white")}>{isAvailable?"Available":"Busy"}</Badge>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-terracotta-500 font-medium capitalize mt-0.5">{a.serviceCategory?.replace(/_/g," ")}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            {a.avgRating > 0 && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400"/>{a.avgRating} ({a.totalReviews})</span>}
            {a.yearsExperience > 0 && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3"/>{a.yearsExperience}yr{a.yearsExperience!==1?"s":""} exp</span>}
            {a.user?.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/>{a.user.location}</span>}
          </div>
          {a.workLocations?.length > 0 && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">Serves: {a.workLocations.slice(0,3).join(", ")}</p>}
        </div>
      </div>
    </Link>
  );
}

function ArtisansBrowse() {
  const searchParams = useSearchParams();
  const [artisans, setArtisans] = useState<any[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState(searchParams?.get("search")||"");
  const [category, setCategory] = useState(searchParams?.get("category")||"All");
  const [showFilter,setShowFilter] = useState(false);
  const [minExp,   setMinExp]   = useState("");
  const [minRating,setMinRating]= useState("");
  const [available,setAvailable]= useState(false);
  const [verified, setVerified] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit:"24" });
    if (search) p.set("search", search);
    if (category !== "All") p.set("category", category.toLowerCase().replace(/ /g,"_"));
    if (minExp) p.set("minExp", minExp);
    if (minRating) p.set("minRating", minRating);
    if (available) p.set("available","true");
    if (verified) p.set("verified","true");
    fetch(`/api/artisans?${p}`).then(r=>r.json()).then(res=>{
      if (res.success) { setArtisans(res.data?.items||[]); setTotal(res.data?.pagination?.total||0); }
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [search,category,minExp,minRating,available,verified]);

  useEffect(()=>{ load(); }, [load]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold">Find Skilled Artisans</h1>
        <p className="mt-2 text-muted-foreground">Hire verified carpenters, electricians, painters and more across Nigeria</p>
      </div>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or trade…" className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"/>
          {search && <button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-muted-foreground"/></button>}
        </div>
        <button onClick={()=>setShowFilter(!showFilter)} className={cn("h-11 px-4 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors",showFilter?"bg-terracotta-500 text-white border-terracotta-500":"hover:bg-accent")}>
          <SlidersHorizontal className="h-4 w-4"/>Filters
        </button>
      </div>
      <div className="flex gap-2 flex-wrap mb-4">
        {CATEGORIES.map(c=>(
          <button key={c} onClick={()=>setCategory(c)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",category===c?"bg-terracotta-500 text-white border-terracotta-500":"border-border text-muted-foreground hover:border-foreground/40")}>{c}</button>
        ))}
      </div>
      {showFilter && (
        <div className="p-5 rounded-xl border bg-muted/20 mb-6 space-y-4">
          <div className="grid sm:grid-cols-4 gap-4">
            <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Min Experience (yrs)</label><input type="number" value={minExp} onChange={e=>setMinExp(e.target.value)} placeholder="0" className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"/></div>
            <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Min Rating</label>
              <select value={minRating} onChange={e=>setMinRating(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Any</option>
                {["3","3.5","4","4.5"].map(r=><option key={r} value={r}>{r}+ stars</option>)}
              </select></div>
            <div className="flex items-end"><label className="flex items-center gap-2 cursor-pointer pb-2"><input type="checkbox" checked={available} onChange={e=>setAvailable(e.target.checked)} className="rounded"/><span className="text-sm">Available now</span></label></div>
            <div className="flex items-end"><label className="flex items-center gap-2 cursor-pointer pb-2"><input type="checkbox" checked={verified} onChange={e=>setVerified(e.target.checked)} className="rounded"/><span className="text-sm">Verified only</span></label></div>
          </div>
        </div>
      )}
      <p className="text-sm text-muted-foreground mb-6">{loading?"Loading…":`${total} artisan${total!==1?"s":""} found`}</p>
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({length:8}).map((_,i)=><div key={i} className="rounded-2xl border overflow-hidden"><div className="aspect-video bg-muted animate-pulse"/><div className="p-4 space-y-2"><div className="h-4 bg-muted rounded animate-pulse w-3/4"/><div className="h-3 bg-muted rounded animate-pulse w-1/2"/></div></div>)}
        </div>
      ) : artisans.length===0 ? (
        <EmptyState icon={<Search className="h-12 w-12"/>} title="No artisans found" description="Try adjusting your filters or search terms"/>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {artisans.map(a=><ArtisanCard key={a.id} a={a}/>)}
        </div>
      )}
    </div>
  );
}

export default function ArtisansPage() {
  return <Suspense fallback={<div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><ArtisansBrowse/></Suspense>;
}
