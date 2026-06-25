"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Globe, Users, Calendar, Star, CheckCircle2, Shield, ExternalLink } from "lucide-react";
import { Card, CardContent, Badge, Button } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";

const VERIF_LEVELS: Record<string,{ label:string; color:string }> = {
  LEVEL_0_UNVERIFIED:      { label:"Unverified",    color:"bg-gray-100 text-gray-600" },
  LEVEL_1_IDENTITY_VERIFIED:{ label:"ID Verified",  color:"bg-blue-50 text-blue-700" },
  LEVEL_2_BUSINESS_VERIFIED:{ label:"Business Verified", color:"bg-emerald-50 text-emerald-700" },
  LEVEL_3_ADDRESS_VERIFIED:{ label:"Address Verified", color:"bg-teal-50 text-teal-700" },
  LEVEL_4_PREMIUM_VERIFIED:{ label:"Premium Verified", color:"bg-amber-50 text-amber-700" },
};

function BusinessProfileContent() {
  const params = useParams();
  const [biz, setBiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("about");

  useEffect(() => {
    if (!params?.slug) return;
    fetch(`/api/businesses/${params.slug}`).then(r=>r.json()).then(res=>{
      if (res.success) setBiz(res.data);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [params?.slug]);

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;
  if (!biz)    return <div className="text-center py-24"><p className="text-muted-foreground">Business not found</p></div>;

  const verifInfo = VERIF_LEVELS[biz.verificationLevel] || VERIF_LEVELS.LEVEL_0_UNVERIFIED;
  const avgRating = biz.reviews?.length ? (biz.reviews.reduce((s:number,r:any)=>s+r.rating,0)/biz.reviews.length).toFixed(1) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Cover */}
      <div className="relative h-48 lg:h-64 bg-gradient-to-br from-terracotta-500 to-earth-700 overflow-hidden">
        {biz.coverImageUrl && <img src={biz.coverImageUrl} alt="" className="h-full w-full object-cover"/>}
        <div className="absolute inset-0 bg-black/20"/>
        <div className="absolute top-4 left-4"><Link href="/designers" className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm"><ArrowLeft className="h-4 w-4"/>Back</Link></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
        {/* Header */}
        <div className="relative -mt-14 mb-6 flex items-end gap-5 flex-wrap">
          <div className="h-24 w-24 rounded-2xl bg-white border-4 border-background shadow-lg overflow-hidden shrink-0">
            {biz.logoUrl ? <img src={biz.logoUrl} alt={biz.businessName} className="h-full w-full object-cover"/> : <div className="h-full w-full bg-terracotta-100 flex items-center justify-center text-3xl font-black text-terracotta-600">{biz.businessName[0]}</div>}
          </div>
          <div className="flex-1 min-w-0 pb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black">{biz.businessName}</h1>
              <Badge className={cn("text-[10px] gap-1", verifInfo.color)}><Shield className="h-3 w-3"/>{verifInfo.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 capitalize">{biz.businessType?.replace(/_/g," ").toLowerCase()}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
              {biz.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/>{biz.city}{biz.state && `, ${biz.state}`}</span>}
              {biz.yearEstablished && <span className="flex items-center gap-1"><Calendar className="h-3 w-3"/>Est. {biz.yearEstablished}</span>}
              {biz._count?.members > 0 && <span className="flex items-center gap-1"><Users className="h-3 w-3"/>{biz._count.members} team members</span>}
              {avgRating && <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400"/>{avgRating} ({biz._count?.reviews})</span>}
            </div>
          </div>
          <div className="flex gap-2 pb-2 flex-wrap">
            {biz.websiteUrl && <a href={biz.websiteUrl} target="_blank"><Button variant="outline" size="sm" className="gap-1.5"><Globe className="h-3.5 w-3.5"/>Website</Button></a>}
            <Button variant="terracotta" size="sm">Contact</Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b mb-6 overflow-x-auto">
          {["about","team","reviews"].map(t => (
            <button key={t} onClick={()=>setTab(t)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap capitalize", tab===t?"border-terracotta-500 text-foreground":"border-transparent text-muted-foreground")}>
              {t === "team" ? `Team (${biz.members?.length||0})` : t === "reviews" ? `Reviews (${biz._count?.reviews||0})` : t}
            </button>
          ))}
        </div>

        {tab === "about" && (
          <div className="space-y-4 pb-10">
            {biz.businessDescription && <Card><CardContent className="p-5"><h3 className="font-semibold mb-2">About</h3><p className="text-sm text-muted-foreground leading-relaxed">{biz.businessDescription}</p></CardContent></Card>}
            <Card><CardContent className="p-5 grid sm:grid-cols-2 gap-4 text-sm">
              {biz.address    && <div><p className="text-xs text-muted-foreground">Address</p><p>{biz.address}</p></div>}
              {biz.businessEmail && <div><p className="text-xs text-muted-foreground">Email</p><p>{biz.businessEmail}</p></div>}
              {biz.businessPhone && <div><p className="text-xs text-muted-foreground">Phone</p><p>{biz.businessPhone}</p></div>}
              {biz.employeeCount && <div><p className="text-xs text-muted-foreground">Team Size</p><p>{biz.employeeCount} employees</p></div>}
            </CardContent></Card>
          </div>
        )}

        {tab === "team" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
            {biz.members?.map((m:any) => (
              <Card key={m.id}><CardContent className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-terracotta-100 flex items-center justify-center font-bold text-terracotta-600 shrink-0">{m.user?.firstName?.[0]}</div>
                <div><p className="font-medium text-sm">{m.user?.firstName} {m.user?.lastName}</p><p className="text-xs text-muted-foreground capitalize">{m.role?.replace(/_/g," ").toLowerCase()}</p></div>
              </CardContent></Card>
            ))}
          </div>
        )}

        {tab === "reviews" && (
          <div className="space-y-3 pb-10">
            {biz.reviews?.length === 0 ? <p className="text-center text-muted-foreground py-10">No reviews yet</p>
            : biz.reviews?.map((r:any) => (
              <Card key={r.id}><CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-full bg-terracotta-100 flex items-center justify-center text-xs font-bold text-terracotta-600">{r.client?.firstName?.[0]}</div>
                  <div><p className="text-sm font-medium">{r.client?.firstName} {r.client?.lastName}</p><div className="flex gap-0.5">{[1,2,3,4,5].map(s=><span key={s} className={s<=r.rating?"text-amber-400":"text-gray-200"}>★</span>)}</div></div>
                  <p className="ml-auto text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                </div>
                <p className="text-sm text-muted-foreground">{r.review}</p>
              </CardContent></Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BusinessProfilePage() {
  return <Suspense fallback={<div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><BusinessProfileContent/></Suspense>;
}
