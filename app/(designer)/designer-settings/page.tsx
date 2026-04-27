"use client";
import { ChangePasswordForm } from "@/components/change-password-form";
import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { Save, Loader2, CheckCircle2, User, Bell, Shield, CreditCard, Search, Building2, Camera, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Avatar, Separator, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function DesignerSettingsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState("profile");
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", location: "", bio: "", image: "" });
  const [companyMode, setCompanyMode] = useState(false);
  const [company, setCompany] = useState({ companyName: "", companyRegNumber: "" });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Bank state
  const [banks, setBanks] = useState<any[]>([]);
  const [bankSearch, setBankSearch] = useState("");
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const [bankLocked, setBankLocked] = useState(false);
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  // Referral
  const [referralCode, setReferralCode] = useState("");

  // Deactivate
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/users/${session.user.id}`).then(r => r.json()).then(res => { if (res.success && res.data) { setForm({ firstName: res.data.firstName || "", lastName: res.data.lastName || "", phone: res.data.phone || "", location: res.data.location || "", bio: res.data.bio || "", image: res.data.image || "" }); setReferralCode(res.data.referralCode || ""); } });
      fetch("/api/bank").then(r => r.json()).then(res => { if (res.success && res.data) { setSelectedBank({ name: res.data.bankName, code: res.data.bankCode }); setAccountNumber(res.data.accountNumber); setAccountName(res.data.accountName); setBankLocked(true); } });
    }
  }, [session?.user?.id]);

  useEffect(() => { fetch("/api/bank?action=list").then(r => r.json()).then(res => { if (res.success) setBanks(res.data || []); }); }, []);

  useEffect(() => {
    if (accountNumber.length === 10 && selectedBank?.code && !bankLocked) {
      setVerifyingAccount(true); setAccountName("");
      fetch(`/api/bank?action=verify&account_number=${accountNumber}&bank_code=${selectedBank.code}`).then(r => r.json()).then(res => { if (res.success) setAccountName(res.data.accountName); setVerifyingAccount(false); }).catch(() => setVerifyingAccount(false));
    }
  }, [accountNumber, selectedBank?.code, bankLocked]);

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

  async function handleBankSave() {
    if (!selectedBank || accountNumber.length !== 10 || !accountName) return;
    setBankSaving(true);
    const res = await fetch("/api/bank", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bankName: selectedBank.name, bankCode: selectedBank.code, accountNumber, accountName }) });
    setBankSaving(false);
    const json = await res.json();
    if (json.success) { setBankSaved(true); setBankLocked(true); setTimeout(() => setBankSaved(false), 3000); }
  }

  async function handleDeactivate() {
    const confirmed = window.confirm("⚠️ Are you sure you want to deactivate your account?\n\nYour profile will be hidden from clients immediately.\n\nYou have 30 days to sign back in to reactivate. After 30 days, your account and all data will be permanently deleted.\n\nThis action cannot be undone after 30 days.");
    if (!confirmed) return;
    const doubleConfirm = window.confirm("This is your final confirmation. Deactivate your account?");
    if (!doubleConfirm) return;
    setDeactivating(true);
    await fetch("/api/account/deactivate", { method: "POST" });
    signOut({ callbackUrl: "/login" });
  }

  const filteredBanks = bankSearch ? banks.filter((b: any) => b.name.toLowerCase().includes(bankSearch.toLowerCase())) : banks;
  const tabs = [{ id: "profile", label: "Profile", icon: User }, { id: "bank", label: "Bank Account", icon: CreditCard }, { id: "notifications", label: "Notifications", icon: Bell }, { id: "security", label: "Security", icon: Shield }];

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

            {/* Company Profile Toggle */}
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-4 w-4" />Company Profile</CardTitle><p className="text-sm text-muted-foreground">Show your registered company instead of personal profile</p></CardHeader><CardContent className="space-y-4">
              <div className="flex items-center justify-between"><p className="text-sm font-medium">Use company profile</p><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={companyMode} onChange={e => setCompanyMode(e.target.checked)} className="sr-only peer" /><div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-terracotta-500" /></label></div>
              {companyMode && <><div><label className="text-sm font-medium mb-1.5 block">Company Name</label><Input value={company.companyName} onChange={e => setCompany({...company, companyName: e.target.value})} placeholder="e.g. Mensah Interiors Ltd" /></div><div><label className="text-sm font-medium mb-1.5 block">CAC Registration Number</label><Input value={company.companyRegNumber} onChange={e => setCompany({...company, companyRegNumber: e.target.value})} placeholder="e.g. RC-123456" /></div></>}
            </CardContent></Card>

            <Card><CardHeader><CardTitle>Personal Info</CardTitle></CardHeader><CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4"><div><label className="text-sm font-medium mb-1.5 block">First Name</label><Input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} /></div><div><label className="text-sm font-medium mb-1.5 block">Last Name</label><Input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} /></div><div><label className="text-sm font-medium mb-1.5 block">Phone</label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div><div><label className="text-sm font-medium mb-1.5 block">Location</label><Input value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div><div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Bio</label><textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div></div>
              <Separator /><div><label className="text-sm font-medium mb-1.5 block">Your Referral Code</label><div className="flex gap-2"><Input value={referralCode} readOnly className="font-mono" /><Button variant="outline" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/register?ref=${referralCode}`)}>Copy Link</Button></div><p className="text-xs text-muted-foreground mt-1">Earn ₦1,000 when friends join and complete a project</p></div>
              <div className="flex items-center gap-3 justify-end">{saved && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" />Saved!</span>}<Button variant="terracotta" onClick={handleSave} disabled={loading} className="gap-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save</Button></div>
            </CardContent></Card>
          </div>}

          {tab === "bank" && <Card><CardHeader><CardTitle>Bank Account</CardTitle><p className="text-sm text-muted-foreground">Your payout destination for earnings</p></CardHeader><CardContent className="space-y-4">
            {bankLocked ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 border space-y-2"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Bank</span><span className="font-medium">{selectedBank?.name}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Account</span><span className="font-medium">{accountNumber}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Name</span><span className="font-medium">{accountName}</span></div></div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200"><p className="text-xs text-amber-700">To update bank details, please contact customer support via the Messages page.</p></div>
              </div>
            ) : (
              <><div className="relative"><label className="text-sm font-medium mb-1.5 block">Bank Name</label><Input value={selectedBank ? selectedBank.name : bankSearch} onChange={e => { setBankSearch(e.target.value); setSelectedBank(null); setShowBankDropdown(true); }} onFocus={() => setShowBankDropdown(true)} placeholder="Search for your bank..." icon={<Search className="h-4 w-4" />} />{showBankDropdown && filteredBanks.length > 0 && !selectedBank && <div className="absolute z-10 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border bg-card shadow-lg">{filteredBanks.slice(0, 20).map((b: any) => <button key={b.code} onClick={() => { setSelectedBank(b); setBankSearch(""); setShowBankDropdown(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-accent">{b.name}</button>)}</div>}</div>
              <div><label className="text-sm font-medium mb-1.5 block">Account Number</label><Input value={accountNumber} onChange={e => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit account number" maxLength={10} /><p className="text-xs text-muted-foreground mt-1">{accountNumber.length}/10 digits</p></div>
              <div><label className="text-sm font-medium mb-1.5 block">Account Name</label>{verifyingAccount ? <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/50"><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm text-muted-foreground">Verifying...</span></div> : accountName ? <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-emerald-50 border-emerald-200"><CheckCircle2 className="h-4 w-4 text-emerald-500" /><span className="text-sm font-medium text-emerald-700">{accountName}</span></div> : <Input value="" readOnly placeholder="Auto-detected when you enter account number" className="bg-muted/50" />}</div>
              <div className="flex items-center gap-3">{bankSaved && <span className="flex items-center gap-1 text-sm text-emerald-600"><CheckCircle2 className="h-4 w-4" />Saved!</span>}<Button variant="terracotta" onClick={handleBankSave} disabled={!selectedBank || accountNumber.length !== 10 || !accountName || bankSaving} className="gap-2">{bankSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save Bank Details</Button></div></>
            )}
          </CardContent></Card>}

          {tab === "notifications" && <Card><CardHeader><CardTitle>Notifications</CardTitle></CardHeader><CardContent className="space-y-4">{["New client requests", "Proposal responses", "Payment received", "Milestone approved", "Review posted", "Platform updates"].map(item => <div key={item} className="flex items-center justify-between py-2"><p className="text-sm font-medium">{item}</p><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" defaultChecked className="sr-only peer" /><div className="w-9 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-terracotta-500" /></label></div>)}</CardContent></Card>}

          {tab === "security" && <Card><CardHeader><CardTitle>Change Password</CardTitle><p className="text-sm text-muted-foreground">A verification code will be sent to your email</p></CardHeader><CardContent className="space-y-6"><ChangePasswordForm /><Separator /><div className="p-4 rounded-lg border border-red-200 bg-red-50/50 space-y-3"><div className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /><h3 className="text-sm font-semibold text-red-700">Danger Zone</h3></div><p className="text-xs text-muted-foreground">Deactivating your account will hide your profile from all clients. You have <strong>30 days</strong> to sign back in to reactivate. After 30 days, your account and all data will be <strong>permanently deleted</strong>.</p><Button variant="outline" size="sm" onClick={handleDeactivate} disabled={deactivating} className="text-red-500 border-red-200 hover:bg-red-50 gap-2">{deactivating && <Loader2 className="h-3 w-3 animate-spin" />}Deactivate Account</Button></div></CardContent></Card>}
        </div>
      </div>
    </div>
  );
}
