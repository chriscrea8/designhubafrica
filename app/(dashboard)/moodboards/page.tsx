"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Edit2, BookmarkPlus, X, Loader2, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, Button, EmptyState } from "@/components/ui";

export default function MoodboardsPage() {
  const [boards,   setBoards]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [saving,   setSaving]   = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/moodboards").then(r => r.json()).catch(() => ({}));
    if (res.success) setBoards(res.data || []);
    setLoading(false);
  }

  async function create() {
    if (!newTitle.trim()) return;
    setSaving(true);
    const res = await fetch("/api/moodboards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: newTitle }) });
    const json = await res.json();
    setSaving(false);
    if (json.success) { setBoards(prev => [json.data, ...prev]); setCreating(false); setNewTitle(""); }
  }

  async function del(id: string) {
    if (!confirm("Delete this moodboard?")) return;
    await fetch(`/api/moodboards/${id}`, { method: "DELETE" });
    setBoards(prev => prev.filter(b => b.id !== id));
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">My Moodboards</h1><p className="text-sm text-muted-foreground mt-1">Save design inspiration and share with your designer</p></div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/inspiration">Browse Gallery</Link></Button>
          <Button variant="terracotta" onClick={() => setCreating(true)} className="gap-2"><Plus className="h-4 w-4" />New Moodboard</Button>
        </div>
      </div>

      {creating && (
        <div className="flex gap-2 p-4 rounded-xl border bg-muted/20">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Moodboard name (e.g. Dream Living Room)…" className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm" autoFocus onKeyDown={e => e.key === "Enter" && create()} />
          <Button variant="terracotta" onClick={create} disabled={saving || !newTitle.trim()} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Create</Button>
          <Button variant="outline" onClick={() => { setCreating(false); setNewTitle(""); }}><X className="h-4 w-4" /></Button>
        </div>
      )}

      {boards.length === 0 && !creating ? (
        <EmptyState icon={<BookmarkPlus className="h-12 w-12" />} title="No moodboards yet" description="Browse the gallery and save inspiring designs to your moodboards" action={<Button variant="terracotta" asChild><Link href="/inspiration">Browse Gallery</Link></Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map(b => (
            <Card key={b.id} className="group overflow-hidden hover:shadow-md transition-shadow">
              <Link href={`/moodboards/${b.id}`}>
                <div className="grid grid-cols-2 gap-0.5 h-40 bg-muted">
                  {[0,1,2,3].map(i => {
                    const img = b.items?.[i]?.inspiration?.featuredImage;
                    return <div key={i} className="bg-muted overflow-hidden">{img ? <img src={img} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="h-full w-full flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground/40" /></div>}</div>;
                  })}
                </div>
              </Link>
              <CardContent className="p-4 flex items-center justify-between">
                <div><Link href={`/moodboards/${b.id}`} className="font-semibold hover:text-terracotta-500 transition-colors">{b.title}</Link><p className="text-xs text-muted-foreground mt-0.5">{b._count?.items || 0} items</p></div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-accent"><Edit2 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => del(b.id)} className="h-8 w-8 rounded-lg border flex items-center justify-center hover:bg-red-50 text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
