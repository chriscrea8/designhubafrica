"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, Heart, Share2, BookmarkPlus, Eye, Star, MapPin, Calendar, Ruler, DollarSign, ChevronLeft, ChevronRight, MessageSquare, FolderPlus, X } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";

function InspirationDetail() {
  const params   = useParams();
  const router   = useRouter();
  const { data: session } = useSession();
  const [item,     setItem]     = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [imgIdx,   setImgIdx]   = useState(0);
  const [showSave, setShowSave] = useState(false);
  const [boards,   setBoards]   = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    if (!params?.slug) return;
    fetch(`/api/inspirations/${params.slug}`).then(r => r.json()).then(res => {
      if (res.success) setItem(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params?.slug]);

  useEffect(() => {
    if (showSave && session) {
      fetch("/api/moodboards").then(r => r.json()).then(res => { if (res.success) setBoards(res.data || []); });
    }
  }, [showSave, session]);

  async function saveToBoard(boardId: string) {
    setSaving(true);
    await fetch(`/api/moodboards/${boardId}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inspirationId: item.id }) });
    setSaving(false); setSaved(true); setShowSave(false);
  }

  async function createAndSave() {
    if (!newTitle.trim()) return;
    setSaving(true);
    const res = await fetch("/api/moodboards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTitle }) });
    const json = await res.json();
    if (json.success) await saveToBoard(json.data.id);
  }

  function trackCTA(type: "consultation" | "project") {
    fetch(`/api/inspirations/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [type === "consultation" ? "consultationClicks" : "projectClicks"]: { increment: 1 } }) }).catch(() => {});
  }

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;
  if (!item)   return <div className="text-center py-24"><p className="text-muted-foreground">Not found</p><Link href="/inspiration" className="text-terracotta-500 text-sm mt-2 inline-block">← Browse gallery</Link></div>;

  const allImages = [item.featuredImage, ...(item.images?.map((i: any) => i.imageUrl) || [])].filter(Boolean);
  const designer  = item.designer;
  const dUser     = designer?.user;

  return (
    <div className="min-h-screen bg-background">
      {/* Back nav */}
      <div className="border-b sticky top-0 bg-background/95 backdrop-blur z-30">
        <div className="container mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/inspiration" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Gallery</Link>
          <div className="flex gap-2">
            <button onClick={() => { if (!session) { router.push("/login"); return; } setShowSave(true); }} className={cn("flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm font-medium transition-colors", saved ? "bg-terracotta-50 border-terracotta-300 text-terracotta-600" : "border-border hover:border-terracotta-400")}>
              <BookmarkPlus className="h-3.5 w-3.5" />{saved ? "Saved!" : "Save"}
            </button>
            <button onClick={() => { navigator.share?.({ title: item.title, url: window.location.href }); }} className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-sm font-medium border-border hover:bg-accent">
              <Share2 className="h-3.5 w-3.5" />Share
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Images */}
          <div className="lg:col-span-2 space-y-3">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-muted">
              <img src={allImages[imgIdx]} alt={item.title} className="h-full w-full object-cover" />
              {allImages.length > 1 && (<>
                <button onClick={() => setImgIdx(prev => (prev - 1 + allImages.length) % allImages.length)} className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"><ChevronLeft className="h-5 w-5" /></button>
                <button onClick={() => setImgIdx(prev => (prev + 1) % allImages.length)} className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60"><ChevronRight className="h-5 w-5" /></button>
                <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">{imgIdx + 1}/{allImages.length}</div>
              </>)}
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img: string, i: number) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={cn("h-16 w-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all", imgIdx === i ? "border-terracotta-500" : "border-transparent")}>
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Project details */}
            <Card><CardContent className="p-5">
              <h1 className="text-2xl font-bold">{item.title}</h1>
              <div className="flex flex-wrap gap-2 mt-2 mb-4">
                <Badge variant="secondary">{item.roomType}</Badge>
                <Badge variant="secondary">{item.designStyle}</Badge>
                {item.isFeatured && <Badge className="bg-amber-100 text-amber-700">Featured</Badge>}
              </div>
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              <div className="grid sm:grid-cols-2 gap-4 mt-5 pt-5 border-t text-sm">
                {item.projectLocation && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 shrink-0 text-terracotta-500" />{item.projectLocation}</div>}
                {item.budgetRange     && <div className="flex items-center gap-2 text-muted-foreground"><DollarSign className="h-4 w-4 shrink-0 text-terracotta-500" />{item.budgetRange}</div>}
                {item.projectSize     && <div className="flex items-center gap-2 text-muted-foreground"><Ruler className="h-4 w-4 shrink-0 text-terracotta-500" />{item.projectSize}</div>}
                {item.completionDate  && <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4 shrink-0 text-terracotta-500" />{formatDate(item.completionDate)}</div>}
                <div className="flex items-center gap-2 text-muted-foreground"><Eye className="h-4 w-4 shrink-0" />{item.viewCount} views</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Heart className="h-4 w-4 shrink-0" />{item.saveCount} saves</div>
              </div>
            </CardContent></Card>
          </div>

          {/* Right: Designer card + CTAs */}
          <div className="space-y-4">
            {designer && dUser && (
              <Card className="border-terracotta-200 bg-terracotta-50/10">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Designer</p>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-terracotta-100 flex items-center justify-center text-2xl font-bold text-terracotta-600 shrink-0">{dUser.firstName?.[0]}</div>
                    <div>
                      <p className="font-bold">{dUser.firstName} {dUser.lastName}</p>
                      {dUser.location && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{dUser.location}</p>}
                      {designer.avgRating > 0 && <div className="flex items-center gap-1 mt-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /><span className="text-xs font-medium">{designer.avgRating}</span><span className="text-xs text-muted-foreground">({designer.totalReviews})</span></div>}
                    </div>
                  </div>

                  {/* Lead gen CTAs */}
                  <div className="space-y-2">
                    <Link href={`/designers/${item.designerId}`} onClick={() => {}} className="flex">
                      <Button variant="outline" className="w-full gap-2 text-sm">View Designer Profile</Button>
                    </Link>
                    <Link href={`/designers/${item.designerId}?book=true`} onClick={() => trackCTA("consultation")} className="flex">
                      <Button variant="terracotta" className="w-full gap-2 text-sm"><MessageSquare className="h-4 w-4" />Book Consultation</Button>
                    </Link>
                    <Link href={`/projects/new?designerId=${item.designerId}&style=${item.designStyle}&room=${item.roomType}`} onClick={() => trackCTA("project")} className="flex">
                      <Button variant="outline" className="w-full gap-2 text-sm border-terracotta-300 text-terracotta-600 hover:bg-terracotta-50"><FolderPlus className="h-4 w-4" />Start Similar Project</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save to moodboard */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-2">Save this idea</p>
                <p className="text-xs text-muted-foreground mb-3">Add to your moodboard and reference when meeting your designer</p>
                <Button variant="outline" className="w-full gap-2" onClick={() => session ? setShowSave(true) : router.push("/login")}>
                  <BookmarkPlus className="h-4 w-4" />{saved ? "Saved to Moodboard ✓" : "Save to Moodboard"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Save to moodboard modal */}
      {showSave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowSave(false)}>
          <div className="bg-background rounded-2xl w-full max-w-sm p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold">Save to Moodboard</h3><button onClick={() => setShowSave(false)}><X className="h-5 w-5 text-muted-foreground" /></button></div>
            <div className="space-y-2 max-h-52 overflow-y-auto mb-4">
              {boards.map(b => <button key={b.id} onClick={() => saveToBoard(b.id)} disabled={saving} className="w-full flex items-center gap-3 p-3 rounded-xl border hover:border-terracotta-400 hover:bg-terracotta-50/20 transition-all text-left">
                <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">{b.items?.[0]?.inspiration?.featuredImage && <img src={b.items[0].inspiration.featuredImage} alt="" className="h-full w-full object-cover" />}</div>
                <div><p className="font-medium text-sm">{b.title}</p><p className="text-xs text-muted-foreground">{b._count?.items || 0} items</p></div>
              </button>)}
              {boards.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No moodboards yet</p>}
            </div>
            <div className="border-t pt-4 space-y-2">
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="New moodboard name…" className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm" />
              <Button variant="terracotta" className="w-full" onClick={createAndSave} disabled={saving || !newTitle.trim()}>Create & Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InspirationDetailPage() {
  return <Suspense fallback={<div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>}><InspirationDetail /></Suspense>;
}
