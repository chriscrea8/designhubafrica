"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Briefcase, Image, Shield, CreditCard, ChevronRight, ChevronLeft, CheckCircle2, Loader2, Upload, Camera, Plus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge, Progress, Separator, Avatar } from "@/components/ui";
import { cn, formatCurrency } from "@/lib/utils";

const SPECIALIZATIONS = ["Residential Designer", "Commercial Designer", "Furniture Designer", "Architect", "Space Planner", "Kitchen Designer", "Lighting Designer"];
const SERVICES = ["Interior Design", "Furniture Design", "Space Planning", "3D Visualization", "Renovation Consultation", "Kitchen Design", "Lighting Design"];
const PRICING_MODELS = ["Per Room", "Per Project", "Hourly", "Consultation Fee"];
const LANGUAGES = ["English", "Yoruba", "Igbo", "Hausa", "Twi", "Swahili", "French", "Pidgin"];

const steps = [
  { title: "Professional Profile", icon: User, desc: "Tell us about yourself" },
  { title: "Services & Pricing", icon: Briefcase, desc: "What do you offer?" },
  { title: "Portfolio", icon: Image, desc: "Showcase your work (min 3 projects)" },
  { title: "Identity Verification", icon: Shield, desc: "Build trust with clients" },
  { title: "Bank Setup", icon: CreditCard, desc: "Set up your payout method" },
];

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Professional Profile
  const [profile, setProfile] = useState({ bio: "", yearsExperience: "", companyName: "", teamSize: "1", languages: [] as string[], specializations: [] as string[] });
  // Step 2: Services
  const [services, setServices] = useState<string[]>([]);
  const [pricingModel, setPricingModel] = useState("Per Project");
  const [hourlyRate, setHourlyRate] = useState("");
  // Step 3: Portfolio count
  const [portfolioCount, setPortfolioCount] = useState(0);
  // Step 5: Bank
  const [bank, setBank] = useState({ bankName: "", accountNumber: "", accountName: "" });

  const progress = Math.round(((step + 1) / steps.length) * 100);

  const toggleArray = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };

  async function saveAndNext() {
    setSaving(true);
    // Save current step data to API
    if (step === 0 && session?.user?.id) {
      await fetch(`/api/users/${session.user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bio: profile.bio, location: profile.companyName }) });
      await fetch("/api/verification/designer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ experienceYears: parseInt(profile.yearsExperience) || 0, declaredTools: profile.specializations }) });
    }
    if (step === 4) {
      // Final step — mark onboarding complete and redirect
      router.push("/designer-dashboard");
      return;
    }
    setSaving(false);
    setStep(s => Math.min(s + 1, steps.length - 1));
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center"><h1 className="text-2xl font-bold">Welcome to DesignHub Africa!</h1><p className="text-sm text-muted-foreground mt-1">Let&apos;s set up your designer profile in 5 easy steps</p></div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Step {step + 1} of {steps.length}</span>
        <span className="text-sm text-muted-foreground">{progress}% complete</span>
      </div>
      <Progress value={progress} className="h-2" />

      <div className="flex gap-1 overflow-x-auto pb-2">
        {steps.map((s, i) => (
          <button key={i} onClick={() => i <= step && setStep(i)} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap transition-all flex-1 justify-center", i === step ? "border-terracotta-500 bg-terracotta-50 text-terracotta-700" : i < step ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground")}>
            {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{s.title}</span>
          </button>
        ))}
      </div>

      {/* Step 1: Professional Profile */}
      {step === 0 && (
        <Card><CardHeader><CardTitle>Professional Profile</CardTitle><p className="text-sm text-muted-foreground">Tell clients about yourself and your experience</p></CardHeader><CardContent className="space-y-5">
          <div className="flex items-center gap-4"><Avatar fallback={session?.user?.name?.slice(0,2) || "D"} size="xl" /><div><Button variant="outline" size="sm">Upload Photo</Button><p className="text-xs text-muted-foreground mt-1">JPG or PNG, max 2MB</p></div></div>
          <div><label className="text-sm font-medium mb-1.5 block">Bio</label><textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Tell clients about your design philosophy, experience, and what makes you unique..." /></div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div><label className="text-sm font-medium mb-1.5 block">Years of Experience</label><Input type="number" value={profile.yearsExperience} onChange={e => setProfile({...profile, yearsExperience: e.target.value})} placeholder="e.g. 5" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Company Name <span className="text-muted-foreground">(optional)</span></label><Input value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} placeholder="Studio name" /></div>
            <div><label className="text-sm font-medium mb-1.5 block">Team Size</label><Input type="number" value={profile.teamSize} onChange={e => setProfile({...profile, teamSize: e.target.value})} placeholder="1" /></div>
          </div>
          <div><label className="text-sm font-medium mb-2 block">Specializations</label><div className="flex flex-wrap gap-2">{SPECIALIZATIONS.map(s => <button key={s} onClick={() => toggleArray(profile.specializations, s, v => setProfile({...profile, specializations: v}))} className={cn("px-3 py-1.5 rounded-full border text-xs font-medium transition-all", profile.specializations.includes(s) ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border text-muted-foreground hover:border-foreground/30")}>{s}</button>)}</div></div>
          <div><label className="text-sm font-medium mb-2 block">Languages</label><div className="flex flex-wrap gap-2">{LANGUAGES.map(l => <button key={l} onClick={() => toggleArray(profile.languages, l, v => setProfile({...profile, languages: v}))} className={cn("px-3 py-1.5 rounded-full border text-xs font-medium transition-all", profile.languages.includes(l) ? "bg-earth-700 text-white border-earth-700" : "border-border text-muted-foreground")}>{l}</button>)}</div></div>
        </CardContent></Card>
      )}

      {/* Step 2: Services & Pricing */}
      {step === 1 && (
        <Card><CardHeader><CardTitle>Services & Pricing</CardTitle><p className="text-sm text-muted-foreground">Define what services you offer and how you charge</p></CardHeader><CardContent className="space-y-5">
          <div><label className="text-sm font-medium mb-2 block">Services You Offer</label><div className="flex flex-wrap gap-2">{SERVICES.map(s => <button key={s} onClick={() => toggleArray(services, s, setServices)} className={cn("px-3 py-1.5 rounded-full border text-xs font-medium transition-all", services.includes(s) ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border text-muted-foreground")}>{s}</button>)}</div></div>
          <Separator />
          <div><label className="text-sm font-medium mb-2 block">Pricing Model</label><div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{PRICING_MODELS.map(p => <button key={p} onClick={() => setPricingModel(p)} className={cn("p-3 rounded-lg border text-center text-xs font-medium transition-all", pricingModel === p ? "border-terracotta-500 bg-terracotta-50 ring-1 ring-terracotta-500" : "border-border text-muted-foreground")}>{p}</button>)}</div></div>
          <div><label className="text-sm font-medium mb-1.5 block">Rate (NGN)</label><Input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder={pricingModel === "Hourly" ? "e.g. 15000 per hour" : "e.g. 500000 per project"} /><p className="text-xs text-muted-foreground mt-1">You can always adjust this later</p></div>
        </CardContent></Card>
      )}

      {/* Step 3: Portfolio */}
      {step === 2 && (
        <Card><CardHeader><CardTitle>Portfolio</CardTitle><p className="text-sm text-muted-foreground">Upload at least 3 projects to showcase your work</p></CardHeader><CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <Image className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">You need at least <strong>3 portfolio projects</strong> to complete setup. Current: <strong>{portfolioCount}/3</strong></p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="border-2 border-dashed rounded-xl aspect-[4/3] flex flex-col items-center justify-center gap-2 hover:border-terracotta-300 transition-colors cursor-pointer">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">Project {i}</p>
                <Button variant="outline" size="sm">Upload</Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Each project needs: title, location, type, budget range, images, and description</p>
          <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" />Add More Projects</Button>
        </CardContent></Card>
      )}

      {/* Step 4: Identity Verification */}
      {step === 3 && (
        <Card><CardHeader><CardTitle>Identity Verification</CardTitle><p className="text-sm text-muted-foreground">Build trust with clients by verifying your identity</p></CardHeader><CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-terracotta-300 transition-colors cursor-pointer"><Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm font-medium">Government ID</p><p className="text-xs text-muted-foreground mt-1">National ID, Passport, or Driver License</p><Button variant="outline" size="sm" className="mt-3">Upload</Button></div>
            <div className="border-2 border-dashed rounded-xl p-6 text-center hover:border-terracotta-300 transition-colors cursor-pointer"><Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm font-medium">Selfie Verification</p><p className="text-xs text-muted-foreground mt-1">Clear photo of your face</p><Button variant="outline" size="sm" className="mt-3">Take Photo</Button></div>
          </div>
          <Separator />
          <div className="space-y-3">
            <p className="text-sm font-medium">Additional Verification (Optional)</p>
            <div className="flex items-center justify-between p-3 rounded-lg border"><div><p className="text-sm font-medium">Phone Verification</p><p className="text-xs text-muted-foreground">Verify via OTP</p></div><Button variant="outline" size="sm">Verify</Button></div>
            <div className="flex items-center justify-between p-3 rounded-lg border"><div><p className="text-sm font-medium">CAC Business Certificate</p><p className="text-xs text-muted-foreground">For registered businesses</p></div><Button variant="outline" size="sm">Upload</Button></div>
          </div>
        </CardContent></Card>
      )}

      {/* Step 5: Bank Setup */}
      {step === 4 && (
        <Card><CardHeader><CardTitle>Bank Account Setup</CardTitle><p className="text-sm text-muted-foreground">Add your bank details for receiving payments</p></CardHeader><CardContent className="space-y-4">
          <div><label className="text-sm font-medium mb-1.5 block">Bank Name</label><Input value={bank.bankName} onChange={e => setBank({...bank, bankName: e.target.value})} placeholder="e.g. GTBank, Access Bank, First Bank" /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Account Number</label><Input value={bank.accountNumber} onChange={e => setBank({...bank, accountNumber: e.target.value})} placeholder="0123456789" maxLength={10} /></div>
          <div><label className="text-sm font-medium mb-1.5 block">Account Name</label><Input value={bank.accountName} onChange={e => setBank({...bank, accountName: e.target.value})} placeholder="Your full name as on bank account" /></div>
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200"><p className="text-sm text-emerald-800">Your earnings will be sent to this account when you request a withdrawal. You can update this anytime in Settings.</p></div>
        </CardContent></Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="gap-2"><ChevronLeft className="h-4 w-4" />Back</Button>
        <div className="flex gap-2">
          {step < 4 && <Button variant="ghost" onClick={() => setStep(s => s + 1)}>Skip for now</Button>}
          <Button variant="terracotta" onClick={saveAndNext} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {step === 4 ? "Complete Setup" : "Continue"}<ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
