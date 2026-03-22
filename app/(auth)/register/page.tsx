"use client";
import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { Mail, Lock, User, MapPin, Loader2, AlertCircle, Gift } from "lucide-react";
import { Button, Input, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface RegisterForm { firstName: string; lastName: string; email: string; password: string; location: string; }

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams?.get("ref") || "";
  const [role, setRole] = useState<string>("CLIENT");
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(data: RegisterForm) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, role, referralCode: refCode || undefined }) });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Registration failed"); setLoading(false); return; }
      const result = await signIn("credentials", { email: data.email, password: data.password, redirect: false });
      setLoading(false);
      if (result?.error) { router.push("/login"); return; }
      if (role === "DESIGNER") router.push("/onboarding");
      else if (role === "ARTISAN") router.push("/artisan-dashboard");
      else if (role === "VENDOR") router.push("/vendor-dashboard");
      else router.push("/dashboard");
    } catch { setError("Something went wrong"); setLoading(false); }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Create your account</h1>
      {refCode && <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200"><Gift className="h-4 w-4 text-emerald-600" /><p className="text-xs text-emerald-700">You were referred! Both you and your friend earn rewards.</p></div>}
      {error && <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700"><AlertCircle className="h-4 w-4 shrink-0" /><p className="text-sm">{error}</p></div>}
      <div className="grid grid-cols-2 gap-2 mt-6">
        {[{ t: "CLIENT", l: "I need a designer", e: "\uD83C\uDFE0" }, { t: "DESIGNER", l: "I'm a designer", e: "\uD83C\uDFA8" }, { t: "ARTISAN", l: "I'm an artisan", e: "\uD83D\uDD28" }, { t: "VENDOR", l: "I sell products", e: "\uD83D\uDCE6" }].map((o) => (
          <button key={o.t} type="button" onClick={() => setRole(o.t)} className={cn("flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all", role === o.t ? "border-terracotta-500 bg-terracotta-50 ring-1 ring-terracotta-500" : "border-border hover:border-foreground/30")}>
            <span className="text-xl">{o.e}</span><span className="text-xs font-medium">{o.l}</span>
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-sm font-medium mb-1.5 block">First Name</label><Input placeholder="First name" icon={<User className="h-4 w-4" />} {...register("firstName", { required: "Required" })} />{errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}</div>
          <div><label className="text-sm font-medium mb-1.5 block">Last Name</label><Input placeholder="Last name" {...register("lastName", { required: "Required" })} />{errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}</div>
        </div>
        <div><label className="text-sm font-medium mb-1.5 block">Email</label><Input type="email" placeholder="you@example.com" icon={<Mail className="h-4 w-4" />} {...register("email", { required: "Required" })} />{errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}</div>
        <div><label className="text-sm font-medium mb-1.5 block">Location</label><Input placeholder="City, Country" icon={<MapPin className="h-4 w-4" />} {...register("location")} /></div>
        <div><label className="text-sm font-medium mb-1.5 block">Password</label><Input type="password" placeholder="Min. 8 characters" icon={<Lock className="h-4 w-4" />} {...register("password", { required: "Required", minLength: { value: 8, message: "Min 8 characters" } })} />{errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}</div>
        <Button type="submit" variant="terracotta" className="w-full gap-2" size="lg" disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? "Creating account\u2026" : "Create Account"}</Button>
      </form>
      <div className="relative my-8"><div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div></div>
      <Button variant="outline" className="w-full gap-2" size="lg" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
        <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Google
      </Button>
      <p className="text-sm text-center text-muted-foreground mt-8">Already have an account? <Link href="/login" className="text-terracotta-500 font-medium hover:underline">Sign in</Link></p>
    </div>
  );
}

export default function RegisterPage() {
  return <Suspense fallback={<div className="p-8">Loading...</div>}><RegisterContent /></Suspense>;
}
