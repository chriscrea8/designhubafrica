"use client";
import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { Lock, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button, Input } from "@/components/ui";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const { register, handleSubmit, formState: { errors }, watch } = useForm<{ password: string; confirm: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(data: { password: string; confirm: string }) {
    if (data.password !== data.confirm) { setError("Passwords do not match"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password: data.password }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Reset failed"); setLoading(false); return; }
      setDone(true);
    } catch { setError("Something went wrong"); }
    setLoading(false);
  }

  if (!token || !email) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Invalid Reset Link</h2>
        <p className="text-sm text-muted-foreground mt-2">This link is invalid or has expired.</p>
        <Link href="/forgot-password" className="inline-flex items-center gap-1.5 text-sm text-terracotta-500 font-medium mt-6 hover:underline">Request a new link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Password Reset!</h2>
        <p className="text-sm text-muted-foreground mt-2">You can now sign in with your new password.</p>
        <Button variant="terracotta" className="mt-6" onClick={() => router.push("/login")}>Sign In</Button>
      </div>
    );
  }

  return (
    <div>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"><ArrowLeft className="h-4 w-4" /> Back to login</Link>
      <h1 className="text-2xl font-bold">Set new password</h1>
      {error && <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700"><AlertCircle className="h-4 w-4 shrink-0" /><p className="text-sm">{error}</p></div>}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div><label className="text-sm font-medium mb-1.5 block">New Password</label><Input type="password" placeholder="Min. 8 characters" icon={<Lock className="h-4 w-4" />} {...register("password", { required: "Required", minLength: { value: 8, message: "Min 8 characters" } })} />{errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}</div>
        <div><label className="text-sm font-medium mb-1.5 block">Confirm Password</label><Input type="password" placeholder="Confirm password" icon={<Lock className="h-4 w-4" />} {...register("confirm", { required: "Required" })} />{errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm.message}</p>}</div>
        <Button type="submit" variant="terracotta" className="w-full gap-2" size="lg" disabled={loading}>{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? "Resetting..." : "Reset Password"}</Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}><ResetForm /></Suspense>;
}
