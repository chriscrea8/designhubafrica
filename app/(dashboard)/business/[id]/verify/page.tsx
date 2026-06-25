"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, XCircle, Upload, Loader2, Shield } from "lucide-react";
import { Card, CardContent, Button, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

const STEPS = [
  { id:"identity",  title:"Owner Identity",     desc:"Upload your government-issued ID" },
  { id:"business",  title:"Business Registration", desc:"CAC certificate and RC number" },
  { id:"address",   title:"Address Verification", desc:"Utility bill and storefront photos" },
  { id:"social",    title:"Social Profiles",     desc:"Optional social media links" },
];

const VERIF_INFO: Record<string,{ icon:any; color:string; label:string }> = {
  UNVERIFIED:            { icon:Shield, color:"text-gray-400", label:"Not Started" },
  PENDING:               { icon:Clock,  color:"text-amber-500", label:"Under Review" },
  APPROVED:              { icon:CheckCircle2, color:"text-emerald-500", label:"Verified" },
  REJECTED:              { icon:XCircle, color:"text-red-500", label:"Rejected" },
  RESUBMISSION_REQUIRED: { icon:XCircle, color:"text-orange-500", label:"Resubmission Required" },
};

function VerificationContent() {
  const params = useParams();
  const id = params?.id as string;
  const [biz,     setBiz]     = useState<any>(null);
  const [verif,   setVerif]   = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [step,    setStep]    = useState(0);
  const [form,    setForm]    = useState<any>({});
  const [saving,  setSaving]  = useState(false);
  const [uploading,setUploading] = useState<string|null>(null);
  const [submitted,setSubmitted] = useState(false);

  useEffect(() => { if (id) load(); }, [id]);

  async function load() {
    const [bizRes, verifRes] = await Promise.all([
      fetch(`/api/businesses/${id}`).then(r=>r.json()).catch(()=>({})),
      fetch(`/api/businesses/${id}/verification`).then(r=>r.json()).catch(()=>({})),
    ]);
    if (bizRes.success) setBiz(bizRes.data);
    if (verifRes.success) { setVerif(verifRes.data||{}); setForm(verifRes.data||{}); }
    setLoading(false);
  }

  async function uploadFile(field: string, file: File) {
    setUploading(field);
    const fd = new FormData(); fd.append("file", file); fd.append("folder","verifications");
    const res = await fetch("/api/upload", { method:"POST", body:fd }).then(r=>r.json());
    setUploading(null);
    if (res.success) setForm((prev:any) => ({ ...prev, [field]: res.data.url }));
  }

  async function save(submit = false) {
    setSaving(true);
    const res = await fetch(`/api/businesses/${id}/verification`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ ...form, submit }) });
    const json = await res.json();
    setSaving(false);
    if (json.success) { if (submit) setSubmitted(true); load(); }
  }

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;

  const verifStatus = biz?.verificationStatus || "UNVERIFIED";
  const info = VERIF_INFO[verifStatus] || VERIF_INFO.UNVERIFIED;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/business/${id}`} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5"/></Link>
        <div><h1 className="text-xl font-bold">Business Verification</h1><p className="text-sm text-muted-foreground">{biz?.businessName}</p></div>
      </div>

      {/* Status banner */}
      <div className={cn("rounded-xl p-4 flex items-center gap-3", verifStatus==="APPROVED"?"bg-emerald-50 border border-emerald-200":verifStatus==="PENDING"?"bg-amber-50 border border-amber-200":"bg-muted/30 border")}>
        <info.icon className={cn("h-6 w-6 shrink-0", info.color)}/>
        <div>
          <p className="font-semibold text-sm">{info.label}</p>
          {verif.rejectionReason && <p className="text-xs text-red-600 mt-0.5">Reason: {verif.rejectionReason}</p>}
          {verifStatus==="PENDING" && <p className="text-xs text-muted-foreground mt-0.5">Our team reviews submissions within 2–3 business days</p>}
        </div>
      </div>

      {submitted && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-700 text-sm font-medium">✓ Verification documents submitted! We'll review within 2–3 business days.</div>}

      {/* Step indicators */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STEPS.map((s,i)=>(
          <button key={s.id} onClick={()=>setStep(i)} className={cn("flex-1 min-w-0 px-3 py-2 rounded-xl border text-xs font-medium transition-all whitespace-nowrap", step===i?"border-terracotta-400 bg-terracotta-50/20 text-terracotta-600":"border-border text-muted-foreground hover:border-foreground/30")}>
            {s.title}
          </button>
        ))}
      </div>

      {/* Step 0: Identity */}
      {step === 0 && <Card><CardContent className="p-5 space-y-4">
        <h3 className="font-semibold">Owner Identity Verification</h3>
        <p className="text-sm text-muted-foreground">Upload your government-issued ID. We accept National ID, Driver's License, or International Passport.</p>
        <div><label className="text-sm font-medium mb-1.5 block">ID Type</label>
          <select value={form.idType||""} onChange={e=>setForm({...form,idType:e.target.value})} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Select…</option>
            <option value="NIN">National ID (NIN)</option>
            <option value="DRIVERS_LICENSE">Driver's License</option>
            <option value="INTERNATIONAL_PASSPORT">International Passport</option>
          </select></div>
        {[{field:"ownerIdFrontUrl",label:"ID Front"},{field:"ownerIdBackUrl",label:"ID Back"},{field:"ownerSelfieUrl",label:"Selfie with ID"}].map(({field,label})=>(
          <div key={field}>
            <label className="text-sm font-medium mb-1.5 block">{label}</label>
            <div className="flex items-center gap-3">
              {form[field] ? <img src={form[field]} alt={label} className="h-16 w-24 rounded-lg object-cover border"/> : <div className="h-16 w-24 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground"><Upload className="h-5 w-5"/></div>}
              <label className="cursor-pointer">
                <span className="text-sm text-terracotta-500 hover:underline">{uploading===field?"Uploading…":"Choose file"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e=>e.target.files?.[0]&&uploadFile(field,e.target.files[0])} disabled={!!uploading}/>
              </label>
            </div>
          </div>
        ))}
        <Button variant="terracotta" onClick={()=>{save();setStep(1);}} className="gap-2">Save & Continue →</Button>
      </CardContent></Card>}

      {/* Step 1: Business */}
      {step === 1 && <Card><CardContent className="p-5 space-y-4">
        <h3 className="font-semibold">Business Registration (CAC)</h3>
        <div><label className="text-sm font-medium mb-1.5 block">RC Number / CAC Number</label><input value={form.cacNumber||""} onChange={e=>setForm({...form,cacNumber:e.target.value})} placeholder="RC-123456" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">CAC Certificate</label>
          <div className="flex items-center gap-3">
            {form.cacCertificateUrl ? <a href={form.cacCertificateUrl} target="_blank" className="text-xs text-terracotta-500 hover:underline">View uploaded file</a> : <div className="h-10 px-4 rounded-lg border-2 border-dashed flex items-center gap-2 text-muted-foreground text-sm"><Upload className="h-4 w-4"/>No file yet</div>}
            <label className="cursor-pointer">
              <span className="text-sm text-terracotta-500 hover:underline">{uploading==="cacCertificateUrl"?"Uploading…":"Upload PDF/Image"}</span>
              <input type="file" accept=".pdf,image/*" className="hidden" onChange={e=>e.target.files?.[0]&&uploadFile("cacCertificateUrl",e.target.files[0])} disabled={!!uploading}/>
            </label>
          </div>
        </div>
        <div className="flex gap-2"><Button variant="outline" onClick={()=>setStep(0)}>← Back</Button><Button variant="terracotta" onClick={()=>{save();setStep(2);}} className="gap-2">Save & Continue →</Button></div>
      </CardContent></Card>}

      {/* Step 2: Address */}
      {step === 2 && <Card><CardContent className="p-5 space-y-4">
        <h3 className="font-semibold">Address Verification</h3>
        <div><label className="text-sm font-medium mb-1.5 block">Google Maps Link</label><input value={form.googleMapsUrl||""} onChange={e=>setForm({...form,googleMapsUrl:e.target.value})} placeholder="https://maps.google.com/…" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Utility Bill</label>
          <label className="cursor-pointer flex items-center gap-2 text-sm text-terracotta-500 hover:underline w-fit">
            <Upload className="h-4 w-4"/>{uploading==="utilityBillUrl"?"Uploading…":form.utilityBillUrl?"Replace file":"Upload file"}
            <input type="file" accept=".pdf,image/*" className="hidden" onChange={e=>e.target.files?.[0]&&uploadFile("utilityBillUrl",e.target.files[0])} disabled={!!uploading}/>
          </label>
          {form.utilityBillUrl && <p className="text-xs text-emerald-600 mt-1">✓ Uploaded</p>}
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Storefront / Office Photos <span className="text-muted-foreground">(min 3)</span></label>
          <div className="flex flex-wrap gap-2">
            {(form.storefrontImages||[]).map((url:string,i:number)=>(
              <div key={i} className="relative h-16 w-20 rounded-lg overflow-hidden border"><img src={url} alt="" className="h-full w-full object-cover"/></div>
            ))}
            <label className="h-16 w-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted/30">
              {uploading==="storefront"?<Loader2 className="h-5 w-5 animate-spin text-muted-foreground"/>:<Upload className="h-5 w-5 text-muted-foreground"/>}
              <input type="file" accept="image/*" className="hidden" onChange={async e=>{
                if (!e.target.files?.[0]) return;
                setUploading("storefront");
                const fd = new FormData(); fd.append("file",e.target.files[0]); fd.append("folder","verifications");
                const res = await fetch("/api/upload",{method:"POST",body:fd}).then(r=>r.json());
                setUploading(null);
                if (res.success) setForm((prev:any)=>({...prev,storefrontImages:[...(prev.storefrontImages||[]),res.data.url]}));
              }} disabled={!!uploading}/>
            </label>
          </div>
        </div>
        <div className="flex gap-2"><Button variant="outline" onClick={()=>setStep(1)}>← Back</Button><Button variant="terracotta" onClick={()=>{save();setStep(3);}} className="gap-2">Save & Continue →</Button></div>
      </CardContent></Card>}

      {/* Step 3: Social + Submit */}
      {step === 3 && <Card><CardContent className="p-5 space-y-4">
        <h3 className="font-semibold">Social Profiles <span className="text-muted-foreground font-normal text-sm">(Optional)</span></h3>
        {[{field:"instagramUrl",label:"Instagram"},{field:"facebookUrl",label:"Facebook"},{field:"linkedinUrl",label:"LinkedIn"}].map(({field,label})=>(
          <div key={field}><label className="text-sm font-medium mb-1.5 block">{label}</label><input value={form[field]||""} onChange={e=>setForm({...form,[field]:e.target.value})} placeholder="https://…" className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"/></div>
        ))}
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground mb-3">Review your documents before submitting. Once submitted, our team will review within 2–3 business days.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={()=>setStep(2)}>← Back</Button>
            <Button variant="outline" onClick={()=>save()} disabled={saving}>Save Draft</Button>
            <Button variant="terracotta" onClick={()=>save(true)} disabled={saving||verifStatus==="PENDING"||verifStatus==="APPROVED"} className="gap-2">
              {saving&&<Loader2 className="h-4 w-4 animate-spin"/>}Submit for Review
            </Button>
          </div>
        </div>
      </CardContent></Card>}
    </div>
  );
}

export default function BusinessVerifyPage() {
  return <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><VerificationContent/></Suspense>;
}
