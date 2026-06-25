"use client";
import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Loader2, Upload, X } from "lucide-react";
import { Card, CardContent, Button } from "@/components/ui";

function NewRFQContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const productId    = searchParams?.get("productId");
  const vendorId     = searchParams?.get("vendorId");

  const [form, setForm] = useState({
    title: "", description: "", quantity: "",
    budgetMin: "", budgetMax: "", deliveryLocation: "", requiredDate: "",
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  async function submit() {
    if (!form.title || !form.description) { setError("Title and description required"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/rfq", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ ...form, productId: productId||null, vendorId: vendorId||null, budgetMin: form.budgetMin ? parseFloat(form.budgetMin) : null, budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : null }) });
    const json = await res.json();
    setSaving(false);
    if (json.success) router.push(`/rfq/${json.data.id}`);
    else setError(json.error || "Failed");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/rfq" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5"/></Link>
        <div><h1 className="text-xl font-bold">Request for Quote</h1><p className="text-sm text-muted-foreground">Vendors will respond with pricing and availability</p></div>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div><label className="text-sm font-medium mb-1.5 block">Request Title <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Porcelain tiles for 3-bedroom apartment" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>

          <div><label className="text-sm font-medium mb-1.5 block">Description <span className="text-red-500">*</span></label>
            <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe what you need in detail — dimensions, material, finish, quantity, etc."/></div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block">Quantity</label>
              <input value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} placeholder="e.g. 100sqm or 50 units" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
            <div><label className="text-sm font-medium mb-1.5 block">Required By</label>
              <input type="date" value={form.requiredDate} onChange={e=>setForm({...form,requiredDate:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
            <div><label className="text-sm font-medium mb-1.5 block">Budget Min (₦)</label>
              <input type="number" value={form.budgetMin} onChange={e=>setForm({...form,budgetMin:e.target.value})} placeholder="500000" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
            <div><label className="text-sm font-medium mb-1.5 block">Budget Max (₦)</label>
              <input type="number" value={form.budgetMax} onChange={e=>setForm({...form,budgetMax:e.target.value})} placeholder="2000000" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
            <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Delivery Location</label>
              <input value={form.deliveryLocation} onChange={e=>setForm({...form,deliveryLocation:e.target.value})} placeholder="e.g. Lekki Phase 1, Lagos" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
          </div>

          {(productId || vendorId) && (
            <div className="rounded-lg bg-terracotta-50/30 border border-terracotta-200 px-3 py-2 text-xs text-terracotta-700">
              {productId ? "✓ Linked to specific product" : "✓ Sent directly to vendor"}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="terracotta" onClick={submit} disabled={saving} className="gap-2">{saving&&<Loader2 className="h-4 w-4 animate-spin"/>}<Send className="h-4 w-4"/>Submit Request</Button>
            <Button variant="outline" asChild><Link href="/rfq">Cancel</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewRFQPage() {
  return <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><NewRFQContent/></Suspense>;
}
