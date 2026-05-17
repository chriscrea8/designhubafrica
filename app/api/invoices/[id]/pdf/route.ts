import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;

  const inv = await db.invoice.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      client: { select: { firstName: true, lastName: true, email: true, location: true } },
      designer: { include: { user: { select: { firstName: true, lastName: true, email: true, location: true, image: true } } } },
      project: { select: { title: true } },
    },
  });
  if (!inv) return new NextResponse("Not found", { status: 404 });

  const d = inv.designer?.user;
  const c = inv.client;
  const num = `INV-${inv.id.slice(-8).toUpperCase()}`;
  const dateStr = new Date(inv.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const dueStr = inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : null;

  const statusColor = inv.status === "PAID" ? "#059669" : inv.status === "SENT" ? "#1d4ed8" : "#6b7280";
  const itemRows = inv.items.map(item => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;font-weight:500">${item.itemName}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px">${item.description || ""}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:center">${item.quantity}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:right">₦${item.unitPrice.toLocaleString()}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600">₦${item.totalPrice.toLocaleString()}</td>
    </tr>`).join("");

  const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><title>${num}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#111827; background:#fff; }
  .page { max-width:800px; margin:0 auto; padding:56px 48px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:48px; }
  .brand-name { font-size:22px; font-weight:800; letter-spacing:-0.5px; color:#c84b31; }
  .brand-tag { font-size:10px; font-weight:500; color:#9ca3af; letter-spacing:3px; text-transform:uppercase; margin-top:2px; }
  .invoice-label { font-size:36px; font-weight:800; color:#111827; letter-spacing:-1px; }
  .invoice-meta { text-align:right; margin-top:8px; }
  .invoice-meta p { font-size:13px; color:#6b7280; margin-top:2px; }
  .status-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; color:${statusColor}; background:${statusColor}18; margin-top:8px; }
  .divider { height:1px; background:#f3f4f6; margin:32px 0; }
  .parties { display:grid; grid-template-columns:1fr 1fr; gap:32px; margin:32px 0; }
  .party-label { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:2px; color:#9ca3af; margin-bottom:8px; }
  .party-name { font-size:16px; font-weight:700; color:#111827; margin-bottom:4px; }
  .party-detail { font-size:13px; color:#6b7280; line-height:1.6; }
  .project-tag { font-size:13px; color:#6b7280; margin-bottom:24px; }
  .invoice-title { font-size:20px; font-weight:700; margin-bottom:4px; }
  .notes { font-size:13px; color:#6b7280; margin-bottom:24px; }
  table { width:100%; border-collapse:collapse; margin:16px 0; }
  th { background:#111827; color:#fff; padding:11px 16px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; font-weight:600; }
  th:last-child, th:nth-child(3), th:nth-child(4) { text-align:right; }
  th:nth-child(3) { text-align:center; }
  .total-row td { padding:14px 16px; font-size:16px; font-weight:800; border-top:2px solid #c84b31; background:#fff8f6; color:#c84b31; }
  .total-row td:first-child { color:#111827; }
  .footer { margin-top:48px; padding-top:24px; border-top:1px solid #f3f4f6; text-align:center; }
  .footer p { font-size:12px; color:#9ca3af; margin-top:2px; }
  @media print { .page { padding:24px; } }
</style>
</head>
<body><div class="page">
  <div class="header">
    <div>
      <div class="brand-name">DesignHub Africa</div>
      <div class="brand-tag">Interior Design Marketplace</div>
    </div>
    <div style="text-align:right">
      <div class="invoice-label">INVOICE</div>
      <div class="invoice-meta">
        <p><strong>${num}</strong></p>
        <p>Issued: ${dateStr}</p>
        ${dueStr ? `<p>Due: ${dueStr}</p>` : ""}
        <div class="status-badge">${inv.status}</div>
      </div>
    </div>
  </div>

  <div class="parties">
    <div>
      <div class="party-label">From</div>
      <div class="party-name">${d?.firstName || ""} ${d?.lastName || ""}</div>
      <div class="party-detail">${d?.email || ""}<br>${d?.location || ""}</div>
    </div>
    <div>
      <div class="party-label">Bill To</div>
      <div class="party-name">${c?.firstName || ""} ${c?.lastName || ""}</div>
      <div class="party-detail">${c?.email || ""}<br>${c?.location || ""}</div>
    </div>
  </div>

  ${inv.project ? `<p class="project-tag">📁 Project: <strong>${inv.project.title}</strong></p>` : ""}

  <div class="invoice-title">${inv.title}</div>
  ${inv.notes ? `<p class="notes">${inv.notes}</p>` : ""}

  <table>
    <thead><tr>
      <th>Item</th><th>Description</th><th style="text-align:center">Qty</th>
      <th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th>
    </tr></thead>
    <tbody>
      ${itemRows}
      <tr class="total-row">
        <td colspan="4" style="text-align:right;padding-right:16px">Total Amount</td>
        <td style="text-align:right">₦${inv.totalAmount.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p style="font-weight:600;color:#374151">DesignHub Africa</p>
    <p>Africa's Leading Interior Design Marketplace</p>
    <p style="margin-top:8px">Thank you for your business!</p>
  </div>
</div>
<script>window.addEventListener('load', () => window.print());</script>
</body></html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="${num}.html"`,
    },
  });
}
