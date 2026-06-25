"use client";
import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Eye, Heart, CheckCircle2, Clock, Archive, Loader2, X, Upload } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";

const ROOM_TYPES = ["Living Room","Bedroom","Kitchen","Bathroom","Dining Room","Office","Restaurant","Hotel","Outdoor Space","Children Room","Studio Apartment"];
const STYLES     = ["Modern","Minimalist","Contemporary","Luxury","Scandinavian","Industrial","Traditional","African Contemporary","Bohemian","Eclectic"];
const STATUS_STYLE: Record<string,string> = { PUBLISHED:"bg-emerald-50 text-emerald-700", DRAFT:"bg-amber-50 text-amber-700", ARCHIVED:"bg-gray-100 text-gray-500" };
const BLANK = { title:"", description:"", roomType:"", designStyle:"", budgetRange:"", projectLocation:"", projectSize:"", completionDate:"", featuredImage:"" };

export default function DesignerInspirationsPage() {
  const [items,    setItems]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState<string|null>(null);
  const [form,     setForm]     = useState<any>(BLANK);
  const [images,   setImages]   = useState<string[]>([]);
  const [saving,   setSaving]   = useState(false);
  const [uploading,setUploading]= useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/inspirations?mine=true").then(r => r.json()).catch(() => ({}));
    if (res.success) setItems(res.data?.items || []);
    setLoading(false);
  }

  async function uploadImg(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append("file", file); fd.append("folder", "inspirations");
    const res = await fetch("/api/upload", { method: "POST", body: fd }).then(r => r.json());
    setUploading(false);
    if (res.success) {
      if (!form.featuredImage) setForm((prev: any) => ({ ...prev, featuredImage: res.data.url }));
      else setImages(prev => [...prev, res.data.url]);
    }
    if (e.target) e.target.value = "";
  }

  async function save(status = "DRAFT") {
    setError("");
    if (!form.title || !form.description || !form.roomType || !form.designStyle || !form.featuredImage) { setError("Title, description, room type, style and at least 1 photo required"); return; }
    setSaving(true);
    const url = editId ? `/api/inspirations/${editId}` : "/api/inspirations";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, status, images }) });
    const json = await res.json();
    setSaving(false);
    if (json.success) { setShowForm(false); load(); }
    else setError(json.error || "Failed");
  }

  async function del(id: string) {
    if (!confirm("Delete this inspiration?")) return;
    await fetch(`/api/inspirations/${id}`, { method: "DELETE" });
    load();
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Inspiration Gallery</h1><p className="text-sm text-muted-foreground mt-1">Showcase your work. Published inspirations generate leads.</p></div>
        {!showForm && <Button variant="terracotta" onClick={() => { setForm(BLANK); setImages([]); setEditId(null); setShowForm(true); }} className="gap-2"><Plus className="h-4 w-4" />Add Project</Button>}
      </div>

      {showForm && <Card className="border-terracotta-200"><CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between"><h3 className="font-semibold">{editId ? "Edit Inspiration" : "New Inspiration"}</h3><button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button></div>
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Image upload */}
        <div>
          <label className="text-sm font-medium mb-2 block">Photos <span className="text-red-500">*</span></label>
          <div className="flex flex-wrap gap-2">
            {form.featuredImage && <div className="relative h-20 w-20 rounded-xl overflow-hidden border-2 border-terracotta-300"><img src={form.featuredImage} alt="" className="h-full w-full object-cover" /><div className="absolute top-0 left-0 bg-terracotta-500 text-white text-[9px] px-1">Cover</div></div>}
            {images.map((url, i) => <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden border"><img src={url} alt="" className="h-full w-full object-cover" /><button onClick={() => setImages(prev => prev.filter((_,j) => j !== i))} className="absolute top-0.5 right-0.5 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="h-3 w-3" /></button></div>)}
            <label className="h-20 w-20 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/40">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
              <input type="file" accept="image/*" className="hidden" onChange={uploadImg} disabled={uploading} />
            </label>
          </div>
          <p className="text-xs text-muted-foreground mt-1">First photo becomes the cover</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Title <span className="text-red-500">*</span></label><input value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="e.g. Lekki Penthouse — Modern African Fusion" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Room Type <span className="text-red-500">*</span></label>
            <select value={form.roomType} onChange={e => setForm({...form, roomType:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select…</option>
              {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
            </select></div>
          <div><label className="text-sm font-medium mb-1.5 block">Design Style <span className="text-red-500">*</span></label>
            <select value={form.designStyle} onChange={e => setForm({...form, designStyle:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select…</option>
              {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
            </select></div>
          <div><label className="text-sm font-medium mb-1.5 block">Location</label><input value={form.projectLocation} onChange={e => setForm({...form, projectLocation:e.target.value})} placeholder="e.g. Lekki Phase 1, Lagos" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Budget Range</label><input value={form.budgetRange} onChange={e => setForm({...form, budgetRange:e.target.value})} placeholder="e.g. ₦5M – ₦10M" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Project Size</label><input value={form.projectSize} onChange={e => setForm({...form, projectSize:e.target.value})} placeholder="e.g. 250sqm" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Completion Date</label><input type="date" value={form.completionDate} onChange={e => setForm({...form, completionDate:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" /></div>
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Description <span className="text-red-500">*</span></label><textarea value={form.description} onChange={e => setForm({...form, description:e.target.value})} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe the project, challenges, materials used, and what makes it special…" /></div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant="terracotta" onClick={() => save("PUBLISHED")} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}Publish</Button>
          <Button variant="outline" onClick={() => save("DRAFT")} disabled={saving}>Save Draft</Button>
          <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
        </div>
      </CardContent></Card>}

      {items.length === 0 && !showForm ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl"><Eye className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="font-semibold text-lg">No inspirations yet</p><p className="text-sm text-muted-foreground mt-1">Published projects appear in the gallery and generate client leads</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <Card key={item.id} className="group overflow-hidden">
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img src={item.featuredImage} alt={item.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.roomType} · {item.designStyle}</p>
                  </div>
                  <Badge className={cn("text-[10px] shrink-0", STATUS_STYLE[item.status]||"")}>{item.status}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{item.viewCount}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{item.saveCount}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setForm({title:item.title,description:item.description,roomType:item.roomType,designStyle:item.designStyle,budgetRange:item.budgetRange||"",projectLocation:item.projectLocation||"",projectSize:item.projectSize||"",completionDate:"",featuredImage:item.featuredImage}); setImages(item.images?.map((i:any)=>i.imageUrl)||[]); setEditId(item.id); setShowForm(true); }}><Edit2 className="h-3.5 w-3.5 mr-1" />Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => del(item.id)} className="text-red-400 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
