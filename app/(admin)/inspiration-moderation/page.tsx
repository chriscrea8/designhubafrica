"use client";
import React, { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Star, Trash2, Eye, Heart, Loader2 } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";

const STATUS_STYLE: Record<string,string> = { PUBLISHED:"bg-emerald-50 text-emerald-700", DRAFT:"bg-amber-50 text-amber-700", ARCHIVED:"bg-gray-100 text-gray-500" };

export default function InspirationModerationPage() {
  const [items,   setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("DRAFT");
  const [acting,  setActing]  = useState<string|null>(null);

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/inspirations?status=${filter}`).then(r => r.json()).catch(() => ({}));
    if (res.success) setItems(res.data || []);
    setLoading(false);
  }

  async function act(id: string, action: string) {
    setActing(id + action);
    await fetch("/api/admin/inspirations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    setActing(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Inspiration Moderation</h1><p className="text-sm text-muted-foreground mt-1">Approve, feature, and manage gallery content</p></div>
      <div className="flex gap-2 flex-wrap">
        {["DRAFT","PUBLISHED","ARCHIVED","ALL"].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={cn("px-4 py-1.5 rounded-full text-sm font-medium border transition-all capitalize", filter === s ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border text-muted-foreground hover:border-foreground/40")}>{s.toLowerCase()}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-7 w-7 border-t-2 border-b-2 border-terracotta-500" /></div>
      : items.length === 0 ? <p className="text-center text-muted-foreground py-10">No {filter.toLowerCase()} inspirations</p>
      : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-[16/10] overflow-hidden bg-muted">
                <img src={item.featuredImage} alt={item.title} className="h-full w-full object-cover" />
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div><h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3><p className="text-xs text-muted-foreground">{item.designer?.user?.firstName} {item.designer?.user?.lastName}</p></div>
                  <Badge className={cn("text-[10px] shrink-0", STATUS_STYLE[item.status]||"")}>{item.status}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3"/>{item.viewCount}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3"/>{item.saveCount}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {item.status !== "PUBLISHED" && <Button size="sm" variant="terracotta" onClick={() => act(item.id,"approve")} disabled={!!acting} className="gap-1 text-xs h-7">
                    {acting===item.id+"approve"?<Loader2 className="h-3 w-3 animate-spin"/>:<CheckCircle2 className="h-3 w-3"/>}Approve
                  </Button>}
                  {item.status === "PUBLISHED" && !item.isFeatured && <Button size="sm" variant="outline" onClick={() => act(item.id,"feature")} disabled={!!acting} className="gap-1 text-xs h-7 text-amber-600 border-amber-200">
                    {acting===item.id+"feature"?<Loader2 className="h-3 w-3 animate-spin"/>:<Star className="h-3 w-3"/>}Feature
                  </Button>}
                  {item.isFeatured && <Button size="sm" variant="outline" onClick={() => act(item.id,"unfeature")} disabled={!!acting} className="gap-1 text-xs h-7">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400"/>Unfeature
                  </Button>}
                  {item.status !== "ARCHIVED" && <Button size="sm" variant="outline" onClick={() => act(item.id,"reject")} disabled={!!acting} className="gap-1 text-xs h-7 text-red-500 border-red-200">
                    {acting===item.id+"reject"?<Loader2 className="h-3 w-3 animate-spin"/>:<XCircle className="h-3 w-3"/>}Reject
                  </Button>}
                  <Button size="sm" variant="outline" onClick={() => act(item.id,"remove")} disabled={!!acting} className="gap-1 text-xs h-7 text-red-500">
                    <Trash2 className="h-3 w-3"/>Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>}
    </div>
  );
}
