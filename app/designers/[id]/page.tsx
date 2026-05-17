"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Star, MapPin, Clock, CheckCircle2, Calendar, Briefcase, FileText, Loader2, Heart, Video, Phone, Home, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Avatar, Separator } from "@/components/ui";
import { formatCurrency, cn } from "@/lib/utils";

const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const TYPE_ICONS: Record<string,string> = { VIDEO: "🎥", PHONE: "📞", PHYSICAL: "🏠" };
const TYPE_LABELS: Record<string,string> = { VIDEO: "Video Call", PHONE: "Phone Call", PHYSICAL: "Site Visit" };

export default function DesignerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const id = params?.id as string;
  const [designer, setDesigner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("portfolio");
  const [isSaved, setIsSaved] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [showConsultation, setShowConsultation] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [selectedType, setSelectedType] = useState("VIDEO");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [bookingNote, setBookingNote] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [proposalMsg, setProposalMsg] = useState("");
  const [proposalLoading, setProposalLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/designers/${id}`).then(r => r.json()),
      fetch("/api/saved-designers").then(r => r.json()),
      fetch(`/api/availability?designerId=${id}`).then(r => r.json()),
    ]).then(([dRes, savedRes, slotsRes]) => {
      if (dRes.success) {
        setDesigner(dRes.data);
        const d = dRes.data;
        const b: any[] = [];
        if (d.verificationLevel !== "UNVERIFIED") b.push({ name: "Verified", color: "bg-emerald-50 text-emerald-700 border-emerald-200" });
        if (d.avgRating >= 4.5 && d.totalReviews >= 5) badges.push({ name: "Top Rated", icon: "⭐", color: "bg-amber-50 text-amber-700 border-amber-200" });
        if (d.completionRate >= 0.9) b.push({ name: "Repeat Champion", color: "bg-purple-50 text-purple-700 border-purple-200" });
        setBadges(b);
      }
      if (savedRes.success) setIsSaved((savedRes.data || []).some((d: any) => d.id === id));
      if (slotsRes.success) setSlots(slotsRes.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  async function toggleSave() {
    if (!session) { router.push("/login"); return; }
    const res = await fetch("/api/saved-designers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ designerId: id }) });
    const json = await res.json();
    if (json.success) setIsSaved(json.data?.saved ?? !isSaved);
  }

  async function bookConsultation() {
    if (!session) { router.push("/login"); return; }
    if (selectedDay === null || !selectedTime) { alert("Please select a day and time"); return; }
    setBookingLoading(true);
    const now = new Date();
    const diff = (selectedDay - now.getDay() + 7) % 7 || 7;
    const date = new Date(now); date.setDate(now.getDate() + diff);
    const [h, m] = selectedTime.split(":").map(Number); date.setHours(h, m, 0, 0);
    const res = await fetch("/api/consultations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ designerId: designer.id, type: selectedType, scheduledAt: date.toISOString(), notes: bookingNote }) });
    const json = await res.json();
    setBookingLoading(false);
    if (json.success && json.data?.authorizationUrl) window.location.href = json.data.authorizationUrl;
    else alert(json.error || "Booking failed");
  }

  async function requestProposal() {
    if (!session) { router.push("/login"); return; }
    setProposalLoading(true);
    const res = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: `Proposal Request`, description: proposalMsg || "Client requested a proposal.", roomType: "General", style: "Modern", budgetMin: 500000, budgetMax: 10000000, location: "", images: [] }) });
    const json = await res.json();
    setProposalLoading(false);
    if (json.success) { setShowProposal(false); router.push(`/projects/${json.data.id}`); }
    else alert(json.error || "Failed");
  }

  function getTimesForDay(day: number): string[] {
    const slot = slots.find(s => s.dayOfWeek === day);
    if (!slot) return [];
    const times: string[] = [];
    const startH = parseInt(slot.startTime.split(":")[0]);
    const endH = parseInt(slot.endTime.split(":")[0]);
    for (let h = startH; h < endH; h++) { times.push(`${String(h).padStart(2,"0")}:00`); times.push(`${String(h).padStart(2,"0")}:30`); }
    return times;
  }

  const availableDays = Array.from(new Set(slots.map((s: any) => s.dayOfWeek as number)));
  const availableTypes: string[] = (() => { try { return designer?.consultationTypes ? JSON.parse(designer.consultationTypes) : ["VIDEO"]; } catch { return ["VIDEO"]; } })();
  const consultationPrice = designer?.consultationPrice || 15000;

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;
  if (!designer) return <div className="text-center py-16"><h2 className="text-xl font-bold">Designer not found</h2></div>;

  const user = designer.user || {};
  const portfolio = designer.portfolio || [];
  const packages = designer.servicePackages || [];
  const reviews = designer.reviews || [];

  return (
    <div>
      <div className="bg-gradient-to-br from-terracotta-50 via-earth-50 to-background border-b">
        <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
          <Link href="/designers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4" /> All Designers</Link>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            <div className="h-24 w-24 rounded-full bg-earth-200 flex items-center justify-center text-2xl font-bold text-earth-600 shrink-0">{user.firstName?.[0]}{user.lastName?.[0]}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold">{user.firstName} {user.lastName}</h1>
                {user.isVerified && <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" />Verified</Badge>}
              </div>
              {badges.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{badges.map(b => <Badge key={b.name} className={cn("text-[10px] border", b.color)}>{b.name}</Badge>)}</div>}
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                {user.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{user.location}</span>}
                <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" />{designer.yearsExperience || 0} yrs exp</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{designer.responseTime || "Within 24h"}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                {designer.totalReviews > 0 ? <><div className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><span className="font-bold">{designer.avgRating}</span></div><span className="text-sm text-muted-foreground">({designer.totalReviews} reviews)</span></> : <span className="text-sm text-muted-foreground">No reviews yet</span>}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">{(designer.specialties || []).map((s: string) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div>
            </div>
            <div className="flex flex-col gap-2 lg:items-end shrink-0">
              <p className="text-2xl font-bold">{formatCurrency(designer.hourlyRate || 0, designer.currency)}<span className="text-sm text-muted-foreground font-normal">/hr</span></p>
              <Button variant="terracotta" size="lg" className="gap-2 w-full lg:w-auto" onClick={() => { setShowConsultation(!showConsultation); setShowProposal(false); }}><Calendar className="h-4 w-4" />Book Consultation</Button>
              <Button variant="outline" size="lg" className="gap-2 w-full lg:w-auto" onClick={() => { setShowProposal(!showProposal); setShowConsultation(false); }}><FileText className="h-4 w-4" />Request Proposal</Button>
              <button onClick={toggleSave} className={cn("h-10 w-10 rounded-xl border flex items-center justify-center transition-colors self-end", isSaved ? "bg-red-50 border-red-200 text-red-500" : "border-border text-muted-foreground hover:bg-red-50 hover:text-red-500")} title={isSaved ? "Remove" : "Save"}>
                <Heart className={cn("h-5 w-5", isSaved ? "fill-red-400" : "")} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8">

        {/* Consultation Booking */}
        {showConsultation && (
          <Card className="mt-6 border-terracotta-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div><CardTitle>Book a Consultation</CardTitle><p className="text-sm text-muted-foreground mt-1">Meeting link revealed after payment</p></div>
              <button onClick={() => setShowConsultation(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-sm font-semibold mb-2">1. Type</p>
                <div className="flex gap-2 flex-wrap">{availableTypes.map(type => (
                  <button key={type} onClick={() => setSelectedType(type)} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all", selectedType === type ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border hover:border-terracotta-300")}>
                    <span>{TYPE_ICONS[type]}</span>{TYPE_LABELS[type]}
                  </button>
                ))}</div>
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">2. Day</p>
                {availableDays.length === 0 ? <p className="text-sm text-muted-foreground">No availability set</p> : (
                  <div className="flex gap-2 flex-wrap">{availableDays.map((day: number) => (
                    <button key={day} onClick={() => { setSelectedDay(day); setSelectedTime(""); }} className={cn("px-4 py-2 rounded-lg border text-sm font-medium transition-all", selectedDay === day ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border hover:border-terracotta-300")}>{DAY_NAMES[day]}</button>
                  ))}</div>
                )}
              </div>
              {selectedDay !== null && (
                <div>
                  <p className="text-sm font-semibold mb-2">3. Time</p>
                  <div className="flex gap-2 flex-wrap">{getTimesForDay(selectedDay).map(time => (
                    <button key={time} onClick={() => setSelectedTime(time)} className={cn("px-3 py-1.5 rounded-lg border text-sm transition-all", selectedTime === time ? "bg-terracotta-500 text-white border-terracotta-500" : "border-border hover:border-terracotta-300")}>{time}</button>
                  ))}</div>
                </div>
              )}
              {selectedTime && (
                <div className="space-y-3">
                  <textarea value={bookingNote} onChange={e => setBookingNote(e.target.value)} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="What would you like to discuss?" />
                  <div className="p-4 rounded-xl bg-terracotta-50 border border-terracotta-200 flex items-center justify-between">
                    <div><p className="font-semibold">{TYPE_LABELS[selectedType]} · {DAY_NAMES[selectedDay!]} {selectedTime}</p><p className="text-xs text-muted-foreground mt-0.5">Next available {DAY_NAMES[selectedDay!]}</p></div>
                    <p className="text-xl font-bold">{formatCurrency(consultationPrice)}</p>
                  </div>
                  <Button variant="terracotta" onClick={bookConsultation} disabled={bookingLoading} className="w-full gap-2">{bookingLoading && <Loader2 className="h-4 w-4 animate-spin" />}Pay & Book — {formatCurrency(consultationPrice)}</Button>
                  <p className="text-xs text-center text-muted-foreground">Secure payment via Paystack · Meeting link unlocked immediately after payment</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Request Proposal */}
        {showProposal && (
          <Card className="mt-6 border-terracotta-200">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div><CardTitle>Request Proposal</CardTitle><p className="text-sm text-muted-foreground mt-1">Describe your project and {user.firstName} will send you a detailed proposal</p></div>
              <button onClick={() => setShowProposal(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea value={proposalMsg} onChange={e => setProposalMsg(e.target.value)} rows={4} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Describe your space, style preferences, budget range, and timeline..." />
              <div className="flex gap-2">
                <Button variant="terracotta" onClick={requestProposal} disabled={proposalLoading} className="gap-2">{proposalLoading && <Loader2 className="h-4 w-4 animate-spin" />}Send Request</Button>
                <Button variant="outline" onClick={() => setShowProposal(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b mt-6">
          {[{id:"portfolio",label:`Portfolio (${portfolio.length})`},{id:"services",label:`Services (${packages.length})`},{id:"reviews",label:`Reviews (${reviews.length})`}].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cn("px-4 py-3 text-sm font-medium border-b-2 transition-colors", tab === t.id ? "border-terracotta-500 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{t.label}</button>
          ))}
        </div>

        <div className="py-8">
          {tab === "portfolio" && (portfolio.length === 0 ? <p className="text-center text-muted-foreground py-12">No portfolio items yet</p> :
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{portfolio.map((item: any) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative aspect-[4/3] bg-gradient-to-br from-terracotta-100 to-earth-200">{item.images?.[0] ? <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20">✦</div>}</div>
                <CardContent className="p-4"><h3 className="font-semibold text-sm">{item.title}</h3>{item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}<div className="flex gap-1.5 mt-2"><Badge variant="secondary" className="text-[10px]">{item.category}</Badge><Badge variant="secondary" className="text-[10px]">{item.style}</Badge></div></CardContent>
              </Card>
            ))}</div>
          )}
          {tab === "services" && (packages.length === 0 ? <p className="text-center text-muted-foreground py-12">No packages listed yet</p> :
            <div className="grid md:grid-cols-3 gap-6">{packages.map((pkg: any) => (
              <Card key={pkg.id}><CardContent className="p-5"><h3 className="font-semibold">{pkg.title}</h3><p className="text-sm text-muted-foreground mt-2">{pkg.description}</p><Separator className="my-4" /><div className="flex items-center justify-between"><div><span className="text-2xl font-bold">{formatCurrency(pkg.price)}</span><p className="text-xs text-muted-foreground">{pkg.deliveryDays} days</p></div><Button variant="terracotta" size="sm" onClick={() => setShowProposal(true)}>Select</Button></div></CardContent></Card>
            ))}</div>
          )}
          {tab === "reviews" && (reviews.length === 0 ? <p className="text-center text-muted-foreground py-12">No reviews yet</p> :
            <div className="space-y-4">{reviews.map((r: any) => (
              <Card key={r.id}><CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar fallback={`${r.author?.firstName?.[0] || ""}${r.author?.lastName?.[0] || ""}`} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-semibold text-sm">{r.author?.firstName} {r.author?.lastName}</p>
                        
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-0.5">{Array.from({length:5}).map((_,i) => <Star key={i} className={cn("h-4 w-4", i < r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200")} />)}</div>
                        <span className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("en-GB", {month:"short", year:"numeric"})}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{r.comment}</p>
                    {(r.qualityRating || r.communicationRating) && (
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 pt-3 border-t">
                        {[["Quality", r.qualityRating], ["Communication", r.communicationRating], ["Timeliness", r.timelinessRating], ["Professionalism", r.professionalismRating]].map(([label, val]) => val ? (
                          <div key={label as string} className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{label}</span>
                            <div className="flex gap-0.5">{Array.from({length:5}).map((_,i) => <Star key={i} className={cn("h-3 w-3", i < (val as number) ? "fill-amber-400 text-amber-400" : "text-gray-100")} />)}</div>
                          </div>
                        ) : null)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent></Card>
            ))}</div>
          )}
        </div>
      </div>
    </div>
  );
}
