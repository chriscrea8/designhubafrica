"use client";
import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Loader2, Clock, DollarSign, CheckCircle2, X, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, Button, Badge, Input } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";

interface PkgForm { title: string; description: string; duration: string; price: string; }
const BLANK: PkgForm = { title:"", description:"", duration:"60", price:"" };

export default function ConsultationSettingsPage() {
  const [packages, setPackages]   = useState<any[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editId,   setEditId]     = useState<string|null>(null);
  const [form,     setForm]       = useState<PkgForm>(BLANK);
  const [saving,   setSaving]     = useState(false);
  const [error,    setError]      = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/consultation-packages").then(r=>r.json()).catch(()=>({}));
    if (res.success) setPackages(res.data||[]);
    setLoading(false);
  }

  function openCreate() { setForm(BLANK); setEditId(null); setShowForm(true); setError(""); }
  function openEdit(p: any) { setForm({ title:p.title, description:p.description||"", duration:String(p.duration), price:String(p.price) }); setEditId(p.id); setShowForm(true); setError(""); }

  async function save() {
    if (!form.title||!form.duration||!form.price) { setError("Title, duration and price are required"); return; }
    setSaving(true); setError("");
    const url = editId ? `/api/consultation-packages/${editId}` : "/api/consultation-packages";
    const method = editId ? "PATCH" : "POST";
    const res = await fetch(url, { method, headers:{"Content-Type":"application/json"}, body: JSON.stringify({ ...form, duration: parseInt(form.duration), price: parseInt(form.price) }) });
    const json = await res.json();
    setSaving(false);
    if (json.success) { setShowForm(false); load(); }
    else setError(json.error||"Failed to save");
  }

  async function toggle(id: string, isActive: boolean) {
    await fetch(`/api/consultation-packages/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ isActive: !isActive }) });
    load();
  }

  async function del(id: string) {
    if (!confirm("Delete this package?")) return;
    await fetch(`/api/consultation-packages/${id}`, { method:"DELETE" });
    load();
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Consultation Packages</h1><p className="text-sm text-muted-foreground mt-1">Create packages clients can book and pay for directly</p></div>
        {!showForm && <Button variant="terracotta" onClick={openCreate} className="gap-2"><Plus className="h-4 w-4"/>New Package</Button>}
      </div>

      {showForm && <Card className="border-terracotta-200"><CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between"><h3 className="font-semibold">{editId?"Edit Package":"New Package"}</h3><button onClick={()=>setShowForm(false)}><X className="h-5 w-5 text-muted-foreground"/></button></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Title <span className="text-red-500">*</span></label><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. 60 Min Video Consultation"/></div>
          <div><label className="text-sm font-medium mb-1.5 block">Duration (minutes) <span className="text-red-500">*</span></label><Input type="number" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})} placeholder="60"/></div>
          <div><label className="text-sm font-medium mb-1.5 block">Price (₦) <span className="text-red-500">*</span></label><Input type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="10000"/></div>
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="What's included in this consultation?"/></div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2"><Button variant="terracotta" onClick={save} disabled={saving} className="gap-2">{saving&&<Loader2 className="h-4 w-4 animate-spin"/>}Save</Button><Button variant="outline" onClick={()=>setShowForm(false)}>Cancel</Button></div>
      </CardContent></Card>}

      {packages.length === 0 && !showForm ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
          <p className="font-medium">No consultation packages yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create packages to let clients book and pay for your time</p>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map(p=>(
            <Card key={p.id} className={cn(!p.isActive&&"opacity-60")}><CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm">{p.title}</h3>
                  <Badge className={cn("text-[10px]",p.isActive?"bg-emerald-50 text-emerald-700":"bg-gray-100 text-gray-500")}>{p.isActive?"Active":"Inactive"}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3"/>{p.duration} min</span>
                  <span className="font-bold text-foreground">{formatCurrency(p.price)}</span>
                </div>
                {p.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.description}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={()=>toggle(p.id,p.isActive)} title={p.isActive?"Deactivate":"Activate"}>
                  {p.isActive ? <ToggleRight className="h-5 w-5 text-emerald-500"/> : <ToggleLeft className="h-5 w-5 text-gray-400"/>}
                </button>
                <Button variant="outline" size="sm" onClick={()=>openEdit(p)}><Edit2 className="h-3.5 w-3.5"/></Button>
                <Button variant="outline" size="sm" onClick={()=>del(p.id)} className="text-red-500 hover:bg-red-50"><Trash2 className="h-3.5 w-3.5"/></Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}
