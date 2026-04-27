import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth();
  if (error) return error;
  const invoice = await db.invoice.findUnique({ where: { id: params.id }, include: { items: true, client: { select: { firstName: true, lastName: true, email: true, location: true } }, designer: { include: { user: { select: { firstName: true, lastName: true, email: true, location: true } } } }, project: { select: { title: true } } } });
  if (!invoice) return new NextResponse("Not found", { status: 404 });

  const d = invoice.designer.user;
  const c = invoice.client;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${invoice.id.slice(-6).toUpperCase()}</title><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 48px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
    .brand { font-size: 24px; font-weight: 700; color: #c84b31; }
    .brand span { display: block; font-size: 11px; font-weight: 400; color: #666; letter-spacing: 2px; text-transform: uppercase; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 28px; font-weight: 800; color: #c84b31; }
    .invoice-meta p { font-size: 13px; color: #666; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin: 32px 0; padding: 24px; background: #f9f9f9; border-radius: 8px; }
    .party h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 6px; }
    .party p { font-size: 14px; line-height: 1.6; }
    .party .name { font-weight: 600; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin: 24px 0; }
    th { background: #1a1a1a; color: white; padding: 12px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; }
    tr:last-child td { border-bottom: none; }
    .total-row { background: #fff8f6; }
    .total-row td { font-weight: 700; font-size: 16px; color: #c84b31; border-top: 2px solid #c84b31; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: ${invoice.status === "PAID" ? "#d1fae5" : invoice.status === "SENT" ? "#dbeafe" : "#f3f4f6"}; color: ${invoice.status === "PAID" ? "#065f46" : invoice.status === "SENT" ? "#1e40af" : "#374151"}; }
    @media print { body { padding: 24px; } .no-print { display: none; } }
  </style></head>
  <body>
    <div class="header">
      <div class="brand">DesignHub<span>Africa</span></div>
      <div class="invoice-meta">
        <h2>INVOICE</h2>
        <p>#INV-${invoice.id.slice(-6).toUpperCase()}</p>
        <p>Date: ${new Date(invoice.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>
        ${invoice.dueDate ? `<p>Due: ${new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>` : ""}
        <p style="margin-top:8px"><span class="status">${invoice.status}</span></p>
      </div>
    </div>

    <div class="parties">
      <div class="party">
        <h4>From</h4>
        <p class="name">${d.firstName} ${d.lastName}</p>
        <p>${d.email}</p>
        ${d.location ? `<p>${d.location}</p>` : ""}
      </div>
      <div class="party">
        <h4>To</h4>
        <p class="name">${c.firstName} ${c.lastName}</p>
        <p>${c.email}</p>
        ${c.location ? `<p>${c.location}</p>` : ""}
      </div>
    </div>

    ${invoice.project ? `<p style="margin-bottom:16px;font-size:14px;color:#666;"><strong>Project:</strong> ${invoice.project.title}</p>` : ""}
    <p style="margin-bottom:8px;font-size:18px;font-weight:700;">${invoice.title}</p>
    ${invoice.notes ? `<p style="font-size:14px;color:#666;margin-bottom:24px;">${invoice.notes}</p>` : ""}

    <table>
      <thead><tr><th>Item</th><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>
        ${invoice.items.map(item => `<tr><td><strong>${item.itemName}</strong></td><td style="color:#666">${item.description || ""}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">₦${item.unitPrice.toLocaleString()}</td><td style="text-align:right">₦${item.totalPrice.toLocaleString()}</td></tr>`).join("")}
        <tr class="total-row"><td colspan="4">Total Amount</td><td style="text-align:right">₦${invoice.totalAmount.toLocaleString()}</td></tr>
      </tbody>
    </table>

    <div class="footer">
      <p>DesignHub Africa — Africa's Interior Design Marketplace</p>
      <p style="margin-top:4px">Thank you for your business.</p>
    </div>
    <script>window.onload = () => window.print();</script>
  </body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html", "Content-Disposition": `inline; filename="invoice-${invoice.id.slice(-6)}.html"` } });
}
