import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || "DesignHub Africa <onboarding@resend.dev>";

function template(content: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:system-ui,sans-serif;background:#f7f5f0;"><div style="max-width:560px;margin:0 auto;padding:40px 20px;"><div style="text-align:center;margin-bottom:24px;"><span style="background:#ec5a1a;color:#fff;font-weight:bold;padding:8px 14px;border-radius:8px;font-size:14px;">DH</span><span style="margin-left:8px;font-weight:700;font-size:16px;">DesignHub Africa</span></div><div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #ece8dd;">${content}</div></div></body></html>`;
}

export async function sendWelcomeEmail(to: string, firstName: string) {
  return resend.emails.send({ from: FROM, to, subject: "Welcome to DesignHub Africa!", html: template(`<h2>Welcome, ${firstName}!</h2><p>Your account is ready.</p><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;background:#ec5a1a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Go to Dashboard</a>`) });
}

export async function sendNotificationEmail(to: string, subject: string, message: string) {
  return resend.emails.send({ from: FROM, to, subject, html: template(`<p>${message}</p>`) });
}
