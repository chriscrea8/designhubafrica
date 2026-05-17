"use client";
import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, Star, Users } from "lucide-react";
import { Button, Badge, EmptyState } from "@/components/ui";
import { DesignerCard } from "@/components/cards";
import { cn } from "@/lib/utils";

const LOCATIONS   = ["All","Lagos","Abuja","Accra","Nairobi","Kigali","Cape Town","Other"];
const STYLES      = ["All","Modern","Minimalist","African Fusion","Contemporary","Industrial","Scandinavian","Luxury","Bohemian"];
const EXPERIENCE  = [{ label: "Any", value: "" },{ label: "1+ years", value: "1" },{ label: "3+ years", value: "3" },{ label: "5+ years", value: "5" },{ label: "10+ years", value: "10" }];
const RATINGS     = [{ label: "Any", value: "" },{ label: "4★ & up", value: "4" },{ label: "4.5★ & up", value: "4.5" }];
const SORT_OPTIONS = [{ value: "rating", label: "Top Rated" },{ value: "experience", label: "Most Experienced" },{ value: "price_low", label: "Lowest Price" },{ value: "price_high", label: "Highest Price" }];

function DesignerBrowse() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search,   setSearch]   = useState(searchParams?.get("search") || "");
  const [location, setLocation] = useState(searchParams?.get("location") || "All");
  const [style,    setStyle]    = useState(searchParams?.get("style") || "All");
  const [minExp,   setMinExp]   = useState(searchParams?.get("minExp") || "");
  const [minRating,setMinRating]= useState(searchParams?.get("minRating") || "");
  const [sort,     setSort]     = useState(searchParams?.get("sort") || "rating");
  const [showFilters, setShowFilters] = useState(false);
  const [designers, setDesigners] = useState<any[]>([]);
  const [total,     setTotal]   = useState(0);
  const [loading,   setLoading] = useState(true);
  const [savedIds,  setSavedIds] = useState<Set<string>>(new Set());

  // Fetch saved designer IDs so heart icons reflect state
  useEffect(() => {
    fetch("/api/saved-designers").then(r => r.json()).then(res => {
      if (res.success) setSavedIds(new Set((res.data || []).map((d: any) => d.id)));
    }).catch(() => {});
  }, []);

  const fetchDesigners = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search)    p.set("search", search);
    if (location && location !== "All") p.set("location", location);
    if (style    && style    !== "All") p.set("specialty", style);
    if (minExp)    p.set("minExp", minExp);
    if (minRating) p.set("minRating", minRating);
    if (sort)      p.set("sort", sort);
    p.set("limit", "24");
    fetch(`/api/designers?${p}`).then(r => r.json()).then(res => {
      if (res.success) { setDesigners(res.data?.items || []); setTotal(res.data?.pagination?.total || 0); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [search, location, style, minExp, minRating, sort]);

  useEffect(() => { fetchDesigners(); }, [fetchDesigners]);

  async function toggleSave(designerId: string) {
    const res = await fetch("/api/saved-designers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ designerId }) });
    const json = await res.json();
    if (json.success) {
      setSavedIds(prev => { const next = new Set(prev); json.data?.saved ? next.add(designerId) : next.delete(designerId); return next; });
    }
  }

  const hasFilters = location !== "All" || style !== "All" || minExp || minRating;

  function clearFilters() { setLocation("All"); setStyle("All"); setMinExp(""); setMinRating(""); }

  return (
    <div className="py-8 lg:py-12">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold">Find Your Designer</h1>
          <p className="mt-2 text-muted-foreground">Browse verified interior designers across Africa</p>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, location, or specialty..."
              className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-muted-foreground" /></button>}
          </div>
          <Button variant={showFilters ? "terracotta" : "outline"} onClick={() => setShowFilters(!showFilters)} className="h-11 gap-2 shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {hasFilters && <Badge className="ml-1 bg-white text-terracotta-500 text-[10px] px-1.5">ON</Badge>}
          </Button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="p-5 rounded-xl border bg-muted/20 mb-6 space-y-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Location */}
              <div>
                <label className="text-xs font-semibold mb-2 block uppercase tracking-wide text-muted-foreground">Location</label>
                <div className="flex flex-wrap gap-1.5">
                  {LOCATIONS.map(l => (
                    <button key={l} onClick={() => setLocation(l)} className={cn("px-2.5 py-1 rounded-full border text-xs font-medium transition-all", location === l ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border text-muted-foreground hover:border-foreground/40")}>{l}</button>
                  ))}
                </div>
              </div>

              {/* Style / Specialty */}
              <div>
                <label className="text-xs font-semibold mb-2 block uppercase tracking-wide text-muted-foreground">Style</label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLES.map(s => (
                    <button key={s} onClick={() => setStyle(s)} className={cn("px-2.5 py-1 rounded-full border text-xs font-medium transition-all", style === s ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border text-muted-foreground hover:border-foreground/40")}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="text-xs font-semibold mb-2 block uppercase tracking-wide text-muted-foreground">Experience</label>
                <div className="flex flex-wrap gap-1.5">
                  {EXPERIENCE.map(e => (
                    <button key={e.label} onClick={() => setMinExp(e.value)} className={cn("px-2.5 py-1 rounded-full border text-xs font-medium transition-all", minExp === e.value ? "bg-earth-700 text-white border-earth-700" : "border-border text-muted-foreground hover:border-foreground/40")}>{e.label}</button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="text-xs font-semibold mb-2 block uppercase tracking-wide text-muted-foreground">Min Rating</label>
                <div className="flex flex-wrap gap-1.5">
                  {RATINGS.map(r => (
                    <button key={r.label} onClick={() => setMinRating(r.value)} className={cn("px-2.5 py-1 rounded-full border text-xs font-medium transition-all flex items-center gap-1", minRating === r.value ? "bg-amber-500 text-white border-amber-500" : "border-border text-muted-foreground hover:border-foreground/40")}>
                      {r.value && <Star className="h-3 w-3" />}{r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sort + clear */}
            <div className="flex items-center justify-between pt-3 border-t">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sort:</span>
                {SORT_OPTIONS.map(s => (
                  <button key={s.value} onClick={() => setSort(s.value)} className={cn("px-2.5 py-1 rounded-full border text-xs font-medium transition-all", sort === s.value ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-foreground/40")}>{s.label}</button>
                ))}
              </div>
              {hasFilters && <button onClick={clearFilters} className="text-xs text-terracotta-500 hover:underline flex items-center gap-1"><X className="h-3 w-3" />Clear filters</button>}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{loading ? "Searching..." : `${total} designer${total !== 1 ? "s" : ""} found`}</p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : designers.length === 0 ? (
          <EmptyState icon={<Users className="h-12 w-12" />} title="No designers found" description={hasFilters || search ? "Try adjusting your filters or search terms" : "No verified designers available yet"} action={hasFilters ? <Button variant="outline" onClick={clearFilters}>Clear Filters</Button> : undefined} />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {designers.map(d => (
              <DesignerCard key={d.id} designer={d} isSaved={savedIds.has(d.id)} onToggleSave={() => toggleSave(d.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DesignersPage() {
  return (
    <Suspense fallback={<div className="py-8"><div className="container mx-auto px-4"><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />)}</div></div></div>}>
      <DesignerBrowse />
    </Suspense>
  );
}
