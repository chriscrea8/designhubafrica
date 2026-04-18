"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Users } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { DesignerCard } from "@/components/cards";
import { cn } from "@/lib/utils";

const LOCATIONS = ["All", "Lagos", "Abuja", "Accra", "Nairobi"];
const STYLES = ["All", "Modern", "Minimalist", "African Fusion", "Contemporary", "Industrial", "Scandinavian"];
const SORT_OPTIONS = [{ value: "rating", label: "Top Rated" }, { value: "experience", label: "Most Experienced" }];

function DesignersContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams?.get("search") || "");
  const [designers, setDesigners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [locationFilter, setLocationFilter] = useState("All");
  const [styleFilter, setStyleFilter] = useState("All");

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    p.set("limit", "20");
    fetch(`/api/designers?${p}`).then(r => r.json()).then(res => {
      if (res.success) setDesigners(res.data?.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [search]);

  // Client-side filters on top of API results
  let filtered = designers;
  if (locationFilter !== "All") filtered = filtered.filter(d => (d.user?.location || "").toLowerCase().includes(locationFilter.toLowerCase()));
  if (styleFilter !== "All") filtered = filtered.filter(d => (d.specialties || []).some((s: string) => s.toLowerCase().includes(styleFilter.toLowerCase())));

  return (
    <div className="py-8 lg:py-12"><div className="container mx-auto px-4 lg:px-8">
      <div className="mb-8"><h1 className="text-3xl lg:text-4xl font-bold">Find Your Designer</h1><p className="mt-2 text-muted-foreground">Browse verified interior designers across Africa</p></div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or location..." className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />{search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-muted-foreground" /></button>}</div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="h-11 gap-2"><SlidersHorizontal className="h-4 w-4" />Filters</Button>
      </div>

      {showFilters && <div className="p-4 rounded-lg border bg-muted/30 mb-6 space-y-4">
        <div><label className="text-xs font-medium mb-2 block uppercase tracking-wide text-muted-foreground">Location</label><div className="flex flex-wrap gap-2">{LOCATIONS.map(l => <button key={l} onClick={() => setLocationFilter(l)} className={cn("px-3 py-1 rounded-full border text-xs font-medium", locationFilter === l ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border text-muted-foreground")}>{l}</button>)}</div></div>
        <div><label className="text-xs font-medium mb-2 block uppercase tracking-wide text-muted-foreground">Style</label><div className="flex flex-wrap gap-2">{STYLES.map(s => <button key={s} onClick={() => setStyleFilter(s)} className={cn("px-3 py-1 rounded-full border text-xs font-medium", styleFilter === s ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border text-muted-foreground")}>{s}</button>)}</div></div>
      </div>}

      <p className="text-sm text-muted-foreground mb-4">{filtered.length} designer{filtered.length !== 1 ? "s" : ""} found</p>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-12 w-12" />} title="No designers found" description={search ? "Try a different search term or adjust filters" : "No verified designers available yet"} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{filtered.map(d => <DesignerCard key={d.id} designer={d} />)}</div>
      )}
    </div></div>
  );
}

export default function DesignersPage() {
  return <Suspense fallback={<div className="py-8"><div className="container mx-auto px-4"><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />)}</div></div></div>}><DesignersContent /></Suspense>;
}
