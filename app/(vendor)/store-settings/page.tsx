"use client";
import React, { useEffect, useState } from "react";
import { Store, Upload, CheckCircle2, Loader2, AlertCircle, Camera, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Separator } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function StoreSettingsPage() {
  const [form, setForm] = useState({ storeName: "", storeDescription: "", businessAddress: "", businessPhone: "", cacNumber: "", category: "" });
  const [logoFile,  setLogoFile]  = useState<File | null>(null);
  const [logoUrl,   setLogoUrl]   = useState("");
  const [cacFile,   setCacFile]   = useState<File | null>(null);
  const [cacUrl,    setCacUrl]    = useState("");
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");
  const [profile,   setProfile]   = useState<any>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/vendors/me").then(r => r.json()).then(res => {
      if (res.success) {
        const p = res.data;
        setProfile(p);
        setForm({ storeName: p.storeName || "", storeDescription: p.storeDescription || "", businessAddress: p.businessAddress || "", businessPhone: p.businessPhone || "", cacNumber: p.cacNumber || "", category: p.category || "" });
        setLogoUrl(p.storeImage || "");
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function uploadFile(file: File, type: string) {
    setUploading(type);
    const fd = new FormData(); fd.append("file", file); fd.append("folder", "vendor");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(null);
    return json.success ? json.data.url : null;
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setLogoFile(file);
    const url = await uploadFile(file, "logo");
    if (url) setLogoUrl(url);
  }

  async function handleCacChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setCacFile(file);
    const url = await uploadFile(file, "cac");
    if (url) setCacUrl(url);
  }

  async function save() {
    if (!form.storeName) { setError("Store name required"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/vendors/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, storeImage: logoUrl, cacDocUrl: cacUrl }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else setError(json.error || "Failed to save");
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  const status = profile?.approvalStatus || "PENDING";
  const statusStyle = status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : status === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold">Store Settings</h1><p className="text-sm text-muted-foreground mt-1">Set up your vendor profile and business details</p></div>
        <Badge className={cn("text-xs", statusStyle)}>{status}</Badge>
      </div>

      {/* Store Logo */}
      <Card><CardContent className="p-5">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden">
              {logoUrl ? <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" /> : <Store className="h-8 w-8 text-muted-foreground" />}
            </div>
            <label htmlFor="logo-upload" className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-terracotta-500 text-white flex items-center justify-center cursor-pointer shadow">
              {uploading === "logo" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </label>
            <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
          <div><p className="font-medium">Store Logo</p><p className="text-xs text-muted-foreground mt-0.5">PNG or JPG, max 5MB. Shown on your store page and product listings.</p></div>
        </div>
      </CardContent></Card>

      {/* Business Info */}
      <Card><CardHeader><CardTitle className="text-base">Business Information</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Store Name <span className="text-red-500">*</span></label><Input value={form.storeName} onChange={e => setForm({...form, storeName: e.target.value})} placeholder="e.g. Lagos Furniture Co." /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Business Phone</label><Input type="tel" value={form.businessPhone} onChange={e => setForm({...form, businessPhone: e.target.value})} placeholder="+234 80x xxx xxxx" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">CAC Registration Number</label><Input value={form.cacNumber} onChange={e => setForm({...form, cacNumber: e.target.value})} placeholder="RC-XXXXXXX" /></div>
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Business Address</label><Input value={form.businessAddress} onChange={e => setForm({...form, businessAddress: e.target.value})} placeholder="12 Victoria Island, Lagos" /></div>
          <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Store Description</label><textarea value={form.storeDescription} onChange={e => setForm({...form, storeDescription: e.target.value})} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Tell customers about your products and what makes your store unique..." /></div>
        </div>
      </CardContent></Card>

      {/* CAC Document Upload */}
      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />CAC Document</CardTitle><p className="text-sm text-muted-foreground">Upload your CAC certificate for verification</p></CardHeader><CardContent>
        {cacUrl ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <div><p className="text-sm font-medium text-emerald-700">CAC Document Uploaded</p><p className="text-xs text-muted-foreground">Document submitted for verification</p></div>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer hover:bg-muted/40 transition-colors">
            {uploading === "cac" ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
            <p className="text-sm font-medium">Click to upload CAC certificate</p>
            <p className="text-xs text-muted-foreground">PDF, PNG or JPG, max 10MB</p>
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleCacChange} />
          </label>
        )}
      </CardContent></Card>

      {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}

      <div className="flex items-center gap-3">
        {saved && <span className="flex items-center gap-1.5 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" />Saved!</span>}
        <Button variant="terracotta" onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Store Profile"}
        </Button>
      </div>
    </div>
  );
}
