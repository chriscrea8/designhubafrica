"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Plus, MapPin, CheckCircle2, X, Loader2, Clock } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";

const VISIT_TYPES = ["INITIAL_INSPECTION","MEASUREMENT","MATERIAL_SELECTION","PROGRESS_REVIEW","FINAL_HANDOVER"];
const STATUS_STYLE: Record<string,string> = {
  SCHEDULED:"bg-blue-50 text-blue-700", COMPLETED:"bg-emerald-50 text-emerald-700",
  CANCELLED:"bg-red-50 text-red-700",   RESCHEDULED:"bg-amber-50 text-amber-700",
};

export default function SiteVisitsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [visits,   setVisits]   = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(false);
  const [form,     setForm]     = useState({ projectId:"", visitType:"INITIAL_INSPECTION", visitDate:"", notes:"" });
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/projects?mine=true").then(r=>r.json()).catch(()=>({})),
    ]).then(([proj]) => {
      const ps = proj.data?.items || proj.data || [];
      setProjects(ps);
      // Load visits for all projects
      Promise.all(ps.slice(0,10).map((p:any)=>fetch(`/api/projects/${p.id}/site-visits`).then(r=>r.json()).catch(()=>({data:[]})))).then(results=>{
        setVisits(results.flatMap((r:any)=>r.data||[]));
        setLoading(false);
      });
    });
  }, []);

  async function schedule() {
    if (!form.projectId||!form.visitDate) return;
    setSaving(true);
    await fetch(`/api/projects/${form.projectId}/site-visits`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    setSaving(false); setModal(false);
    setForm({ projectId:"", visitType:"INITIAL_INSPECTION", visitDate:"", notes:"" });
    // Reload
    const res = await fetch(`/api/projects/${form.projectId}/site-visits`).then(r=>r.json());
    if (res.success) setVisits(prev=>[...prev.filter(v=>v.projectId!==form.projectId), ...(res.data||[])]);
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;

  const upcoming = visits.filter(v=>v.status==="SCHEDULED" && new Date(v.visitDate)>=new Date()).sort((a,b)=>new Date(a.visitDate).getTime()-new Date(b.visitDate).getTime());
  const past     = visits.filter(v=>v.status!=="SCHEDULED" || new Date(v.visitDate)<new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Site Visits</h1><p className="text-sm text-muted-foreground mt-1">Schedule and track project site inspections</p></div>
        <Button variant="terracotta" onClick={()=>setModal(true)} className="gap-2"><Plus className="h-4 w-4"/>Schedule Visit</Button>
      </div>

      {visits.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
          <p className="font-semibold">No site visits scheduled</p>
          <p className="text-sm text-muted-foreground mt-1">Schedule visits to track project progress on-site</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && <div>
            <h2 className="font-semibold mb-3">Upcoming ({upcoming.length})</h2>
            <div className="space-y-3">
              {upcoming.map(v=>(
                <Card key={v.id} className="border-blue-200 bg-blue-50/10"><CardContent className="p-4 flex items-center gap-4 flex-wrap">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><Calendar className="h-5 w-5 text-blue-600"/></div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{v.visitType?.replace(/_/g," ")}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3"/>{formatDate(v.visitDate)}</p>
                    {v.notes && <p className="text-xs text-muted-foreground mt-0.5">{v.notes}</p>}
                  </div>
                  <Badge className={cn("text-[10px] shrink-0", STATUS_STYLE[v.status]||"")}>{v.status}</Badge>
                </CardContent></Card>
              ))}
            </div>
          </div>}
          {past.length > 0 && <div>
            <h2 className="font-semibold mb-3 text-muted-foreground">Past</h2>
            <div className="space-y-2">
              {past.map(v=>(
                <Card key={v.id} className="opacity-70"><CardContent className="p-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1"><p className="font-medium text-sm">{v.visitType?.replace(/_/g," ")}</p><p className="text-xs text-muted-foreground">{formatDate(v.visitDate)}</p></div>
                  <Badge className={cn("text-[10px]", STATUS_STYLE[v.status]||"")}>{v.status}</Badge>
                </CardContent></Card>
              ))}
            </div>
          </div>}
        </div>
      )}

      {/* Schedule Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={()=>setModal(false)}>
          <div className="bg-background rounded-2xl w-full max-w-md p-5 shadow-xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold">Schedule Site Visit</h3><button onClick={()=>setModal(false)}><X className="h-5 w-5 text-muted-foreground"/></button></div>
            <div className="space-y-3">
              <div><label className="text-sm font-medium mb-1.5 block">Project</label>
                <select value={form.projectId} onChange={e=>setForm({...form,projectId:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  <option value="">Select project…</option>
                  {projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}
                </select></div>
              <div><label className="text-sm font-medium mb-1.5 block">Visit Type</label>
                <select value={form.visitType} onChange={e=>setForm({...form,visitType:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                  {VISIT_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
                </select></div>
              <div><label className="text-sm font-medium mb-1.5 block">Date & Time</label><input type="datetime-local" value={form.visitDate} onChange={e=>setForm({...form,visitDate:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
              <div><label className="text-sm font-medium mb-1.5 block">Notes</label><textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="What will happen during this visit?"/></div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="terracotta" className="flex-1" onClick={schedule} disabled={saving||!form.projectId||!form.visitDate}>
                {saving&&<Loader2 className="h-4 w-4 animate-spin mr-2"/>}Schedule Visit
              </Button>
              <Button variant="outline" onClick={()=>setModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
