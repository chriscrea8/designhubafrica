import { db } from "@/lib/db";

const PLATFORM_COMMISSION = 0.10; // 10% total (5% client + 5% designer)
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

// ── Escrow Account ──────────────────────────

export async function createEscrowAccount(projectId: string, clientId: string) {
  return db.escrowAccount.create({ data: { projectId, userId: clientId } });
}

export async function getOrCreateEscrow(projectId: string, clientId: string) {
  let escrow = await db.escrowAccount.findUnique({ where: { projectId } });
  if (!escrow) escrow = await createEscrowAccount(projectId, clientId);
  return escrow;
}

// ── Deposit (after Paystack payment verified) ──

export async function depositToEscrow(params: {
  projectId: string; milestoneId: string; amount: number; paymentRef: string;
}) {
  const escrow = await db.escrowAccount.findUnique({ where: { projectId: params.projectId } });
  if (!escrow) throw new Error("Escrow account not found");

  // Idempotency — check if this payment ref already processed
  const existing = await db.escrowTransaction.findFirst({ where: { paymentRef: params.paymentRef } });
  if (existing) return existing; // Already processed

  const tx = await db.escrowTransaction.create({
    data: {
      escrowAccountId: escrow.id,
      milestoneId: params.milestoneId,
      amount: params.amount,
      type: "DEPOSIT",
      status: "HELD",
      paymentRef: params.paymentRef,
      description: `Escrow deposit for milestone`,
    },
  });

  await db.escrowAccount.update({ where: { id: escrow.id }, data: { balance: { increment: params.amount } } });
  await db.milestone.update({ where: { id: params.milestoneId }, data: { status: "in_progress" } });

  // Update project status
  await db.project.update({ where: { id: params.projectId }, data: { status: "IN_PROGRESS" } });

  // Audit log
  await db.platformTransaction.create({
    data: { type: "ESCROW_DEPOSIT", amount: params.amount, referenceId: params.projectId, description: `Escrow funded: ${params.paymentRef}` },
  });

  return tx;
}

// ── Milestone State Machine ──

export async function submitMilestone(milestoneId: string) {
  const ms = await db.milestone.findUnique({ where: { id: milestoneId } });
  if (!ms || ms.status !== "in_progress") throw new Error("Milestone not in progress");
  return db.milestone.update({ where: { id: milestoneId }, data: { status: "submitted", completedAt: new Date() } });
}

export async function approveMilestone(milestoneId: string, clientId: string) {
  const ms = await db.milestone.findUnique({ where: { id: milestoneId }, include: { project: true } });
  if (!ms) throw new Error("Milestone not found");
  if (ms.project.clientId !== clientId) throw new Error("Only client can approve");
  if (!["submitted", "completed", "in_progress"].includes(ms.status)) throw new Error(`Cannot approve milestone in ${ms.status} status`);

  await db.milestone.update({ where: { id: milestoneId }, data: { status: "approved", approvedAt: new Date() } });

  // Auto-release funds
  return releaseMilestonePayment({ projectId: ms.projectId, milestoneId });
}

export async function rejectMilestone(milestoneId: string, clientId: string, reason: string) {
  const ms = await db.milestone.findUnique({ where: { id: milestoneId }, include: { project: true } });
  if (!ms) throw new Error("Milestone not found");
  if (ms.project.clientId !== clientId) throw new Error("Only client can reject");

  return db.milestone.update({ where: { id: milestoneId }, data: { status: "in_progress" } }); // Back to in_progress for revision
}

// ── Release Funds ──

export async function releaseMilestonePayment(params: { projectId: string; milestoneId: string }) {
  const escrow = await db.escrowAccount.findUnique({
    where: { projectId: params.projectId },
    include: { project: { include: { designer: { include: { user: true } } } } },
  });
  if (!escrow) throw new Error("Escrow not found");
  if (escrow.isLocked) throw new Error("Escrow locked — dispute in progress");

  const milestone = await db.milestone.findUnique({ where: { id: params.milestoneId } });
  if (!milestone) throw new Error("Milestone not found");

  const commission = Math.round(milestone.amount * PLATFORM_COMMISSION);
  const payoutAmount = milestone.amount - commission;

  // Record release transaction
  await db.escrowTransaction.create({
    data: {
      escrowAccountId: escrow.id,
      milestoneId: params.milestoneId,
      amount: payoutAmount,
      type: "MILESTONE_RELEASE",
      status: "RELEASED",
      description: `Released: ${milestone.title}`,
      processedAt: new Date(),
    },
  });

  // Record commission transaction
  await db.escrowTransaction.create({
    data: {
      escrowAccountId: escrow.id,
      milestoneId: params.milestoneId,
      amount: commission,
      type: "COMMISSION",
      status: "DEDUCTED",
      description: `Platform commission: ${milestone.title}`,
      processedAt: new Date(),
    },
  });

  // Deduct from escrow balance
  await db.escrowAccount.update({ where: { id: escrow.id }, data: { balance: { decrement: milestone.amount } } });

  // Credit designer earnings
  if (escrow.project?.designerId) {
    await db.earning.create({
      data: {
        designerId: escrow.project.designerId,
        amount: payoutAmount,
        currency: milestone.currency,
        type: "milestone_payment",
        description: `${milestone.title} — ${escrow.project.title}`,
        status: "available",
      },
    });
  }

  // Update milestone
  await db.milestone.update({ where: { id: params.milestoneId }, data: { status: "paid", paidAt: new Date() } });

  // Record platform commission
  await db.platformTransaction.create({
    data: { type: "PROJECT_COMMISSION", amount: commission, referenceId: params.projectId, description: `Commission: ${milestone.title}` },
  });

  // Check if all milestones are paid — complete the project
  const allMilestones = await db.milestone.findMany({ where: { projectId: params.projectId } });
  const allPaid = allMilestones.every(m => m.status === "paid");
  if (allPaid) {
    await db.project.update({ where: { id: params.projectId }, data: { status: "COMPLETED", progress: 100 } });
  } else {
    // Update progress
    const paidCount = allMilestones.filter(m => m.status === "paid").length;
    const progress = Math.round((paidCount / allMilestones.length) * 100);
    await db.project.update({ where: { id: params.projectId }, data: { progress } });
  }

  // Trigger payout to designer's bank (async, non-blocking)
  try {
    if (escrow.project?.designer?.userId) {
      await initiatePayout(escrow.project.designer.userId, payoutAmount, `Milestone: ${milestone.title}`);
    }
  } catch (e) {
    console.error("[Payout Error]", e); // Payout failure shouldn't block release
  }

  return { payout: payoutAmount, commission, milestoneTitle: milestone.title };
}

// ── Payout to Designer Bank ──

export async function initiatePayout(userId: string, amount: number, description: string) {
  const bank = await db.bankDetail.findUnique({ where: { userId } });
  if (!bank) { console.log("[Payout] No bank details for user", userId); return null; }

  try {
    // Step 1: Create transfer recipient on Paystack
    const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "nuban",
        name: bank.accountName,
        account_number: bank.accountNumber,
        bank_code: bank.bankCode,
        currency: "NGN",
      }),
    });
    const recipientJson = await recipientRes.json();
    if (!recipientJson.status) { console.error("[Payout] Recipient creation failed:", recipientJson.message); return null; }

    // Step 2: Initiate transfer
    const reference = `payout_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const transferRes = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "balance",
        amount: amount * 100, // kobo
        recipient: recipientJson.data.recipient_code,
        reference,
        reason: description,
      }),
    });
    const transferJson = await transferRes.json();
    console.log("[Payout] Transfer:", transferJson.status ? "initiated" : "failed", reference);

    return { reference, status: transferJson.status ? "pending" : "failed" };
  } catch (e) {
    console.error("[Payout] Error:", e);
    return null;
  }
}

// ── Refund ──

export async function refundEscrow(params: { projectId: string; amount: number; reason: string }) {
  const escrow = await db.escrowAccount.findUnique({ where: { projectId: params.projectId } });
  if (!escrow || params.amount > escrow.balance) throw new Error("Insufficient escrow balance");

  await db.escrowTransaction.create({
    data: {
      escrowAccountId: escrow.id,
      amount: params.amount,
      type: "REFUND",
      status: "REFUNDED",
      description: params.reason,
      processedAt: new Date(),
    },
  });

  await db.escrowAccount.update({ where: { id: escrow.id }, data: { balance: { decrement: params.amount } } });
  await db.platformTransaction.create({ data: { type: "ESCROW_REFUND", amount: params.amount, referenceId: params.projectId, description: params.reason } });
}

// ── Lock/Unlock ──

export async function lockEscrow(projectId: string, lock: boolean) {
  return db.escrowAccount.update({ where: { projectId }, data: { isLocked: lock } });
}
