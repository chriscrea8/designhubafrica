"use client";
import React, { useEffect, useState } from "react";
import { Heart, Search } from "lucide-react";
import { EmptyState, Button } from "@/components/ui";
import { DesignerCard } from "@/components/cards";
import Link from "next/link";

export default function SavedDesignersPage() {
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/saved-designers").then(r => r.json()).then(res => {
      if (res.success) setSaved(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function unsave(designerId: string) {
    await fetch("/api/saved-designers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ designerId }) });
    setSaved(prev => prev.filter(d => d.id !== designerId));
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Saved Designers</h1><p className="text-sm text-muted-foreground mt-1">{saved.length} designer{saved.length !== 1 ? "s" : ""} saved</p></div>
        <Button variant="terracotta" asChild><Link href="/designers" className="gap-2"><Search className="h-4 w-4" />Browse More</Link></Button>
      </div>
      {saved.length === 0
        ? <EmptyState icon={<Heart className="h-12 w-12" />} title="No saved designers" description="Browse designers and click the heart icon to save your favourites" action={<Button variant="terracotta" asChild><Link href="/designers">Find Designers</Link></Button>} />
        : <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{saved.map(d => <div key={d.id} className="relative"><DesignerCard designer={d} /><button onClick={() => unsave(d.id)} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-red-50" title="Remove"><Heart className="h-4 w-4 fill-red-400 text-red-400" /></button></div>)}</div>}
    </div>
  );
}
