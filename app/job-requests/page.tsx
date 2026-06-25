"use client";
import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Plus, MapPin, Briefcase, Clock, MessageSquare } from "lucide-react";
import { Card, CardContent, Button, Badge, EmptyState } from "@/components/ui";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const CATS = ["All","Carpenter","Electrician","Painter","POP Installer","Furniture Maker","Tiler","Welder","Plumber","Curtain Installer"];

function JobRequestsBrowse() {
  const { data: session } = useSession();
  const [jobs, setJobs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [mine, setMine]       = useState(false);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ limit:"30" });
    if (category !== "All") p.set("category", category.toLowerCase().replace(/ /g,"_"));
    if (mine) p.set("mine","true");
    fetch(`/api/job-requests?${p}`).then(r=>r.json()).then(res=>{
      if (res.success) setJobs(res.data?.items||[]);
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, [category, mine]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div><h1 className="text-3xl font-bold">Job Requests</h1><p className="text-muted-foreground mt-1">Browse open jobs and submit your quote</p></div>
        {session && <Link href="/job-requests/new"><Button variant="terracotta" className="gap-2"><Plus className="h-4 w-4"/>Post a Job</Button></Link>}
      </div>
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="flex gap-2 flex-wrap flex-1">
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCategory(c)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",category===c?"bg-terracotta-500 text-white border-terracotta-500":"border-border text-muted-foreground hover:border-foreground/40")}>{c}</button>
          ))}
        </div>
        {session && <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={mine} onChange={e=>setMine(e.target.checked)} className="rounded"/>My jobs only</label>}
      </div>
      {loading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>
      : jobs.length===0 ? <EmptyState icon={<Briefcase className="h-12 w-12"/>} title="No job requests found" description="Be the first to post a job request" action={session&&<Link href="/job-requests/new"><Button variant="terracotta" className="gap-2"><Plus className="h-4 w-4"/>Post a Job</Button></Link>}/>
      : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job:any)=>(
            <Link key={job.id} href={`/job-requests/${job.id}`} className="group">
              <Card className="h-full hover:shadow-md transition-shadow"><CardContent className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs capitalize">{job.artisanCategory?.replace(/_/g," ")}</Badge>
                  <Badge className="bg-emerald-50 text-emerald-700 text-xs">{job.status}</Badge>
                </div>
                <h3 className="font-semibold line-clamp-2 group-hover:text-terracotta-500 transition-colors">{job.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{job.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground flex-wrap">
                  <span className="font-bold text-foreground">{formatCurrency(job.budget)}</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3"/>{job.location}</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3"/>{job._count?.quotes||0} quotes</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{formatDate(job.createdAt)}</p>
              </CardContent></Card>
            </Link>
          ))}
        </div>}
    </div>
  );
}

export default function JobRequestsPage() {
  return <Suspense fallback={<div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-terracotta-500"/></div>}><JobRequestsBrowse/></Suspense>;
}
