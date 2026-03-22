"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Shield, Upload, Camera, FileText, Wrench, CheckCircle2, Clock, ArrowRight, Loader2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Progress, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

const DESIGN_TOOLS = ["SketchUp", "AutoCAD", "3ds Max", "Revit", "Blender", "V-Ray", "Lumion", "Enscape", "Photoshop", "Illustrator"];

export default function DesignerVerificationPage() {
  const { data: session } = useSession();
  const [verification, setVerification] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [experience, setExperience] = useState("");
  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [govIdUrl, setGovIdUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [uploading, setUploading] = useState("");
  const govIdRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/verification/designer").then(r => r.json()).then(res => {
      if (res.success && res.data) { setVerification(res.data); if (res.data.governmentIdUrl) setGovIdUrl(res.data.governmentIdUrl); if (res.data.selfieUrl) setSelfieUrl(res.data.selfieUrl); if (res.data.declaredTools?.length) setSelectedTools(res.data.declaredTools); if (res.data.experienceYears) setExperience(String(res.data.experienceYears)); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function uploadFile(file: File, type: string) {
    setUploading(type);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "verification");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const json = await res.json();
    setUploading("");
    if (json.success) return json.data.url;
    alert("Upload failed. Please try again.");
    return null;
  }

  async function handleGovIdUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setGovIdFile(file);
    const url = await uploadFile(file, "govId");
    if (url) setGovIdUrl(url);
  }

  async function handleSelfieUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setSelfieFile(file);
    const url = await uploadFile(file, "selfie");
    if (url) setSelfieUrl(url);
  }

  async function submitStep(step: string, data: any) {
    setSubmitting(true);
    const res = await fetch("/api/verification/designer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step, ...data }) });
    const json = await res.json();
    if (json.success) { setVerification(json.data); setActiveStep(prev => prev + 1); }
    setSubmitting(false);
  }

  const steps = [
    { title: "Identity Verification", icon: Camera, desc: "Upload government-issued ID and selfie photo" },
    { title: "Portfolio Review", icon: FileText, desc: "You need at least 5 portfolio items" },
    { title: "Skill Declaration", icon: Wrench, desc: "Declare your design tools and experience" },
    { title: "Admin Approval", icon: Shield, desc: "Our team reviews within 24-48 hours" },
  ];

  const stepCompleted = [!!govIdUrl && !!selfieUrl, (verification?.portfolioCount || 0) >= 5, selectedTools.length > 0 && !!experience, verification?.step === "VERIFIED"];
  const progress = Math.round((stepCompleted.filter(Boolean).length / 4) * 100);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">Verification</h1><p className="text-sm text-muted-foreground mt-1">Complete all steps to receive project requests</p></div>
      <Card><CardContent className="p-5"><div className="flex items-center justify-between mb-3"><span className="text-sm font-medium">Progress</span><Badge variant={progress === 100 ? "success" : "secondary"}>{progress}%</Badge></div><Progress value={progress} className="h-3" /></CardContent></Card>

      <div className="grid sm:grid-cols-4 gap-3">{steps.map((s, i) => (
        <button key={i} onClick={() => setActiveStep(i)} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all", activeStep === i ? "border-terracotta-500 bg-terracotta-50 ring-1 ring-terracotta-500" : stepCompleted[i] ? "border-emerald-200 bg-emerald-50" : "border-border hover:border-foreground/30")}>
          <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", stepCompleted[i] ? "bg-emerald-500 text-white" : activeStep === i ? "bg-terracotta-500 text-white" : "bg-muted text-muted-foreground")}>{stepCompleted[i] ? <CheckCircle2 className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}</div>
          <span className="text-xs font-medium">Step {i + 1}</span><span className="text-[10px] text-muted-foreground">{s.title}</span>
        </button>
      ))}</div>

      <Card><CardHeader><CardTitle className="text-lg">{steps[activeStep].title}</CardTitle><p className="text-sm text-muted-foreground">{steps[activeStep].desc}</p></CardHeader><CardContent>
        {activeStep === 0 && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Government ID Upload */}
              <div className={cn("border-2 border-dashed rounded-xl p-6 text-center transition-colors", govIdUrl ? "border-emerald-300 bg-emerald-50/30" : "hover:border-terracotta-300")}>
                <input ref={govIdRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleGovIdUpload} />
                {govIdUrl ? <><CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" /><p className="text-sm font-medium text-emerald-700">ID Uploaded</p><p className="text-xs text-emerald-600 mt-1 truncate">{govIdFile?.name || "Document uploaded"}</p><Button variant="outline" size="sm" className="mt-3" onClick={() => govIdRef.current?.click()}>Replace</Button></>
                : <>{uploading === "govId" ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" /> : <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />}<p className="text-sm font-medium">Government ID</p><p className="text-xs text-muted-foreground mt-1">NIN slip, Voter Card, Passport, or Driver License</p><Button variant="outline" size="sm" className="mt-3" onClick={() => govIdRef.current?.click()} disabled={uploading === "govId"}>Select Document</Button></>}
              </div>
              {/* Selfie Upload */}
              <div className={cn("border-2 border-dashed rounded-xl p-6 text-center transition-colors", selfieUrl ? "border-emerald-300 bg-emerald-50/30" : "hover:border-terracotta-300")}>
                <input ref={selfieRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleSelfieUpload} />
                {selfieUrl ? <><CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" /><p className="text-sm font-medium text-emerald-700">Selfie Uploaded</p><Button variant="outline" size="sm" className="mt-3" onClick={() => selfieRef.current?.click()}>Retake</Button></>
                : <>{uploading === "selfie" ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" /> : <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />}<p className="text-sm font-medium">Selfie Verification</p><p className="text-xs text-muted-foreground mt-1">Clear photo of your face</p><Button variant="outline" size="sm" className="mt-3" onClick={() => selfieRef.current?.click()} disabled={uploading === "selfie"}>Take / Upload Photo</Button></>}
              </div>
            </div>
            <Button variant="terracotta" onClick={() => submitStep("identity", { governmentIdUrl: govIdUrl, selfieUrl, step: "IDENTITY_SUBMITTED" })} disabled={!govIdUrl || !selfieUrl || submitting} className="gap-2">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Submit Identity Documents</Button>
          </div>
        )}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200"><AlertCircle className="h-5 w-5 text-amber-600 shrink-0" /><p className="text-sm text-amber-800">You need at least <strong>5 portfolio items</strong>. Current: <strong>{verification?.portfolioCount || 0}/5</strong></p></div>
            <Button variant="terracotta" className="gap-2" asChild><a href="/portfolio"><ArrowRight className="h-4 w-4" />Go to Portfolio Manager</a></Button>
          </div>
        )}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div><label className="text-sm font-medium mb-3 block">Design Tools</label><div className="flex flex-wrap gap-2">{DESIGN_TOOLS.map(tool => <button key={tool} onClick={() => setSelectedTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool])} className={cn("px-3 py-1.5 rounded-lg border text-sm font-medium transition-all", selectedTools.includes(tool) ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border text-muted-foreground")}>{tool}</button>)}</div></div>
            <div><label className="text-sm font-medium mb-1.5 block">Years of Experience</label><Input type="number" value={experience} onChange={e => setExperience(e.target.value)} placeholder="e.g. 5" className="w-32" /></div>
            <Button variant="terracotta" disabled={selectedTools.length === 0 || !experience || submitting} onClick={() => submitStep("skills", { declaredTools: selectedTools, experienceYears: parseInt(experience), step: "SKILLS_DECLARED" })} className="gap-2">{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Save Skills</Button>
          </div>
        )}
        {activeStep === 3 && (
          <div className="text-center py-8">
            <div className={cn("h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4", verification?.step === "VERIFIED" ? "bg-emerald-50" : "bg-amber-50")}>{verification?.step === "VERIFIED" ? <CheckCircle2 className="h-8 w-8 text-emerald-500" /> : <Clock className="h-8 w-8 text-amber-500" />}</div>
            <h3 className="font-semibold text-lg">{verification?.step === "VERIFIED" ? "You are Verified!" : "Awaiting Review"}</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">{verification?.step === "VERIFIED" ? "Your profile is verified. You can now receive project requests and earn trust badges." : "Complete all previous steps, then submit for review. Our team typically responds within 24-48 hours."}</p>
            {verification?.step !== "VERIFIED" && <Button variant="terracotta" size="lg" className="mt-6 gap-2" disabled={!stepCompleted[0] || !stepCompleted[2] || submitting} onClick={() => submitStep("submit", { step: "UNDER_REVIEW" })}>{submitting && <Loader2 className="h-4 w-4 animate-spin" />}Submit for Review</Button>}
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}
