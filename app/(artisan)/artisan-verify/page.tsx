"use client";
import React, { useState } from "react";
import { Upload, Loader2, CheckCircle2, AlertCircle, ShieldCheck, Camera, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

const DOCS = [
  { key:"governmentIdUrl", label:"Government-Issued ID", desc:"NIN slip, Driver's license, International passport, or Voter's card", icon:FileText, required:true },
  { key:"selfieUrl",       label:"Selfie with ID",        desc:"A clear selfie holding your government ID next to your face", icon:Camera, required:true },
  { key:"addressProofUrl", label:"Proof of Address",      desc:"Utility bill or bank statement (optional but recommended)", icon:FileText, required:false },
];

export default function ArtisanVerifyPage() {
  const [uploads, setUploads]   = useState<Record<string,string>>({});
  const [address, setAddress]   = useState("");
  const [uploading,setUploading]= useState<string|null>(null);
  const [submitting,setSubmitting]=useState(false);
  const [submitted, setSubmitted]=useState(false);
  const [error, setError]       = useState("");

  async function upload(key: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(key);
    const fd = new FormData(); fd.append("file",file); fd.append("folder","artisan-verification");
    const res = await fetch("/api/upload",{method:"POST",body:fd}).then(r=>r.json());
    setUploading(null);
    if (res.success) setUploads(prev=>({...prev,[key]:res.data.url}));
    else setError("Upload failed");
    if (e.target) e.target.value="";
  }

  async function submit() {
    if (!uploads.governmentIdUrl||!uploads.selfieUrl) { setError("Government ID and selfie are required"); return; }
    setSubmitting(true); setError("");
    const res = await fetch("/api/artisans/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...uploads,address})});
    const json = await res.json();
    setSubmitting(false);
    if (json.success) setSubmitted(true);
    else setError(json.error||"Submission failed");
  }

  if (submitted) return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="h-8 w-8 text-emerald-500"/></div>
      <h2 className="text-xl font-bold">Verification Submitted!</h2>
      <p className="text-muted-foreground mt-2">Our team will review your documents and respond within 24–48 hours.</p>
    </div>
  );

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-blue-500"/>Get Verified</h1>
        <p className="text-sm text-muted-foreground mt-1">Verified artisans get more clients and appear higher in search results</p>
      </div>
      {DOCS.map(doc=>{
        const Icon = doc.icon;
        const uploaded = !!uploads[doc.key];
        return (
          <Card key={doc.key} className={cn(uploaded?"border-emerald-300 bg-emerald-50/20":"")}><CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0",uploaded?"bg-emerald-100":"bg-muted")}><Icon className={cn("h-5 w-5",uploaded?"text-emerald-600":"text-muted-foreground")}/></div>
              <div className="flex-1">
                <p className="font-medium">{doc.label} {doc.required&&<span className="text-red-500">*</span>}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{doc.desc}</p>
                {uploaded ? (
                  <p className="text-xs text-emerald-600 mt-2 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5"/>Uploaded successfully</p>
                ) : (
                  <label className="mt-2 inline-flex cursor-pointer">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm hover:bg-accent transition-colors">
                      {uploading===doc.key?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Upload className="h-3.5 w-3.5"/>}Upload
                    </div>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={e=>upload(doc.key,e)} disabled={!!uploading}/>
                  </label>
                )}
              </div>
            </div>
          </CardContent></Card>
        );
      })}
      <Card><CardContent className="p-5">
        <label className="text-sm font-medium mb-1.5 block">Business Address <span className="text-muted-foreground font-normal text-xs">(optional)</span></label>
        <Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Your business or home address"/>
      </CardContent></Card>
      {error&&<p className="text-sm text-red-500 flex items-center gap-1.5"><AlertCircle className="h-4 w-4"/>{error}</p>}
      <Button variant="terracotta" onClick={submit} disabled={submitting||!!uploading} className="gap-2 w-full sm:w-auto">
        {submitting?<Loader2 className="h-4 w-4 animate-spin"/>:<ShieldCheck className="h-4 w-4"/>}Submit for Verification
      </Button>
    </div>
  );
}
