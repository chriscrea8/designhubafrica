"use client";
import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Upload, X, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";

const CATS = ["Carpenter","Electrician","Painter","POP Installer","Furniture Maker","Tiler","Welder","Plumber","Curtain Installer"];

function NewJobForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm]         = useState({ title:"", description:"", budget:"", location:"", artisanCategory: searchParams?.get("category")||"" });
  const [photos, setPhotos]     = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append("file",file); fd.append("folder","job-requests");
    const res = await fetch("/api/upload",{method:"POST",body:fd}).then(r=>r.json());
    if (res.success) setPhotos(prev=>[...prev, res.data.url]);
    else setError("Photo upload failed");
    setUploading(false);
    if (e.target) e.target.value="";
  }

  async function submit() {
    if (!form.title||!form.description||!form.budget||!form.location||!form.artisanCategory) { setError("All fields required"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/job-requests",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,photos})});
    const json = await res.json();
    setSaving(false);
    if (json.success) router.push(`/job-requests/${json.data.id}`);
    else setError(json.error||"Failed to post job");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Post a Job Request</h1>
      <Card><CardContent className="p-5 space-y-4">
        <div><label className="text-sm font-medium mb-1.5 block">Job Title <span className="text-red-500">*</span></label><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Install ceiling fan in 3-bedroom flat"/></div>
        <div><label className="text-sm font-medium mb-1.5 block">Artisan Type <span className="text-red-500">*</span></label>
          <select value={form.artisanCategory} onChange={e=>setForm({...form,artisanCategory:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Select trade needed…</option>
            {CATS.map(c=><option key={c} value={c.toLowerCase().replace(/ /g,"_")}>{c}</option>)}
          </select></div>
        <div><label className="text-sm font-medium mb-1.5 block">Location <span className="text-red-500">*</span></label><Input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="e.g. Lekki Phase 1, Lagos"/></div>
        <div><label className="text-sm font-medium mb-1.5 block">Budget (₦) <span className="text-red-500">*</span></label><Input type="number" value={form.budget} onChange={e=>setForm({...form,budget:e.target.value})} placeholder="0"/></div>
        <div><label className="text-sm font-medium mb-1.5 block">Description <span className="text-red-500">*</span></label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe the work needed in detail…"/></div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Photos <span className="text-muted-foreground font-normal text-xs">(optional)</span></label>
          <div className="flex flex-wrap gap-2">
            {photos.map((url,i)=><div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border"><img src={url} alt="" className="h-full w-full object-cover"/><button onClick={()=>setPhotos(prev=>prev.filter((_,j)=>j!==i))} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center"><X className="h-2.5 w-2.5"/></button></div>)}
            {photos.length<5 && <label className="h-16 w-16 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/40">{uploading?<Loader2 className="h-4 w-4 animate-spin text-muted-foreground"/>:<Upload className="h-4 w-4 text-muted-foreground"/>}<input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} disabled={uploading}/></label>}
          </div>
        </div>
        {error && <p className="text-sm text-red-500 flex items-center gap-1.5"><AlertCircle className="h-4 w-4"/>{error}</p>}
        <div className="flex gap-2 pt-2">
          <Button variant="terracotta" onClick={submit} disabled={saving} className="gap-2">{saving&&<Loader2 className="h-4 w-4 animate-spin"/>}Post Job Request</Button>
          <Button variant="outline" onClick={()=>router.back()}>Cancel</Button>
        </div>
      </CardContent></Card>
    </div>
  );
}

export default function NewJobRequestPage() {
  return <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><NewJobForm/></Suspense>;
}
