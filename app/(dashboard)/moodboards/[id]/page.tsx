"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, ExternalLink } from "lucide-react";
import { Button, Badge, EmptyState } from "@/components/ui";

function MoodboardDetail() {
  const params = useParams();
  const [board, setBoard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/moodboards/${params.id}`).then(r => r.json()).then(res => {
      if (res.success) setBoard(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params?.id]);

  async function removeItem(itemId: string) {
    await fetch(`/api/moodboards/${params.id}/items/${itemId}`, { method: "DELETE" });
    setBoard((prev: any) => ({ ...prev, items: prev.items.filter((i: any) => i.id !== itemId) }));
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;
  if (!board)  return <div className="text-center py-12"><p className="text-muted-foreground">Moodboard not found</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/moodboards" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" /></Link>
        <div><h1 className="text-2xl font-bold">{board.title}</h1><p className="text-sm text-muted-foreground">{board.items?.length || 0} items</p></div>
      </div>

      {board.items?.length === 0 ? (
        <EmptyState icon={<span className="text-4xl">📌</span>} title="Empty moodboard" description="Browse the gallery and save inspiring designs here" action={<Button variant="terracotta" asChild><Link href="/inspiration">Browse Gallery</Link></Button>} />
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
          {board.items.map((item: any) => {
            const insp = item.inspiration;
            const img = insp?.featuredImage;
            return (
              <div key={item.id} className="group break-inside-avoid mb-4 relative">
                <div className="rounded-2xl overflow-hidden bg-muted">
                  {img && <img src={img} alt={insp?.title} className="w-full object-cover" />}
                </div>
                <div className="px-1 mt-2">
                  <p className="font-medium text-sm line-clamp-1">{insp?.title}</p>
                  <p className="text-xs text-muted-foreground">{insp?.designStyle} · {insp?.roomType}</p>
                  <div className="flex gap-2 mt-2">
                    <Link href={`/ideas/${insp?.slug}`} className="text-xs text-terracotta-500 hover:underline flex items-center gap-1"><ExternalLink className="h-3 w-3" />View</Link>
                    <button onClick={() => removeItem(item.id)} className="text-xs text-red-400 hover:underline flex items-center gap-1"><Trash2 className="h-3 w-3" />Remove</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function MoodboardDetailPage() {
  return <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>}><MoodboardDetail /></Suspense>;
}
