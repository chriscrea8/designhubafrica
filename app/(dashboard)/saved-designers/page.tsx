"use client";
import React, { useEffect, useState } from "react";
import { Heart, Search } from "lucide-react";
import { EmptyState, Button, Badge } from "@/components/ui";
import { DesignerCard } from "@/components/cards";

import Link from "next/link";

export default function SavedDesignersPage() {
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production this would fetch from /api/saved-designers
    // For now use mock data as placeholder
    setTimeout(() => { setSaved([]); setLoading(false); }, 500);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Saved Designers</h1><p className="text-sm text-muted-foreground mt-1">{saved.length} designer{saved.length !== 1 ? "s" : ""} bookmarked</p></div>
        <Button variant="terracotta" asChild><Link href="/designers" className="gap-2"><Search className="h-4 w-4" />Browse More</Link></Button>
      </div>
      {loading ? <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">{[1,2].map(i => <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />)}</div>
      : saved.length === 0 ? <EmptyState icon={<Heart className="h-12 w-12" />} title="No saved designers" description="Browse designers and bookmark your favorites for future projects" action={<Button variant="terracotta" asChild><Link href="/designers">Find Designers</Link></Button>} />
      : <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{saved.map(d => <DesignerCard key={d.id} designer={d} />)}</div>}
    </div>
  );
}
