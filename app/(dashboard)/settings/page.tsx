"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Save, Loader2, CheckCircle2, Camera, User, Bell, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Avatar, Separator } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", location: "", bio: "", image: "" });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/users/${session.user.id}`).then(r => r.json()).then(res => {
        if (res.success && res.data) { setForm({ firstName: res.data.firstName || "", lastName: res.data.lastName || "", phone: res.data.phone || "", location: res.data.location || "", bio: res.data.bio || "", image: res.data.image || "" }); setReferralCode(res.data.referralCode || ""); }
      }).catch(() => {});
    }
  }, [session?.user?.id]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingPhoto(true);
    const fd = new FormData(); fd.append("file", file); fd.append("folder", "avatars");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    if (json.success) {
      setForm(prev => ({ ...prev, image: json.data.url }));
      if (session?.user?.id) await fetch(`/api/users/${session.user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: json.data.url }) });
    }
    setUploadingPhoto(false);
  }

  async function handleSave() {
    if (!session?.user?.id) return; setLoading(true);
    await fetch(`/api/users/${session.user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false); setSaved(true); setTimeout(() => setSaved(false), 3000);
  }

  const tabs = [{ id: "profile", label: "Profile", icon: User }, { id: "notifications", label: "Notifications", icon: Bell }, { id: "security", label: "Security", icon: Shield }];

  return (
    <div className="space-y-6"><h1 className="text-2xl font-bold">Settings</h1>
      <div className="flex gap-6 flex-col lg:flex-row">
        <nav className="lg:w-56 shrink-0 flex lg:flex-col gap-1">{tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium w-full text-left", tab === t.id ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50")}><t.icon className="h-4 w-4" />{t.label}</button>)}</nav>
        <div className="flex-1 max-w-2xl">
          {tab === "profile" && <div className="space-y-6">
            <Card><CardHeader><CardTitle>Profile Photo</CardTitle></CardHeader><CardContent>
              <div className="flex items-center gap-4">
                <div className="relative">{form.image ? <img src={form.image} className="h-20 w-20 rounded-full object-cover" alt="" /> : <Avatar fallback={`${form.firstName[0] || ""}${form.lastName[0] || ""}`} size="xl" />}{uploadingPhoto && <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white" /></div>}</div>
                <div><input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} /><Button variant="outline" size="sm" onClick={() => photoRef.current?.click()} disabled={uploadingPhoto} className="gap-2"><Camera className="h-4 w-4" />{uploadingPhoto ? "Uploading..." : "Change Photo"}</Button><p className="text-xs text-muted-foreground mt-1">JPG or PNG, max 2MB</p></div>
              </div>
            </CardContent></Card>
            <Card><CardHeader><CardTitle>Personal Info</CardTitle></CardHeader><CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className="text-sm font-medium mb-1.5 block">First Name</label><Input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Last Name</label><Input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Phone</label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+234..." /></div>
                <div><label className="text-sm font-medium mb-1.5 block">Location</label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
                <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Bio</label><textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" /></div>
              </div>
              <Separator />
              <div><label className="text-sm font-medium mb-1.5 block">Referral Link</label><div className="flex gap-2"><Input value={typeof window !== "undefined" ? `${window.location.origin}/register?ref=${referralCode}` : ""} readOnly className="font-mono text-xs" /><Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/register?ref=${referralCode}`)}>Copy</Button></div></div>
              <div className="flex items-center gap-3 justify-end">{saved && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" />Saved!</span>}<Button variant="terracotta" onClick={handleSave} disabled={loading} className="gap-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save</Button></div>
            </CardContent></Card>
          </div>}

          {tab === "notifications" && <Card><CardHeader><CardTitle>Notifications</CardTitle></CardHeader><CardContent className="space-y-4">{["New proposals", "Milestone updates", "Payment received", "Messages", "Platform updates"].map(item => <div key={item} className="flex items-center justify-between py-2"><p className="text-sm font-medium">{item}</p><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" defaultChecked className="sr-only peer" /><div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-terracotta-500" /></label></div>)}</CardContent></Card>}

          {tab === "security" && <Card><CardHeader><CardTitle>Security</CardTitle></CardHeader><CardContent className="space-y-4"><div><label className="text-sm font-medium mb-1.5 block">Current Password</label><Input type="password" /></div><div><label className="text-sm font-medium mb-1.5 block">New Password</label><Input type="password" /></div><Button variant="terracotta">Update Password</Button></CardContent></Card>}
        </div>
      </div>
    </div>
  );
}
