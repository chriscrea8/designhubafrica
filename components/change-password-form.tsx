"use client";
import React, { useState } from "react";
import { Button, Input } from "@/components/ui";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export function ChangePasswordForm() {
  const [step, setStep] = useState<"form" | "verify" | "done">("form");
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");

  async function requestCode() {
    if (!current || !newPw || newPw.length < 8) { setError("Fill all fields. New password min 8 chars"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/users/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "request", currentPassword: current, newPassword: newPw }) });
    const json = await res.json(); setLoading(false);
    if (json.success) { setMaskedEmail(json.data.email); setStep("verify"); }
    else setError(json.error || "Failed. Check your current password.");
  }

  async function confirmChange() {
    if (!code || code.length < 6) { setError("Enter the 6-digit code"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/users/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "confirm", code, newPassword: newPw }) });
    const json = await res.json(); setLoading(false);
    if (json.success) setStep("done");
    else setError(json.error || "Invalid or expired code");
  }

  if (step === "done") return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      <h3 className="font-semibold">Password Changed!</h3>
      <p className="text-sm text-muted-foreground">Your password has been updated successfully.</p>
      <Button variant="outline" onClick={() => { setStep("form"); setCurrent(""); setNewPw(""); setCode(""); }}>Done</Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
      {step === "form" && (<>
        <div><label className="text-sm font-medium mb-1.5 block">Current Password</label><Input type="password" value={current} onChange={e => setCurrent(e.target.value)} /></div>
        <div><label className="text-sm font-medium mb-1.5 block">New Password <span className="text-muted-foreground font-normal">(min 8 chars)</span></label><Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} /></div>
        <Button variant="terracotta" onClick={requestCode} disabled={loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Send Verification Code</Button>
      </>)}
      {step === "verify" && (<>
        <p className="text-sm text-muted-foreground">A 6-digit code was sent to <strong>{maskedEmail}</strong>. Check your inbox (and spam folder).</p>
        <div><label className="text-sm font-medium mb-1.5 block">Verification Code</label><Input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" maxLength={6} className="font-mono text-center text-xl tracking-widest w-40" /></div>
        <div className="flex gap-2">
          <Button variant="terracotta" onClick={confirmChange} disabled={loading || code.length < 6} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Confirm Change</Button>
          <Button variant="outline" onClick={() => { setStep("form"); setError(""); }}>Back</Button>
        </div>
      </>)}
    </div>
  );
}
