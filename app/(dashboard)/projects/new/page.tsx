"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, ChevronLeft, Loader2, AlertCircle, Upload, X, CheckCircle2, Home, Building2, UtensilsCrossed, Store, Hotel, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Progress } from "@/components/ui";
import { cn } from "@/lib/utils";

const PROJECT_TYPES = [
  { value: "Residential", icon: Home, desc: "House, apartment, villa" },
  { value: "Office", icon: Building2, desc: "Corporate, co-working" },
  { value: "Restaurant", icon: UtensilsCrossed, desc: "Restaurant, cafe, bar" },
  { value: "Retail", icon: Store, desc: "Shop, boutique, showroom" },
  { value: "Hotel", icon: Hotel, desc: "Hotel, resort, lodge" },
  { value: "Short-let / Airbnb", icon: Key, desc: "Airbnb, serviced apartment" },
];
const ROOM_TYPES = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Full Home", "Outdoor", "Custom"];
const STYLES = ["Modern", "Minimalist", "Luxury", "Industrial", "Scandinavian", "African Contemporary", "Bohemian", "Art Deco", "Traditional"];
const BUDGET_RANGES = [{ label: "₦500K – ₦2M", min: 500000, max: 2000000 }, { label: "₦2M – ₦5M", min: 2000000, max: 5000000 }, { label: "₦5M – ₦10M", min: 5000000, max: 10000000 }, { label: "₦10M+", min: 10000000, max: 50000000 }];
const TIMELINES = ["Immediately", "1–2 months", "3–6 months", "Flexible"];

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    projectType: "", roomType: "", title: "", description: "",
    propertyType: "", numberOfRooms: "", squareFootage: "", location: "",
    budgetMin: 0, budgetMax: 0, budgetLabel: "",
    style: "", inspirationImages: [] as string[],
    timeline: "", urgency: "medium",
  });

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  const progress = Math.round(((step + 1) / 5) * 100);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files; if (!files) return;
    for (const file of Array.from(files)) {
      const fd = new FormData(); fd.append("file", file); fd.append("folder", "projects");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.success) set("inspirationImages", [...form.inspirationImages, json.data.url]);
    }
  }

  async function submitProject() {
    if (!form.title || !form.description || form.description.length < 20) { setError("Title and description (min 20 chars) required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        title: form.title, description: form.description, roomType: form.roomType || form.projectType,
        style: form.style, budgetMin: form.budgetMin, budgetMax: form.budgetMax,
        location: form.location, urgency: form.urgency, images: form.inspirationImages,
        startDate: form.timeline === "Immediately" ? new Date().toISOString() : undefined,
      }) });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Failed to create"); setLoading(false); return; }
      router.push(`/projects/${json.data.id}`);
    } catch { setError("Something went wrong"); setLoading(false); }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Projects</Link>
      <div><h1 className="text-2xl font-bold">Create New Project</h1><p className="text-sm text-muted-foreground mt-1">Step {step + 1} of 5</p></div>
      <Progress value={progress} className="h-2" />
      {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700"><AlertCircle className="h-4 w-4 shrink-0" /><p className="text-sm">{error}</p></div>}

      {/* Step 1: Project Type */}
      {step === 0 && (
        <Card><CardHeader><CardTitle>What type of space?</CardTitle></CardHeader><CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{PROJECT_TYPES.map(t => (
            <button key={t.value} onClick={() => set("projectType", t.value)} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all", form.projectType === t.value ? "border-terracotta-500 bg-terracotta-50 ring-1 ring-terracotta-500" : "border-border hover:border-foreground/30")}>
              <t.icon className="h-6 w-6" /><span className="text-sm font-medium">{t.value}</span><span className="text-[10px] text-muted-foreground">{t.desc}</span>
            </button>
          ))}</div>
        </CardContent></Card>
      )}

      {/* Step 2: Space Details */}
      {step === 1 && (
        <Card><CardHeader><CardTitle>Space Details</CardTitle></CardHeader><CardContent className="space-y-4">
          <div><label className="text-sm font-medium mb-1.5 block">Project Title</label><Input value={form.title} onChange={e => set("title", e.target.value)} placeholder="e.g. 3-Bedroom Apartment Interior Design" /></div>
          <div><label className="text-sm font-medium mb-2 block">Room Type</label><div className="flex flex-wrap gap-2">{ROOM_TYPES.map(r => <button key={r} onClick={() => set("roomType", r)} className={cn("px-3 py-1.5 rounded-full border text-sm font-medium transition-all", form.roomType === r ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border text-muted-foreground")}>{r}</button>)}</div></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block">Number of Rooms</label><Input type="number" value={form.numberOfRooms} onChange={e => set("numberOfRooms", e.target.value)} placeholder="e.g. 3" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Square Footage (sqft)</label><Input type="number" value={form.squareFootage} onChange={e => set("squareFootage", e.target.value)} placeholder="e.g. 2500" /></div>
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">Location</label><Input value={form.location} onChange={e => set("location", e.target.value)} placeholder="e.g. Lekki Phase 1, Lagos" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Description</label><textarea value={form.description} onChange={e => set("description", e.target.value)} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Describe what you need. Include any preferences, constraints, or inspiration..." /></div>
        </CardContent></Card>
      )}

      {/* Step 3: Budget */}
      {step === 2 && (
        <Card><CardHeader><CardTitle>Budget Range</CardTitle><p className="text-sm text-muted-foreground">Select your budget or enter a custom range</p></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">{BUDGET_RANGES.map(b => (
            <button key={b.label} onClick={() => { set("budgetMin", b.min); set("budgetMax", b.max); set("budgetLabel", b.label); }} className={cn("p-4 rounded-xl border text-center transition-all", form.budgetLabel === b.label ? "border-terracotta-500 bg-terracotta-50 ring-1 ring-terracotta-500" : "border-border hover:border-foreground/30")}>
              <span className="text-lg font-bold">{b.label}</span>
            </button>
          ))}</div>
          <div className="grid grid-cols-2 gap-4"><div><label className="text-sm font-medium mb-1.5 block">Custom Min (₦)</label><Input type="number" value={form.budgetMin || ""} onChange={e => set("budgetMin", parseInt(e.target.value) || 0)} /></div><div><label className="text-sm font-medium mb-1.5 block">Custom Max (₦)</label><Input type="number" value={form.budgetMax || ""} onChange={e => set("budgetMax", parseInt(e.target.value) || 0)} /></div></div>
        </CardContent></Card>
      )}

      {/* Step 4: Style */}
      {step === 3 && (
        <Card><CardHeader><CardTitle>Style Preference</CardTitle></CardHeader><CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">{STYLES.map(s => <button key={s} onClick={() => set("style", s)} className={cn("px-4 py-2 rounded-full border text-sm font-medium transition-all", form.style === s ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border text-muted-foreground")}>{s}</button>)}</div>
          <div><label className="text-sm font-medium mb-2 block">Inspiration Photos (optional)</label><input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} /><div className="flex flex-wrap gap-3">{form.inspirationImages.map((url, i) => (<div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border"><img src={url} alt="" className="h-full w-full object-cover" /><button onClick={() => set("inspirationImages", form.inspirationImages.filter((_, j) => j !== i))} className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center"><X className="h-3 w-3 text-white" /></button></div>))}<button onClick={() => fileRef.current?.click()} className="h-20 w-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:border-terracotta-300"><Upload className="h-5 w-5 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Upload</span></button></div></div>
        </CardContent></Card>
      )}

      {/* Step 5: Timeline */}
      {step === 4 && (
        <Card><CardHeader><CardTitle>Timeline</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">{TIMELINES.map(t => (
            <button key={t} onClick={() => { set("timeline", t); set("urgency", t === "Immediately" ? "high" : t === "Flexible" ? "low" : "medium"); }} className={cn("p-4 rounded-xl border text-center text-sm font-medium transition-all", form.timeline === t ? "border-terracotta-500 bg-terracotta-50 ring-1 ring-terracotta-500" : "border-border text-muted-foreground")}>{t}</button>
          ))}</div>
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 mt-4"><p className="text-sm text-emerald-800 font-medium">Ready to post!</p><p className="text-xs text-emerald-700 mt-1">Once posted, verified designers will see your project and submit proposals. You can compare proposals and choose the best fit.</p></div>
        </CardContent></Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="gap-2"><ChevronLeft className="h-4 w-4" />Back</Button>
        {step < 4 ? (
          <Button variant="terracotta" onClick={() => setStep(s => s + 1)} className="gap-2">Continue<ChevronRight className="h-4 w-4" /></Button>
        ) : (
          <Button variant="terracotta" onClick={submitProject} disabled={loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? "Posting..." : "Post Project"}<CheckCircle2 className="h-4 w-4" /></Button>
        )}
      </div>
    </div>
  );
}
