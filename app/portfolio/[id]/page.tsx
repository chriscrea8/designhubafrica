"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import { Card, CardContent, Badge, Avatar } from "@/components/ui";

export default function PortfolioItemPage() {
  const params = useParams();
  const [item, setItem] = useState<any>(null);
  useEffect(() => { fetch(`/api/portfolio/${params?.id}`).then(r => r.json()).then(res => { if (res.success) setItem(res.data); }); }, [params?.id]);
  if (!item) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500" /></div>;
  const d = item.designer; const u = d?.user;
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/designers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4" /> Back</Link>
      <h1 className="text-3xl font-bold">{item.title}</h1>
      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">{item.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.location}</span>}<Badge variant="secondary">{item.category}</Badge><Badge variant="secondary">{item.style}</Badge></div>
      {item.images?.length > 0 && <div className="grid grid-cols-2 gap-4 mt-6">{item.images.map((img: string, i: number) => <img key={i} src={img} alt="" className="rounded-xl w-full aspect-[4/3] object-cover" />)}</div>}
      <p className="text-muted-foreground mt-6">{item.description}</p>
      {u && <Card className="mt-6"><CardContent className="p-4 flex items-center gap-3"><Avatar fallback={`${u.firstName?.[0]}${u.lastName?.[0]}`} size="md" /><div><p className="font-semibold text-sm">{u.firstName} {u.lastName}</p><p className="text-xs text-muted-foreground">{u.location}</p></div></CardContent></Card>}
    </div>
  );
}
