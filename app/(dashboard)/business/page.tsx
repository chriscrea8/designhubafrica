"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Building2, Shield, Users, Settings, CheckCircle2, Clock, XCircle, Loader2, X, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

const VERIF_STYLE: Record<string,string> = {
  UNVERIFIED:"bg-gray-100 text-gray-600", PENDING:"bg-amber-50 text-amber-700",
  APPROVED:"bg-emerald-50 text-emerald-700", REJECTED:"bg-red-50 text-red-700",
  RESUBMISSION_REQUIRED:"bg-orange-50 text-orange-700",
};

const BIZ_TYPES = ["DESIGN_FIRM","VENDOR","ARTISAN_COMPANY"];

export default function BusinessDashboardPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form,       setForm]       = useState({ businessName:"", businessType:"DESIGN_FIRM", businessEmail:"", businessPhone:"", city:"", state:"", businessDescription:"" });
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await fetch("/api/businesses").then(r=>r.json()).catch(()=>({}));
    if (res.success) setBusinesses(res.data||[]);
    setLoading(false);
  }

  async function create() {
    if (!form.businessName) { setError("Business name required"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/businesses", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    const json = await res.json();
    setSaving(false);
    if (json.success) { setShowCreate(false); load(); }
    else setError(json.error||"Failed");
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Business Account</h1><p className="text-sm text-muted-foreground mt-1">Register and manage your business on DesignHub Africa</p></div>
        {!showCreate && <Button variant="terracotta" onClick={()=>setShowCreate(true)} className="gap-2"><Plus className="h-4 w-4"/>Register Business</Button>}
      </div>

      {showCreate && <Card className="border-terracotta-200"><CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Register Your Business</h3><button onClick={()=>setShowCreate(false)}><X className="h-5 w-5 text-muted-foreground"/></button></div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Business Name <span className="text-red-500">*</span></label><input value={form.businessName} onChange={e=>setForm({...form,businessName:e.target.value})} placeholder="e.g. CAWOS Global Interiors" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
          <div><label className="text-sm font-medium mb-1.5 block">Business Type <span className="text-red-500">*</span></label>
            <select value={form.businessType} onChange={e=>setForm({...form,businessType:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              {BIZ_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g," ")}</option>)}
            </select></div>
          <div><label className="text-sm font-medium mb-1.5 block">Business Email</label><input value={form.businessEmail} onChange={e=>setForm({...form,businessEmail:e.target.value})} placeholder="info@yourcompany.com" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
          <div><label className="text-sm font-medium mb-1.5 block">Phone</label><input value={form.businessPhone} onChange={e=>setForm({...form,businessPhone:e.target.value})} placeholder="+234 800 000 0000" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
          <div><label className="text-sm font-medium mb-1.5 block">City</label><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})} placeholder="Lagos" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">About Your Business</label><textarea value={form.businessDescription} onChange={e=>setForm({...form,businessDescription:e.target.value})} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="What services do you offer?"/></div>
        </div>
        <div className="flex gap-2"><Button variant="terracotta" onClick={create} disabled={saving} className="gap-2">{saving&&<Loader2 className="h-4 w-4 animate-spin"/>}Register</Button><Button variant="outline" onClick={()=>setShowCreate(false)}>Cancel</Button></div>
      </CardContent></Card>}

      {businesses.length === 0 && !showCreate ? (
        <div className="text-center py-16 border-2 border-dashed rounded-2xl">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
          <p className="font-semibold text-lg">No business registered yet</p>
          <p className="text-sm text-muted-foreground mt-1">Register your firm to unlock team management, verification badges, and business features</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {businesses.map((b:any) => (
            <Card key={b.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-terracotta-100 flex items-center justify-center font-bold text-terracotta-600 shrink-0 overflow-hidden">
                    {b.logoUrl ? <img src={b.logoUrl} alt="" className="h-full w-full object-cover"/> : b.businessName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold">{b.businessName}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{b.businessType?.replace(/_/g," ").toLowerCase()}</p>
                    <Badge className={cn("text-[10px] mt-1", VERIF_STYLE[b.verificationStatus]||"")}>{b.verificationStatus}</Badge>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Link href={`/business/${b.id}`} className="flex-1"><Button variant="terracotta" size="sm" className="w-full gap-1.5"><Settings className="h-3.5 w-3.5"/>Manage</Button></Link>
                  <Link href={`/business/${b.id}/verify`}><Button variant="outline" size="sm" className="gap-1.5"><Shield className="h-3.5 w-3.5"/>Verify</Button></Link>
                  <Link href={`/businesses/${b.slug}`} target="_blank"><Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5"/>View</Button></Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
