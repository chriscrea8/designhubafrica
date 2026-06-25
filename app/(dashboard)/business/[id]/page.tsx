"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Shield, Users, Settings, Globe, Upload, Loader2, X, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

const ROLES = ["ADMIN","PROJECT_MANAGER","DESIGNER","ARCHITECT","ACCOUNT_MANAGER","VIEWER"];
const VERIF_STYLE: Record<string,string> = {
  UNVERIFIED:"bg-gray-100 text-gray-600", PENDING:"bg-amber-50 text-amber-700",
  APPROVED:"bg-emerald-50 text-emerald-700", REJECTED:"bg-red-50 text-red-700",
};

function BusinessManageContent() {
  const params = useParams();
  const id = params?.id as string;
  const [biz,     setBiz]     = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("profile");
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState<any>({});
  const [invite,  setInvite]  = useState({ email:"", role:"DESIGNER" });
  const [inviting,setInviting]= useState(false);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    const [bizRes, memRes] = await Promise.all([
      fetch(`/api/businesses/${id}`).then(r=>r.json()).catch(()=>({})),
      fetch(`/api/businesses/${id}/members`).then(r=>r.json()).catch(()=>({})),
    ]);
    if (bizRes.success) { setBiz(bizRes.data); setForm(bizRes.data); }
    if (memRes.success) setMembers(memRes.data||[]);
    setLoading(false);
  }

  async function saveProfile() {
    setSaving(true);
    const { ownerUserId, slug, verificationLevel, verificationStatus, members: _m, reviews: _r, owner: _o, _count, ...safe } = form;
    const res = await fetch(`/api/businesses/${id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(safe) });
    setSaving(false);
    if (res.ok) load();
  }

  async function addMember() {
    if (!invite.email) { setInviteError("Email required"); return; }
    setInviting(true); setInviteError("");
    const res = await fetch(`/api/businesses/${id}/members`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(invite) });
    const json = await res.json();
    setInviting(false);
    if (json.success) { setInvite({ email:"", role:"DESIGNER" }); load(); }
    else setInviteError(json.error||"Failed");
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this member?")) return;
    await fetch(`/api/businesses/${id}/members`, { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ memberId }) });
    load();
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;
  if (!biz)    return <div className="text-center py-12 text-muted-foreground">Business not found</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/business" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5"/></Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{biz.businessName}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge className={cn("text-[10px]", VERIF_STYLE[biz.verificationStatus]||"")}>{biz.verificationStatus}</Badge>
            <span className="text-xs text-muted-foreground capitalize">{biz.businessType?.replace(/_/g," ").toLowerCase()}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/business/${id}/verify`}><Button variant="outline" size="sm" className="gap-1.5"><Shield className="h-3.5 w-3.5"/>Verification</Button></Link>
          <Link href={`/businesses/${biz.slug}`} target="_blank"><Button variant="outline" size="sm" className="gap-1.5"><ExternalLink className="h-3.5 w-3.5"/>View Profile</Button></Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {["profile","team"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 capitalize whitespace-nowrap", tab===t?"border-terracotta-500 text-foreground":"border-transparent text-muted-foreground")}>
            {t === "team" ? `Team (${members.length})` : t}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="space-y-4">
          <Card><CardContent className="p-5 space-y-4">
            <h3 className="font-semibold">Business Details</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Business Name</label><input value={form.businessName||""} onChange={e=>setForm({...form,businessName:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
              <div><label className="text-sm font-medium mb-1.5 block">Business Email</label><input value={form.businessEmail||""} onChange={e=>setForm({...form,businessEmail:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
              <div><label className="text-sm font-medium mb-1.5 block">Phone</label><input value={form.businessPhone||""} onChange={e=>setForm({...form,businessPhone:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
              <div><label className="text-sm font-medium mb-1.5 block">City</label><input value={form.city||""} onChange={e=>setForm({...form,city:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
              <div><label className="text-sm font-medium mb-1.5 block">State</label><input value={form.state||""} onChange={e=>setForm({...form,state:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
              <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Address</label><input value={form.address||""} onChange={e=>setForm({...form,address:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
              <div><label className="text-sm font-medium mb-1.5 block">Website</label><input value={form.websiteUrl||""} onChange={e=>setForm({...form,websiteUrl:e.target.value})} placeholder="https://" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
              <div><label className="text-sm font-medium mb-1.5 block">Year Established</label><input type="number" value={form.yearEstablished||""} onChange={e=>setForm({...form,yearEstablished:parseInt(e.target.value)||null})} placeholder="2010" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
              <div><label className="text-sm font-medium mb-1.5 block">Employee Count</label><input type="number" value={form.employeeCount||""} onChange={e=>setForm({...form,employeeCount:parseInt(e.target.value)||null})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
              <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">About</label><textarea value={form.businessDescription||""} onChange={e=>setForm({...form,businessDescription:e.target.value})} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe your business services…"/></div>
              <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Logo URL</label><input value={form.logoUrl||""} onChange={e=>setForm({...form,logoUrl:e.target.value})} placeholder="https://…" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
              <div className="sm:col-span-2"><label className="text-sm font-medium mb-1.5 block">Cover Image URL</label><input value={form.coverImageUrl||""} onChange={e=>setForm({...form,coverImageUrl:e.target.value})} placeholder="https://…" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
            </div>
            <Button variant="terracotta" onClick={saveProfile} disabled={saving} className="gap-2">{saving&&<Loader2 className="h-4 w-4 animate-spin"/>}Save Changes</Button>
          </CardContent></Card>
        </div>
      )}

      {/* Team Tab */}
      {tab === "team" && (
        <div className="space-y-4">
          <Card><CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Invite Team Member</h3>
            {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}
            <div className="flex gap-2 flex-wrap">
              <input value={invite.email} onChange={e=>setInvite({...invite,email:e.target.value})} placeholder="Email address" className="flex-1 min-w-0 h-10 rounded-md border border-input bg-background px-3 text-sm" onKeyDown={e=>e.key==="Enter"&&addMember()}/>
              <select value={invite.role} onChange={e=>setInvite({...invite,role:e.target.value})} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                {ROLES.map(r=><option key={r} value={r}>{r.replace(/_/g," ")}</option>)}
              </select>
              <Button variant="terracotta" onClick={addMember} disabled={inviting} className="gap-2">{inviting&&<Loader2 className="h-4 w-4 animate-spin"/>}<Plus className="h-4 w-4"/>Invite</Button>
            </div>
          </CardContent></Card>

          <div className="space-y-2">
            {members.map((m:any)=>(
              <Card key={m.id}><CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-terracotta-100 flex items-center justify-center font-bold text-terracotta-600 shrink-0">{m.user?.firstName?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{m.user?.firstName} {m.user?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{m.user?.email}</p>
                </div>
                <Badge className="text-[10px] capitalize shrink-0">{m.role?.replace(/_/g," ").toLowerCase()}</Badge>
                {m.role !== "OWNER" && <button onClick={()=>removeMember(m.id)} className="text-red-400 hover:text-red-600 shrink-0"><Trash2 className="h-4 w-4"/></button>}
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BusinessManagePage() {
  return <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><BusinessManageContent/></Suspense>;
}
