"use client";
import React, { useEffect, useState } from "react";
import { Upload, X, Loader2, CheckCircle2, AlertCircle, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

const CATS = ["Carpenter","Electrician","Painter","POP Installer","Furniture Maker","Tiler","Welder","Plumber","Curtain Installer"];
const AVAIL = [
  { value:"AVAILABLE",   label:"Available",   dot:"bg-emerald-500", color:"bg-emerald-50 text-emerald-700 border-emerald-300" },
  { value:"BUSY",        label:"Busy",        dot:"bg-amber-500",   color:"bg-amber-50 text-amber-700 border-amber-300" },
  { value:"UNAVAILABLE", label:"Unavailable", dot:"bg-red-500",     color:"bg-red-50 text-red-700 border-red-300" },
];

export default function ArtisanSettingsPage() {
  const [tab, setTab]           = useState<"profile"|"portfolio"|"availability">("profile");
  const [form, setForm]         = useState({ bio:"", phone:"", serviceCategory:"", yearsExperience:"0", workLocations:"", specialties:"", availabilityStatus:"AVAILABLE" });
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [saving, setSaving]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/artisans/me").then(r=>r.json()).catch(()=>({})),
      fetch("/api/artisans/me/portfolio").then(r=>r.json()).catch(()=>({})),
    ]).then(([p, port]) => {
      if (p.success) {
        const d = p.data;
        setForm({ bio:d.bio||"", phone:d.phone||"", serviceCategory:d.serviceCategory||"", yearsExperience:String(d.yearsExperience||0), workLocations:(d.workLocations||[]).join(", "), specialties:(d.specialties||[]).join(", "), availabilityStatus:d.availabilityStatus||"AVAILABLE" });
      }
      if (port.success) setPortfolio(port.data||[]);
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true); setError("");
    const res = await fetch("/api/artisans/me", {
      method:"PATCH", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ ...form, yearsExperience:parseInt(form.yearsExperience)||0, workLocations:form.workLocations.split(",").map((s:string)=>s.trim()).filter(Boolean), specialties:form.specialties.split(",").map((s:string)=>s.trim()).filter(Boolean) }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.success) { setSaved(true); setTimeout(()=>setSaved(false),3000); }
    else setError(json.error||"Failed to save");
  }

  async function uploadPortfolioItem(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const caption = window.prompt("Caption (optional):")||"";
    const fd = new FormData(); fd.append("file",file); fd.append("folder","artisan-portfolio");
    const up = await fetch("/api/upload",{method:"POST",body:fd}).then(r=>r.json());
    if (!up.success) { setUploading(false); return; }
    const res = await fetch("/api/artisans/me/portfolio",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({imageUrl:up.data.url,caption})});
    const json = await res.json();
    if (json.success) setPortfolio(prev=>[...prev,json.data]);
    setUploading(false);
    if (e.target) e.target.value="";
  }

  async function removePortfolioItem(id: string) {
    if (!confirm("Delete this item?")) return;
    await fetch(`/api/artisans/me/portfolio/${id}`,{method:"DELETE"});
    setPortfolio(prev=>prev.filter(p=>p.id!==id));
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-bold">Artisan Profile</h1><p className="text-sm text-muted-foreground mt-1">Complete your profile to attract clients</p></div>
      <div className="flex gap-1 border-b">
        {(["profile","portfolio","availability"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 capitalize transition-colors",tab===t?"border-terracotta-500 text-foreground":"border-transparent text-muted-foreground")}>{t}</button>
        ))}
      </div>

      {tab==="profile" && <Card><CardContent className="p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Trade Category <span className="text-red-500">*</span></label>
            <select value={form.serviceCategory} onChange={e=>setForm({...form,serviceCategory:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Select your trade…</option>
              {CATS.map(c=><option key={c} value={c.toLowerCase().replace(/ /g,"_")}>{c}</option>)}
            </select></div>
          <div><label className="text-sm font-medium mb-1.5 block">Phone Number</label><Input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+234 80x xxx xxxx"/></div>
          <div><label className="text-sm font-medium mb-1.5 block">Years of Experience</label><Input type="number" min="0" value={form.yearsExperience} onChange={e=>setForm({...form,yearsExperience:e.target.value})}/></div>
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Service Areas <span className="text-xs text-muted-foreground font-normal">(comma separated)</span></label><Input value={form.workLocations} onChange={e=>setForm({...form,workLocations:e.target.value})} placeholder="e.g. Lekki, Victoria Island, Ikeja"/></div>
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Specialties <span className="text-xs text-muted-foreground font-normal">(comma separated)</span></label><Input value={form.specialties} onChange={e=>setForm({...form,specialties:e.target.value})} placeholder="e.g. Custom wardrobes, POP ceiling, Floor tiles"/></div>
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Bio</label><textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe your experience and what makes you stand out…"/></div>
        </div>
        {error && <p className="text-sm text-red-500 flex items-center gap-1.5"><AlertCircle className="h-4 w-4"/>{error}</p>}
        <div className="flex items-center gap-3">
          {saved && <span className="flex items-center gap-1.5 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4"/>Saved!</span>}
          <Button variant="terracotta" onClick={save} disabled={saving} className="gap-2">{saving&&<Loader2 className="h-4 w-4 animate-spin"/>}Save Profile</Button>
        </div>
      </CardContent></Card>}

      {tab==="portfolio" && <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{portfolio.length} photos · Show clients your best work</p>
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-terracotta-500 text-white text-sm font-medium hover:bg-terracotta-600 transition-colors">
            {uploading?<Loader2 className="h-4 w-4 animate-spin"/>:<Upload className="h-4 w-4"/>}Upload Photo
            <input type="file" accept="image/*" className="hidden" onChange={uploadPortfolioItem} disabled={uploading}/>
          </label>
        </div>
        {portfolio.length===0 ? (
          <div className="text-center py-16 border-2 border-dashed rounded-xl"><Camera className="h-12 w-12 text-muted-foreground mx-auto mb-3"/><p className="font-medium">No portfolio photos yet</p><p className="text-sm text-muted-foreground mt-1">Upload photos of your completed work</p></div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {portfolio.map(item=>(
              <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden border">
                <img src={item.imageUrl} alt={item.caption||""} className="h-full w-full object-cover"/>
                {item.caption && <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2"><p className="text-white text-xs line-clamp-2">{item.caption}</p></div>}
                <button onClick={()=>removePortfolioItem(item.id)} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"><X className="h-3.5 w-3.5"/></button>
              </div>
            ))}
          </div>
        )}
      </div>}

      {tab==="availability" && <Card><CardContent className="p-5 space-y-4">
        <p className="text-sm text-muted-foreground">Let clients know when you're available to take on new work</p>
        <div className="space-y-2">
          {AVAIL.map(opt=>(
            <button key={opt.value} onClick={()=>setForm({...form,availabilityStatus:opt.value})} className={cn("w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",form.availabilityStatus===opt.value?opt.color+" border-current":"border-border hover:border-foreground/20")}>
              <div className={cn("h-3 w-3 rounded-full shrink-0",opt.dot)}/>
              <span className="font-medium">{opt.label}</span>
              {form.availabilityStatus===opt.value&&<CheckCircle2 className="h-4 w-4 ml-auto"/>}
            </button>
          ))}
        </div>
        <Button variant="terracotta" onClick={save} disabled={saving} className="gap-2">{saving&&<Loader2 className="h-4 w-4 animate-spin"/>}Save</Button>
      </CardContent></Card>}
    </div>
  );
}
