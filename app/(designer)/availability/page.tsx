"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Clock, Save, Plus, Trash2, Loader2, CheckCircle2, Video, Phone, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Separator } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const HOURS = Array.from({length:13},(_,i)=>`${String(i+8).padStart(2,"0")}:00`); // 08:00–20:00

interface Slot { dayOfWeek: number; startTime: string; endTime: string; }

export default function AvailabilityPage() {
  const { data: session } = useSession();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [consultationPrice, setConsultationPrice] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [types, setTypes] = useState<string[]>(["VIDEO"]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load existing settings
    Promise.all([
      fetch("/api/availability").then(r => r.json()),
    ]).then(([slotsRes]) => {
      if (slotsRes.success) setSlots(slotsRes.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  function addSlot(day: number) {
    setSlots(prev => [...prev, { dayOfWeek: day, startTime: "09:00", endTime: "17:00" }]);
  }
  function removeSlot(i: number) { setSlots(prev => prev.filter((_,j) => j !== i)); }
  function updateSlot(i: number, field: keyof Slot, value: string | number) {
    setSlots(prev => prev.map((slot,j) => j === i ? { ...slot, [field]: value } : slot));
  }
  function toggleType(type: string) {
    setTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  }
  function hasSlotForDay(day: number) { return slots.some(s => s.dayOfWeek === day); }

  async function save() {
    setSaving(true);
    await Promise.all([
      fetch("/api/availability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slots }) }),
      fetch(`/api/users/${session?.user?.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }),
    ]);
    // Save consultation settings to designer profile
    await fetch("/api/designers/me/consultation", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consultationPrice: parseInt(consultationPrice) || 15000, meetingLink, consultationTypes: JSON.stringify(types) }) }).catch(() => {});
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div><h1 className="text-2xl font-bold">Consultation Availability</h1><p className="text-sm text-muted-foreground mt-1">Set when you're available, your price, and your meeting link</p></div>

      {/* Consultation Types */}
      <Card><CardHeader><CardTitle className="text-base">Consultation Types You Offer</CardTitle></CardHeader><CardContent>
        <div className="flex gap-3">
          {[{id:"VIDEO",icon:<Video className="h-4 w-4" />,label:"Video Call"},{id:"PHONE",icon:<Phone className="h-4 w-4" />,label:"Phone Call"},{id:"PHYSICAL",icon:<Home className="h-4 w-4" />,label:"Site Visit"}].map(t => (
            <button key={t.id} onClick={() => toggleType(t.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all", types.includes(t.id) ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border hover:border-terracotta-300")}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </CardContent></Card>

      {/* Pricing + Meeting Link */}
      <Card><CardHeader><CardTitle className="text-base">Pricing & Meeting Link</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Consultation Price (₦)</label>
            <Input type="number" value={consultationPrice} onChange={e => setConsultationPrice(e.target.value)} placeholder="e.g. 15000" />
            <p className="text-xs text-muted-foreground mt-1">Platform takes 15% commission</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Meeting Link</label>
            <Input value={meetingLink} onChange={e => setMeetingLink(e.target.value)} placeholder="https://meet.google.com/xxx or zoom.us/j/xxx" />
            <p className="text-xs text-muted-foreground mt-1">Only revealed to client after payment</p>
          </div>
        </div>
      </CardContent></Card>

      {/* Availability Slots */}
      <Card><CardHeader><CardTitle className="text-base">Weekly Availability</CardTitle><p className="text-sm text-muted-foreground">Add time slots for each day you're available</p></CardHeader><CardContent className="space-y-4">
        {DAY_NAMES.map((day, i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-24">{day}</span>
                {hasSlotForDay(i) && <Badge variant="success" className="text-[10px]">Available</Badge>}
              </div>
              {!hasSlotForDay(i) && <Button variant="ghost" size="sm" onClick={() => addSlot(i)} className="gap-1 text-xs h-7"><Plus className="h-3 w-3" />Add</Button>}
            </div>
            {slots.filter(s => s.dayOfWeek === i).map((slot, j) => {
              const idx = slots.indexOf(slot);
              return (
                <div key={j} className="flex items-center gap-2 ml-24 pl-2 border-l-2 border-terracotta-200">
                  <select value={slot.startTime} onChange={e => updateSlot(idx, "startTime", e.target.value)} className="h-8 rounded border border-input bg-background px-2 text-xs">
                    {HOURS.map(h => <option key={h}>{h}</option>)}
                  </select>
                  <span className="text-xs text-muted-foreground">to</span>
                  <select value={slot.endTime} onChange={e => updateSlot(idx, "endTime", e.target.value)} className="h-8 rounded border border-input bg-background px-2 text-xs">
                    {HOURS.map(h => <option key={h}>{h}</option>)}
                  </select>
                  <button onClick={() => removeSlot(idx)} className="text-red-400 hover:text-red-600 ml-2"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              );
            })}
          </div>
        ))}
      </CardContent></Card>

      <div className="flex items-center gap-3">
        {saved && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" />Saved!</span>}
        <Button variant="terracotta" onClick={save} disabled={saving} className="gap-2">{saving && <Loader2 className="h-4 w-4 animate-spin" />}<Save className="h-4 w-4" />Save Availability</Button>
      </div>
    </div>
  );
}
