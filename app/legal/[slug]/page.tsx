import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const content: Record<string, { title: string; body: string }> = {
  terms: {
    title: "Terms of Service",
    body: `**Last updated: April 2026**

**1. Platform Role**
DesignHub Africa operates as an intermediary marketplace connecting clients with interior designers and artisans. We do not employ designers and are not a party to contracts between clients and designers.

**2. Escrow Services**
All project payments are held in escrow by DesignHub Africa. Funds are released to designers only after client approval of completed milestones. This protects both parties.

**3. User Responsibilities**
Clients are responsible for clearly communicating project requirements. Designers are responsible for delivering agreed-upon work as described in accepted proposals.

**4. Prohibited Conduct**
Users must not attempt to take transactions off-platform, share contact information before permitted stages, misrepresent services or qualifications, or engage in fraudulent activity.

**5. Commission**
DesignHub Africa charges a 10% platform commission on all project payments. This is deducted automatically at milestone release.

**6. Account Termination**
We reserve the right to terminate accounts that violate these terms, with or without notice.

**7. Dispute Resolution**
Disputes are handled through our in-platform dispute system. DesignHub Africa's decision in disputes is final.`,
  },
  privacy: {
    title: "Privacy Policy",
    body: `**Last updated: April 2026**

**1. Information We Collect**
We collect information you provide directly: name, email, location, profile data, portfolio content, and payment details. We also collect usage data including pages visited, features used, and device information.

**2. How We Use Your Information**
Your information is used to provide platform services, process payments, facilitate communication between users, improve our platform, send important notifications, and comply with legal obligations.

**3. Data Storage**
Data is stored securely on servers in the European Union and US. Financial transaction data is processed through Paystack and is subject to their privacy policy.

**4. Data Sharing**
We do not sell your personal information. We share data only with service providers necessary to operate the platform (payment processors, cloud hosting, email services).

**5. Your Rights**
You have the right to access, correct, or delete your personal data. Contact us at privacy@designhubafrica.com to exercise these rights.

**6. Cookies**
We use essential cookies for authentication and preferences. No advertising cookies are used.`,
  },
  refunds: {
    title: "Refund & Dispute Policy",
    body: `**Last updated: April 2026**

**1. Escrow Protection**
All project funds are held in escrow until milestones are approved. This protects clients from designers who fail to deliver.

**2. Milestone Refunds**
Funded milestones can be refunded if:
• The designer has not yet started work (status: PENDING)
• A dispute is raised and resolved in the client's favour
• Both parties agree to cancel the project

**3. Dispute Process**
Step 1: Client raises a dispute through the platform
Step 2: Both parties submit evidence within 7 days
Step 3: DesignHub Africa reviews and makes a decision within 14 days
Step 4: Funds are released or refunded based on the decision

**4. Non-Refundable Items**
Consultation fees are non-refundable once the session has taken place. Platform commission (10%) is non-refundable.

**5. Chargebacks**
Initiating a chargeback while a legitimate dispute is in progress may result in account suspension.`,
  },
  payments: {
    title: "Payment Policy",
    body: `**Last updated: April 2026**

**1. Payment Methods**
Payments are processed via Paystack. Accepted methods include debit/credit cards and bank transfers.

**2. Escrow Model**
Clients fund milestones before work begins. Funds are held by DesignHub Africa until the client approves the delivered work. This is full escrow — we hold 100% of milestone payments.

**3. Platform Commission**
DesignHub Africa charges a 10% commission on all project payments:
• 5% charged to the client (included in the amount funded)
• 5% deducted from designer payout

**4. Designer Payouts**
Approved milestone funds are paid out to designers' registered bank accounts within 24-48 hours. A minimum payout of ₦1,000 applies.

**5. Consultation Fees**
Consultation fees are paid directly to the designer minus the platform commission. Funds are released after the consultation is marked complete.

**6. Taxes**
Users are responsible for all applicable taxes on earnings. DesignHub Africa does not withhold taxes.`,
  },
};

export default function LegalContentPage({ params }: { params: { slug: string } }) {
  const page = content[params.slug];
  if (!page) notFound();
  const paragraphs = page.body.split("\n\n");
  return (
    <div className="container mx-auto px-4 lg:px-8 py-16 max-w-3xl">
      <Link href="/legal" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8"><ArrowLeft className="h-4 w-4" />Legal</Link>
      <h1 className="text-3xl font-bold mb-8">{page.title}</h1>
      <div className="prose prose-sm max-w-none space-y-4">
        {paragraphs.map((para, i) => {
          if (para.startsWith("**") && para.endsWith("**")) return <h2 key={i} className="text-lg font-semibold mt-6">{para.replace(/\*\*/g, "")}</h2>;
          const parts = para.split(/(\*\*[^*]+\*\*)/);
          return <p key={i} className="text-muted-foreground leading-relaxed">{parts.map((part, j) => part.startsWith("**") ? <strong key={j} className="text-foreground font-semibold">{part.replace(/\*\*/g, "")}</strong> : part)}</p>;
        })}
      </div>
    </div>
  );
}
