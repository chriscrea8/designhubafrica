"use client";
import React, { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Plus, Eye, Trash2, Edit, Share2, Upload, Loader2, X, CheckCircle2, ExternalLink, Save } from "lucide-react";
import { Card, CardContent, Button, Badge, EmptyState, Input, Separator } from "@/components/ui";
import { cn } from "@/lib/utils";

const categories = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Full Home", "Office", "Commercial", "Outdoor"];
const styles = ["African Fusion", "Modern", "Minimalist", "Contemporary", "Industrial", "Scandinavian", "Bohemian"];

export default function PortfolioPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [form, setForm] = useState({ title: "", description: "", category: "Living Room", style: "Modern", location: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadPortfolio() {
    const res = await fetch("/api/portfolio"); const json = await res.json();
    if (json.success) setItems(json.data || []);
    setLoading(false);
  }

  useEffect(() => { loadPortfolio(); }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files; if (!files) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append("file", file); fd.append("folder", "portfolio");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) setUploadedImages(prev => [...prev, json.data.url]);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const [saveError, setSaveError] = useState("");

  async function saveProject() {
    if (!form.title) { setSaveError("Title is required"); return; }
    setSaving(true);
    setSaveError("");
    const body = { ...form, images: uploadedImages };
    let res;
    try {
      if (editing) {
        res = await fetch(`/api/portfolio/${editing}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        res = await fetch("/api/portfolio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      const json = await res.json();
      setSaving(false);
      if (json.success) { setShowAdd(false); setEditing(null); setForm({ title: "", description: "", category: "Living Room", style: "Modern", location: "" }); setUploadedImages([]); loadPortfolio(); }
      else { setSaveError(json.error || "Failed to save. Make sure you have a designer profile."); }
    } catch (e) {
      setSaving(false);
      setSaveError("Network error. Please try again.");
    }
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this portfolio project? This cannot be undone.")) return;
    await fetch(`/api/portfolio/${id}`, { method: "DELETE" });
    loadPortfolio();
  }

  function startEdit(item: any) {
    setForm({ title: item.title, description: item.description || "", category: item.category || "Living Room", style: item.style || "Modern", location: item.location || "" });
    setUploadedImages(item.images || []);
    setEditing(item.id);
    setShowAdd(true);
  }

  function shareProject(item: any) {
    const url = `${window.location.origin}/portfolio/${item.id}`;
    navigator.clipboard.writeText(url);
    alert(`Link copied!\n${url}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">My Portfolio</h1><p className="text-sm text-muted-foreground mt-1">{items.length} project{items.length !== 1 ? "s" : ""}</p></div>
        <Button variant="terracotta" size="sm" className="gap-2" onClick={() => { setShowAdd(!showAdd); if (showAdd) { setEditing(null); setForm({ title: "", description: "", category: "Living Room", style: "Modern", location: "" }); setUploadedImages([]); } }}>{showAdd ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}{showAdd ? "Cancel" : "Add Project"}</Button>
      </div>

      {showAdd && (
        <Card className="border-terracotta-200 bg-terracotta-50/20"><CardContent className="p-5 space-y-4">
          <h3 className="font-semibold">{editing ? "Edit Project" : "Add Portfolio Project"}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Project Title *</label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Lekki Villa Living Room" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Location</label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="e.g. Lagos, Nigeria" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1.5 block">Category</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">{categories.map(c => <option key={c}>{c}</option>)}</select></div>
            <div><label className="text-sm font-medium mb-1.5 block">Style</label><select value={form.style} onChange={e => setForm({...form, style: e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">{styles.map(s => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe this project..." /></div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Images</label>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            <div className="flex flex-wrap gap-3">
              {uploadedImages.map((url, i) => (<div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border"><img src={url} alt="" className="h-full w-full object-cover" /><button onClick={() => setUploadedImages(prev => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center"><X className="h-3 w-3 text-white" /></button></div>))}
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="h-20 w-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:border-terracotta-300">{uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <><Upload className="h-5 w-5 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Upload</span></>}</button>
            </div>
          </div>
          <Button variant="terracotta" onClick={saveProject} disabled={!form.title || saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{editing ? "Update Project" : "Save Project"}</Button>
          {saveError && <p className="text-sm text-red-500 mt-2">{saveError}</p>}
        </CardContent></Card>
      )}

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>
      : items.length === 0 && !showAdd ? <EmptyState icon={<Eye className="h-12 w-12" />} title="No portfolio items" description="Add your best work to attract clients" action={<Button variant="terracotta" className="gap-2" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4" />Add First Project</Button>} />
      : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{items.map(item => (
        <Card key={item.id} className="group overflow-hidden">
          <div className="relative aspect-[4/3] bg-gradient-to-br from-terracotta-100 to-earth-200">
            {item.images?.[0] ? <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">✦</div>}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => shareProject(item)} className="h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white" title="Share"><ExternalLink className="h-3.5 w-3.5" /></button>
              <button onClick={() => startEdit(item)} className="h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white" title="Edit"><Edit className="h-3.5 w-3.5" /></button>
              <button onClick={() => deleteProject(item.id)} className="h-7 w-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-red-50" title="Delete"><Trash2 className="h-3.5 w-3.5 text-red-500" /></button>
            </div>
          </div>
          <CardContent className="p-4"><h3 className="font-semibold text-sm">{item.title}</h3><p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p><div className="flex gap-1.5 mt-2"><Badge variant="secondary" className="text-[10px]">{item.category}</Badge><Badge variant="secondary" className="text-[10px]">{item.style}</Badge></div></CardContent>
        </Card>
      ))}</div>}
    </div>
  );
}
