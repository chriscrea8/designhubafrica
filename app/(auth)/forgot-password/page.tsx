"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(data: { email: string }) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Something went wrong"); setLoading(false); return; }
      setSent(true);
    } catch { setError("Something went wrong"); }
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold">Check your email</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          If an account exists with that email, we sent a password reset link. Check your inbox and spam folder.
        </p>
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-terracotta-500 font-medium mt-6 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>
      <h1 className="text-2xl font-bold">Reset your password</h1>
      <p className="text-sm text-muted-foreground mt-1">Enter your email and we will send you a reset link.</p>
      {error && (
        <div className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /><p className="text-sm">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Email</label>
          <Input type="email" placeholder="you@example.com" icon={<Mail className="h-4 w-4" />} {...register("email", { required: "Email is required" })} />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <Button type="submit" variant="terracotta" className="w-full gap-2" size="lg" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>
    </div>
  );
}
