"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, Heart, X, BookmarkPlus } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

const ROOM_TYPES = ["All","Living Room","Bedroom","Kitchen","Bathroom","Dining Room","Office","Restaurant","Hotel","Outdoor Space","Children Room","Studio Apartment"];
const STYLES     = ["All","Modern","Minimalist","Contemporary","Luxury","Scandinavian","Industrial","Traditional","African Contemporary","Bohemian","Eclectic"];
const SORT_OPTS  = [{ v:"newest", l:"Newest" },{ v:"most_saved", l:"Most Saved" },{ v:"most_viewed", l:"Most Viewed" }];

function InspirationCard({ item, onSave }: { item: any; onSave: (id: string) => void }) {
  const images = [item.featuredImage, ...(item.images?.map((i: any) => i.imageUrl) || [])].filter(Boolean);
  const designer = item.designer?.user;
  return (
    <div className="group break-inside-avoid mb-4">
      <Link href={`/ideas/${item.slug}`} className="block">
        <div className="relative rounded-2xl overflow-hidden bg-muted">
          <img src={images[0]} alt={item.title} className="w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
          <div className="absolute bottom-0 inset-x-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex gap-2">
              <button onClick={e => { e.preventDefault(); onSave(item.id); }} className="flex-1 bg-white text-sm font-semibold py-2 rounded-lg hover:bg-terracotta-500 hover:text-white transition-colors flex items-center justify-center gap-1.5">
                <BookmarkPlus className="h-3.5 w-3.5" />Save
              </button>
              <Link href={`/ideas/${item.slug}`} onClick={e => e.stopPropagation()} className="flex-1 bg-terracotta-500 text-white text-sm font-semibold py-2 rounded-lg hover:bg-terracotta-600 transition-colors flex items-center justify-center">
                View
              </Link>
            </div>
          </div>
          {item.isFeatured && <div className="absolute top-2 left-2"><Badge className="bg-amber-400 text-amber-900 text-[10px]">Featured</Badge></div>}
        </div>
      </Link>
      <div className="px-1 mt-2">
        <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{item.designStyle} · {item.roomType}</p>
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Heart className="h-3 w-3" />{item.saveCount}</span>
        </div>
        {designer && <Link href={`/designers/${item.designerId}`} className="flex items-center gap-1.5 mt-1.5 group/d">
          <div className="h-5 w-5 rounded-full bg-terracotta-100 flex items-center justify-center text-[9px] font-bold text-terracotta-600">{designer.firstName?.[0]}</div>
          <span className="text-xs text-muted-foreground group-hover/d:text-terracotta-500 transition-colors">{designer.firstName} {designer.lastName}</span>
        </Link>}
      </div>
    </div>
  );
}

function GalleryBrowse() {
  const searchParams = useSearchParams();
  const [items,      setItems]      = useState<any[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState(searchParams?.get("q") || "");
  const [roomType,   setRoomType]   = useState(searchParams?.get("room") || "All");
  const [style,      setStyle]      = useState(searchParams?.get("style") || "All");
  const [sort,       setSort]       = useState("newest");
  const [showFilter, setShowFilter] = useState(false);
  const [page,       setPage]       = useState(1);
  const [saveModal,  setSaveModal]  = useState<string|null>(null);

  const load = useCallback((reset = false) => {
    const p = new URLSearchParams({ limit: "24", page: reset ? "1" : String(page) });
    if (search)              p.set("search", search);
    if (roomType !== "All")  p.set("roomType", roomType);
    if (style    !== "All")  p.set("style", style);
    p.set("sort", sort);
    setLoading(true);
    fetch(`/api/inspirations?${p}`).then(r => r.json()).then(res => {
      if (res.success) {
        setItems(prev => reset ? (res.data?.items || []) : [...prev, ...(res.data?.items || [])]);
        setTotal(res.data?.pagination?.total || 0);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [search, roomType, style, sort, page]);

  useEffect(() => { setPage(1); load(true); }, [search, roomType, style, sort]);
  useEffect(() => { if (page > 1) load(); }, [page]);

  function handleSave(inspirationId: string) { setSaveModal(inspirationId); }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-terracotta-600 to-earth-800 text-white py-16 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h1 className="text-3xl lg:text-5xl font-black mb-3">Design Inspiration</h1>
          <p className="text-white/80 mb-8 text-lg">Discover ideas from Nigeria's top interior designers. Save to your moodboard. Turn ideas into projects.</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by style, room, designer, location…" className="w-full h-14 rounded-2xl pl-12 pr-4 text-foreground bg-white text-base shadow-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8">
        {/* Filter bar */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
          <button onClick={() => setShowFilter(!showFilter)} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-all shrink-0", showFilter ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border")}>
            <SlidersHorizontal className="h-3.5 w-3.5" />Filters
          </button>
          {ROOM_TYPES.map(r => <button key={r} onClick={() => setRoomType(r)} className={cn("px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-all shrink-0", roomType === r ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border text-muted-foreground hover:border-foreground/40")}>{r}</button>)}
        </div>

        {showFilter && (
          <div className="p-4 rounded-xl border bg-muted/20 mb-6">
            <div className="grid sm:grid-cols-3 gap-4">
              <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Style</label>
                <select value={style} onChange={e => setStyle(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select></div>
              <div><label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Sort By</label>
                <select value={sort} onChange={e => setSort(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                  {SORT_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select></div>
              <div className="flex items-end"><button onClick={() => { setRoomType("All"); setStyle("All"); setSort("newest"); }} className="text-xs text-terracotta-500 hover:underline flex items-center gap-1"><X className="h-3 w-3" />Clear all</button></div>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground mb-6">{loading && items.length === 0 ? "Loading…" : `${total} inspiration${total !== 1 ? "s" : ""}`}</p>

        {/* Masonry grid */}
        {loading && items.length === 0 ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
            {Array.from({length: 12}).map((_,i) => <div key={i} className={cn("break-inside-avoid mb-4 rounded-2xl bg-muted animate-pulse", i % 3 === 0 ? "h-64" : i % 3 === 1 ? "h-48" : "h-72")} />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20"><p className="text-2xl mb-2">✨</p><p className="font-semibold text-lg">No inspirations found</p><p className="text-muted-foreground mt-1">Try different filters or search terms</p></div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-4">
            {items.map(item => <InspirationCard key={item.id} item={item} onSave={handleSave} />)}
          </div>
        )}

        {/* Load more */}
        {items.length < total && !loading && (
          <div className="text-center mt-10"><Button variant="outline" onClick={() => setPage(prev => prev + 1)} className="px-8">Load More</Button></div>
        )}
        {loading && items.length > 0 && <div className="flex justify-center mt-8"><div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-terracotta-500" /></div>}
      </div>

      {/* Save Modal */}
      {saveModal && <SaveModal inspirationId={saveModal} onClose={() => setSaveModal(null)} />}
    </div>
  );
}

function SaveModal({ inspirationId, onClose }: { inspirationId: string; onClose: () => void }) {
  const [boards, setBoards]     = useState<any[]>([]);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    fetch("/api/moodboards").then(r => r.json()).then(res => {
      if (res.success) setBoards(res.data || []);
      setBoardsLoading(false);
    }).catch(() => { setBoardsLoading(false); });
  }, []);

  async function saveToBoard(boardId: string) {
    setSaving(true);
    await fetch(`/api/moodboards/${boardId}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inspirationId }) });
    setSaving(false);
    onClose();
  }

  async function createAndSave() {
    if (!newTitle.trim()) return;
    setSaving(true);
    const res = await fetch("/api/moodboards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTitle }) });
    const json = await res.json();
    if (json.success) await saveToBoard(json.data.id);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-background rounded-2xl w-full max-w-sm p-5 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4"><h3 className="font-bold">Save to Moodboard</h3><button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button></div>
        {boardsLoading ? <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-terracotta-500" /></div> : (
          <div className="space-y-2 max-h-52 overflow-y-auto mb-4">
            {boards.map(b => (
              <button key={b.id} onClick={() => saveToBoard(b.id)} disabled={saving} className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-terracotta-400 hover:bg-terracotta-50/20 transition-all text-left">
                <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">{b.items?.[0]?.inspiration?.featuredImage && <img src={b.items[0].inspiration.featuredImage} alt="" className="h-full w-full object-cover" />}</div>
                <div><p className="font-medium text-sm">{b.title}</p><p className="text-xs text-muted-foreground">{b._count?.items || 0} items</p></div>
              </button>
            ))}
            {boards.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No moodboards yet</p>}
          </div>
        )}
        <div className="border-t pt-4">
          <p className="text-xs font-semibold text-muted-foreground mb-2">CREATE NEW MOODBOARD</p>
          <div className="flex gap-2">
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. My Dream Kitchen" className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm" onKeyDown={e => e.key === "Enter" && createAndSave()} />
            <Button variant="terracotta" size="sm" onClick={createAndSave} disabled={saving || !newTitle.trim()}>Create</Button>
          </div>
        </div>
        <div className="mt-3"><Link href="/login" className="text-xs text-muted-foreground hover:text-terracotta-500 transition-colors">Not logged in? Sign in to save →</Link></div>
      </div>
    </div>
  );
}

export default function InspirationPage() {
  return <Suspense fallback={<div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>}><GalleryBrowse /></Suspense>;
}
