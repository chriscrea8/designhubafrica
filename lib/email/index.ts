import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.FROM_EMAIL || "DesignHub Africa <noreply@designhubafrica.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://designhubafrica.vercel.app";

function wrap(title: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f5f0">
<div style="max-width:580px;margin:0 auto;padding:48px 20px">
  <div style="text-align:center;margin-bottom:32px">
    <span style="background:#c84b31;color:#fff;font-weight:800;padding:10px 16px;border-radius:10px;font-size:15px;letter-spacing:-0.5px">DH</span>
    <span style="margin-left:10px;font-weight:700;font-size:18px;color:#111">DesignHub Africa</span>
  </div>
  <div style="background:#fff;border-radius:16px;padding:40px;border:1px solid #e8e3d8">
    <h2 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111">${title}</h2>
    ${body}
  </div>
  <p style="text-align:center;margin-top:24px;font-size:12px;color:#9ca3af">© ${new Date().getFullYear()} DesignHub Africa · Africa's Interior Design Marketplace</p>
</div></body></html>`;
}

function btn(text: string, url: string): string {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;background:#c84b31;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">${text}</a>`;
}

function p(text: string): string {
  return `<p style="margin:12px 0;color:#374151;font-size:15px;line-height:1.7">${text}</p>`;
}

async function send(to: string, subject: string, html: string) {
  try {
    return await resend.emails.send({ from: FROM, to, subject, html });
  } catch (e) {
    console.error("[Email Error]", e);
    return null;
  }
}

// ── Auth ─────────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, firstName: string, role: string) {
  const dashPath = role === "DESIGNER" ? "/designer-dashboard" : "/dashboard";
  return send(to, "Welcome to DesignHub Africa! 🎉", wrap(
    `Welcome, ${firstName}!`,
    `${p("You've joined Africa's premier interior design marketplace.")}
     ${p("Your account is ready. Explore designers, post projects, and connect with creative professionals across the continent.")}
     ${btn("Get Started", `${APP_URL}${dashPath}`)}`
  ));
}

export async function sendPasswordResetEmail(to: string, firstName: string, token: string) {
  return send(to, "Reset Your Password — DesignHub Africa", wrap(
    "Password Reset Request",
    `${p(`Hi ${firstName}, we received a request to reset your password.`)}
     ${p("Use the code below to reset your password. It expires in 15 minutes.")}
     <div style="text-align:center;margin:24px 0"><span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#c84b31;background:#fff8f6;padding:16px 24px;border-radius:12px;display:inline-block">${token}</span></div>
     ${p("If you didn't request this, you can safely ignore this email.")}`
  ));
}

// ── Projects ─────────────────────────────────────────────────────
export async function sendProposalReceivedEmail(to: string, clientName: string, designerName: string, projectTitle: string, proposalId: string) {
  return send(to, `New Proposal on "${projectTitle}"`, wrap(
    "You Have a New Proposal!",
    `${p(`Hi ${clientName},`)}
     ${p(`<strong>${designerName}</strong> has submitted a proposal for your project <strong>"${projectTitle}"</strong>.`)}
     ${p("Review the proposal, milestone breakdown, and pricing to see if it's the right fit.")}
     ${btn("View Proposal", `${APP_URL}/projects`)}`
  ));
}

export async function sendProposalAcceptedEmail(to: string, designerName: string, projectTitle: string) {
  return send(to, "Your Proposal Was Accepted! 🎉", wrap(
    "Congratulations!",
    `${p(`Hi ${designerName},`)}
     ${p(`Your proposal for <strong>"${projectTitle}"</strong> has been accepted by the client.`)}
     ${p("The client will fund the first milestone to get started. Check your active projects to see the details.")}
     ${btn("View Active Projects", `${APP_URL}/active-projects`)}`
  ));
}

// ── Payments ─────────────────────────────────────────────────────
export async function sendMilestoneFundedEmail(to: string, designerName: string, milestoneTitle: string, amount: number, projectTitle: string) {
  return send(to, `Milestone Funded — Begin Work on "${milestoneTitle}"`, wrap(
    "Milestone Ready to Start",
    `${p(`Hi ${designerName},`)}
     ${p(`The client has funded the milestone <strong>"${milestoneTitle}"</strong> (₦${amount.toLocaleString()}) for project <strong>"${projectTitle}"</strong>.`)}
     ${p("Funds are held securely in escrow and will be released upon client approval of your work.")}
     ${btn("View Project", `${APP_URL}/active-projects`)}`
  ));
}

export async function sendMilestoneApprovedEmail(to: string, designerName: string, milestoneTitle: string, netAmount: number) {
  return send(to, "Payment Released! 💰", wrap(
    "Milestone Approved & Paid",
    `${p(`Hi ${designerName},`)}
     ${p(`The client has approved your work on <strong>"${milestoneTitle}"</strong>.`)}
     ${p(`<strong>₦${netAmount.toLocaleString()}</strong> has been released to your earnings and will be transferred to your bank account within 24–48 hours.`)}
     ${btn("View Earnings", `${APP_URL}/earnings`)}`
  ));
}

export async function sendPayoutEmail(to: string, designerName: string, amount: number, reference: string) {
  return send(to, "Payout Initiated", wrap(
    "Your Payout Is On the Way",
    `${p(`Hi ${designerName},`)}
     ${p(`Your payout of <strong>₦${amount.toLocaleString()}</strong> has been initiated to your registered bank account.`)}
     ${p(`Reference: <code style="font-family:monospace;background:#f3f4f6;padding:2px 6px;border-radius:4px">${reference}</code>`)}
     ${p("Allow 24–48 hours for the transfer to reflect.")}`
  ));
}

// ── Consultations ─────────────────────────────────────────────────
export async function sendConsultationBookedEmail(to: string, designerName: string, clientName: string, type: string, scheduledAt?: string) {
  return send(to, "New Consultation Booked", wrap(
    "Consultation Request",
    `${p(`Hi ${designerName},`)}
     ${p(`<strong>${clientName}</strong> has booked a <strong>${type}</strong> consultation with you.`)}
     ${scheduledAt ? p(`Scheduled: <strong>${new Date(scheduledAt).toLocaleString("en-GB")}</strong>`) : ""}
     ${p("The client has paid. Log in to view their details and your meeting link.")}
     ${btn("View Consultations", `${APP_URL}/designer-consultations`)}`
  ));
}

// ── Generic ─────────────────────────────────────────────────────
export async function sendNotificationEmail(to: string, subject: string, message: string, ctaText?: string, ctaUrl?: string) {
  return send(to, subject, wrap(
    subject,
    `${p(message)}${ctaText && ctaUrl ? btn(ctaText, `${APP_URL}${ctaUrl}`) : ""}`
  ));
}
