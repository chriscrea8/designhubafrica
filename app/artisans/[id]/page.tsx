"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, Star, MapPin, Briefcase, ShieldCheck, CheckCircle2, MessageSquare, FileText, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui";
import { formatDate, cn } from "@/lib/utils";

function ArtisanProfileContent() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [artisan, setArtisan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx,  setImgIdx]  = useState(0);
  const [tab,     setTab]     = useState<"portfolio"|"reviews">("portfolio");

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/artisans/${params.id}`).then(r=>r.json()).then(res=>{
      if (res.success) setArtisan(res.data);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [params?.id]);

  if (loading) return <div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>;
  if (!artisan) return <div className="text-center py-24"><p className="text-muted-foreground">Artisan not found</p><Link href="/artisans" className="text-terracotta-500 text-sm mt-2 inline-block">Browse artisans</Link></div>;

  const u = artisan.user;
  const name = `${u?.firstName||""} ${u?.lastName||""}`.trim();
  const isVerified = artisan.verification?.status === "VERIFIED";
  const isAvailable = artisan.availabilityStatus === "AVAILABLE";

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 max-w-5xl">
      <Link href="/artisans" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4"/>Artisans</Link>
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Profile card */}
        <div className="space-y-4">
          <Card><CardContent className="p-5 text-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-terracotta-100 to-terracotta-200 flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-terracotta-600">
              {name.charAt(0)||"A"}
            </div>
            <h1 className="font-bold text-lg">{name}</h1>
            <p className="text-terracotta-500 font-medium text-sm capitalize mt-0.5">{artisan.serviceCategory?.replace(/_/g," ")}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              {isVerified && <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs gap-1"><ShieldCheck className="h-3 w-3"/>Verified</Badge>}
              <Badge className={cn("text-xs",isAvailable?"bg-emerald-50 text-emerald-700":"bg-gray-100 text-gray-600")}>{artisan.availabilityStatus}</Badge>
            </div>
            {artisan.avgRating > 0 && (
              <div className="flex items-center justify-center gap-1 mt-3">
                {Array.from({length:5}).map((_,i)=><Star key={i} className={cn("h-4 w-4",i<Math.round(artisan.avgRating)?"fill-amber-400 text-amber-400":"text-gray-200")}/>)}
                <span className="text-sm text-muted-foreground ml-1">({artisan.totalReviews})</span>
              </div>
            )}
          </CardContent></Card>
          <Card><CardContent className="p-4 space-y-3 text-sm">
            {artisan.yearsExperience > 0 && <div className="flex items-center gap-2 text-muted-foreground"><Briefcase className="h-4 w-4 shrink-0"/>{artisan.yearsExperience} year{artisan.yearsExperience!==1?"s":""} experience</div>}
            {u?.location && <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 shrink-0"/>{u.location}</div>}
            {artisan.workLocations?.length > 0 && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Service Areas</p><div className="flex flex-wrap gap-1">{artisan.workLocations.map((loc: string)=><Badge key={loc} variant="secondary" className="text-xs">{loc}</Badge>)}</div></div>}
            {artisan.specialties?.length > 0 && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">Specialties</p><div className="flex flex-wrap gap-1">{artisan.specialties.map((s: string)=><Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}</div></div>}
          </CardContent></Card>
          <div className="space-y-2">
            {session ? (
              <>
                <Button variant="terracotta" className="w-full gap-2" onClick={()=>router.push(`/messages?artisanId=${artisan.id}`)}><MessageSquare className="h-4 w-4"/>Send Inquiry</Button>
                <Button variant="outline" className="w-full gap-2" onClick={()=>router.push(`/job-requests/new?artisanId=${artisan.id}&category=${artisan.serviceCategory}`)}><FileText className="h-4 w-4"/>Post Job Request</Button>
              </>
            ) : (
              <Button variant="terracotta" className="w-full" onClick={()=>router.push("/login")}>Sign In to Contact</Button>
            )}
          </div>
        </div>

        {/* Right: Bio + Portfolio + Reviews */}
        <div className="lg:col-span-2 space-y-5">
          {artisan.bio && <Card><CardContent className="p-5"><p className="text-sm leading-relaxed text-muted-foreground">{artisan.bio}</p></CardContent></Card>}
          <div className="flex gap-1 border-b">
            {(["portfolio","reviews"] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} className={cn("px-4 py-2.5 text-sm font-medium border-b-2 capitalize",tab===t?"border-terracotta-500 text-foreground":"border-transparent text-muted-foreground")}>{t} {t==="portfolio"?`(${artisan.portfolio?.length||0})`:`(${artisan.artisanReviews?.length||0})`}</button>
            ))}
          </div>
          {tab==="portfolio" && (
            artisan.portfolio?.length===0
              ? <p className="text-center text-muted-foreground py-10">No portfolio items yet</p>
              : <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(artisan.portfolio||[]).map((item: any)=>(
                    <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden border group">
                      <img src={item.imageUrl} alt={item.caption||""} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                      {item.caption && <div className="absolute bottom-0 inset-x-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity"><p className="text-white text-xs">{item.caption}</p></div>}
                    </div>
                  ))}
                </div>
          )}
          {tab==="reviews" && (
            artisan.artisanReviews?.length===0
              ? <p className="text-center text-muted-foreground py-10">No reviews yet</p>
              : <div className="space-y-4">
                  {(artisan.artisanReviews||[]).map((review: any)=>(
                    <Card key={review.id}><CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center font-semibold text-sm shrink-0">{review.author?.firstName?.[0]||"?"}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{review.author?.firstName} {review.author?.lastName}</p>
                            <div className="flex gap-0.5">{Array.from({length:5}).map((_,i)=><Star key={i} className={cn("h-3 w-3",i<review.rating?"fill-amber-400 text-amber-400":"text-gray-200")}/>)}</div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                          {review.artisanResponse && <div className="mt-2 p-2.5 rounded-lg bg-muted/40 text-xs text-muted-foreground"><strong>Artisan reply:</strong> {review.artisanResponse}</div>}
                        </div>
                      </div>
                    </CardContent></Card>
                  ))}
                </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArtisanPage() {
  return <Suspense fallback={<div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><ArtisanProfileContent/></Suspense>;
}
