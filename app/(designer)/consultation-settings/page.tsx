"use client";
import React, { useEffect, useState } from "react";
import { Clock, DollarSign, Video, Phone, MapPin, Save, Loader2, CheckCircle2, Plus, Trash2, Link } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Separator } from "@/components/ui";
import { cn } from "@/lib/utils";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const TYPES = [
  { id: "VIDEO",    icon: Video,   label: "Video Call",  desc: "Google Meet, Zoom, or any video platform" },
  { id: "PHONE",    icon: Phone,   label: "Phone Call",  desc: "Direct phone consultation" },
  { id: "PHYSICAL", icon: MapPin,  label: "Site Visit",  desc: "In-person at client location" },
];

interface Slot { dayOfWeek: number; startTime: string; endTime: string; }

export default function ConsultationSettingsPage() {
  const [price, setPrice]         = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [types, setTypes]         = useState<string[]>(["VIDEO"]);
  const [slots, setSlots]         = useState<Slot[]>([]);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    // Load existing settings
    Promise.all([
      fetch("/api/availability?designerId=me").then(r => r.json()),
      fetch("/api/designers/me").then(r => r.json()),
    ]).then(([slotsRes, profileRes]) => {
      if (slotsRes.success) setSlots(slotsRes.data || []);
      if (profileRes.success) {
        const p = profileRes.data;
        if (p.consultationPrice) setPrice(String(p.consultationPrice));
        if (p.meetingLink) setMeetingLink(p.meetingLink);
        if (p.consultationTypes) {
          try { setTypes(JSON.parse(p.consultationTypes)); } catch {}
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function addSlot() {
    setSlots(prev => [...prev, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" }]);
  }

  function removeSlot(i: number) {
    setSlots(prev => prev.filter((_, j) => j !== i));
  }

  function updateSlot(i: number, field: keyof Slot, value: any) {
    setSlots(prev => prev.map((slot, j) => j === i ? { ...slot, [field]: value } : slot));
  }

  function toggleType(id: string) {
    setTypes(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  async function save() {
    if (!price || parseInt(price) < 1000) { alert("Minimum consultation price is ₦1,000"); return; }
    if (types.includes("VIDEO") && !meetingLink) { alert("Please add your meeting link for video consultations"); return; }
    setSaving(true);

    // Save availability slots
    await fetch("/api/availability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slots }) });

    // Save consultation settings to designer profile
    await fetch("/api/designers/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consultationPrice: parseInt(price), meetingLink, consultationTypes: JSON.stringify(types) }) });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Consultation Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Set your availability, pricing, and meeting details</p>
      </div>

      {/* Pricing */}
      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><DollarSign className="h-4 w-4" />Consultation Price</CardTitle></CardHeader><CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Price per session (₦)</label>
          <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 15000" className="w-48" />
          <p className="text-xs text-muted-foreground mt-1">Minimum ₦1,000. Platform takes 10% commission.</p>
        </div>
      </CardContent></Card>

      {/* Consultation Types */}
      <Card><CardHeader><CardTitle className="text-base">Consultation Types</CardTitle><p className="text-sm text-muted-foreground">Select all the ways clients can book with you</p></CardHeader><CardContent>
        <div className="grid sm:grid-cols-3 gap-3">
          {TYPES.map(t => (
            <button key={t.id} onClick={() => toggleType(t.id)} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all", types.includes(t.id) ? "border-terracotta-500 bg-terracotta-50 ring-1 ring-terracotta-500" : "border-border hover:border-foreground/30")}>
              <t.icon className={cn("h-6 w-6", types.includes(t.id) ? "text-terracotta-500" : "text-muted-foreground")} />
              <div><p className="text-sm font-medium">{t.label}</p><p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p></div>
              {types.includes(t.id) && <Badge variant="success" className="text-[10px]">Enabled</Badge>}
            </button>
          ))}
        </div>
      </CardContent></Card>

      {/* Meeting Link */}
      {types.includes("VIDEO") && (
        <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Link className="h-4 w-4" />Meeting Link</CardTitle><p className="text-sm text-muted-foreground">Revealed to client ONLY after payment is confirmed</p></CardHeader><CardContent>
          <Input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/xxx-xxxx-xxx or https://zoom.us/j/..." />
          <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-700">🔒 This link is hidden until the client pays. Never share it directly in chat.</p>
          </div>
        </CardContent></Card>
      )}

      {/* Availability Slots */}
      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Weekly Availability</CardTitle><p className="text-sm text-muted-foreground">Set your available days and hours</p></CardHeader><CardContent className="space-y-3">
        {slots.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No availability slots added. Click + Add Slot to start.</p>}
        {slots.map((slot, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
            <select value={slot.dayOfWeek} onChange={e => updateSlot(i, "dayOfWeek", parseInt(e.target.value))} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
              {DAYS.map((d, idx) => <option key={d} value={idx}>{d}</option>)}
            </select>
            <input type="time" value={slot.startTime} onChange={e => updateSlot(i, "startTime", e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm" />
            <span className="text-muted-foreground text-sm">to</span>
            <input type="time" value={slot.endTime} onChange={e => updateSlot(i, "endTime", e.target.value)} className="h-9 rounded-md border border-input bg-background px-2 text-sm" />
            <button onClick={() => removeSlot(i)} className="ml-auto text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addSlot} className="gap-2 w-full"><Plus className="h-4 w-4" />Add Slot</Button>
      </CardContent></Card>

      <div className="flex items-center gap-3">
        {saved && <span className="flex items-center gap-1.5 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" />Saved!</span>}
        <Button variant="terracotta" onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
