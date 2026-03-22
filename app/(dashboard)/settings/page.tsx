"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Save, Loader2, CheckCircle2, User, Bell, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Avatar, Separator } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [activeTab, setActiveTab] = useState("profile");
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", location: "", bio: "" });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/users/${session.user.id}`).then(r => r.json()).then(res => {
        if (res.success && res.data) setForm({ firstName: res.data.firstName || "", lastName: res.data.lastName || "", phone: res.data.phone || "", location: res.data.location || "", bio: res.data.bio || "" });
      });
    }
  }, [session?.user?.id]);

  async function handleSave() {
    if (!session?.user?.id) return;
    setLoading(true);
    const res = await fetch(`/api/users/${session.user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setLoading(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  }

  const tabs = [{ id: "profile", label: "Profile", icon: User }, { id: "notifications", label: "Notifications", icon: Bell }, { id: "security", label: "Security", icon: Shield }];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="flex gap-6 flex-col lg:flex-row">
        <div className="lg:w-56 shrink-0">
          <nav className="flex lg:flex-col gap-1">
            {tabs.map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium w-full text-left transition-colors", activeTab === tab.id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}><tab.icon className="h-4 w-4" />{tab.label}</button>)}
          </nav>
        </div>
        <div className="flex-1 max-w-2xl">
          {activeTab === "profile" && (
            <Card>
              <CardHeader><CardTitle>Profile Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-4"><Avatar fallback={`${form.firstName[0] || "U"}${form.lastName[0] || ""}`} size="xl" /><div><p className="font-medium">{form.firstName} {form.lastName}</p><p className="text-sm text-muted-foreground">{session?.user?.email}</p></div></div>
                <Separator />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="text-sm font-medium mb-1.5 block">First Name</label><Input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} /></div>
                  <div><label className="text-sm font-medium mb-1.5 block">Last Name</label><Input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} /></div>
                  <div><label className="text-sm font-medium mb-1.5 block">Phone</label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+234..." /></div>
                  <div><label className="text-sm font-medium mb-1.5 block">Location</label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
                  <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Bio</label><textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                </div>
                <Separator />
                <div><label className="text-sm font-medium mb-1.5 block">Your Referral Link</label><div className="flex gap-2"><Input value={typeof window !== "undefined" ? `${window.location.origin}/register?ref=DH-${(session?.user?.id || "").slice(-6).toUpperCase()}` : ""} readOnly className="font-mono text-xs" /><Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/register?ref=DH-${(session?.user?.id || "").slice(-6).toUpperCase()}`)}>Copy</Button></div><p className="text-xs text-muted-foreground mt-1">Share to earn ₦1,000 when friends join and complete a project</p></div>
                <div className="flex items-center gap-3 justify-end">
                  {saved && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" />Saved!</span>}
                  <Button variant="terracotta" onClick={handleSave} disabled={loading} className="gap-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {activeTab === "notifications" && (
            <Card><CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader><CardContent className="space-y-4">
              {["Project updates", "New messages", "Order updates", "Platform news"].map(item => (
                <div key={item} className="flex items-center justify-between py-2"><p className="text-sm font-medium">{item}</p><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" defaultChecked className="sr-only peer" /><div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-terracotta-500" /></label></div>
              ))}
            </CardContent></Card>
          )}
          {activeTab === "security" && (
            <Card><CardHeader><CardTitle>Change Password</CardTitle></CardHeader><CardContent className="space-y-4">
              <div><label className="text-sm font-medium mb-1.5 block">Current Password</label><Input type="password" /></div>
              <div><label className="text-sm font-medium mb-1.5 block">New Password</label><Input type="password" /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Confirm New Password</label><Input type="password" /></div>
              <Button variant="terracotta">Update Password</Button>
            </CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
}
