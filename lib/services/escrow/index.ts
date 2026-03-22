import { db } from "@/lib/db";

export async function createEscrowAccount(projectId: string, clientId: string) {
  return db.escrowAccount.create({ data: { projectId, userId: clientId } });
}

export async function depositToEscrow(params: { projectId: string; milestoneId: string; amount: number; paymentRef: string }) {
  const escrow = await db.escrowAccount.findUnique({ where: { projectId: params.projectId } });
  if (!escrow) throw new Error("Escrow account not found");
  await db.escrowTransaction.create({ data: { escrowAccountId: escrow.id, milestoneId: params.milestoneId, amount: params.amount, type: "DEPOSIT", status: "HELD", paymentRef: params.paymentRef } });
  await db.escrowAccount.update({ where: { id: escrow.id }, data: { balance: { increment: params.amount } } });
  await db.milestone.update({ where: { id: params.milestoneId }, data: { status: "in_progress" } });
}

export async function releaseMilestonePayment(params: { projectId: string; milestoneId: string }) {
  const escrow = await db.escrowAccount.findUnique({ where: { projectId: params.projectId }, include: { project: { include: { designer: true } } } });
  if (!escrow) throw new Error("Escrow not found");
  if (escrow.isLocked) throw new Error("Escrow locked due to dispute");
  const milestone = await db.milestone.findUnique({ where: { id: params.milestoneId } });
  if (!milestone || milestone.status !== "completed") throw new Error("Milestone not completed");
  const fee = Math.round(milestone.amount * 0.05);
  const payout = milestone.amount - fee;
  await db.escrowTransaction.create({ data: { escrowAccountId: escrow.id, milestoneId: params.milestoneId, amount: payout, type: "MILESTONE_RELEASE", status: "RELEASED", processedAt: new Date() } });
  await db.escrowAccount.update({ where: { id: escrow.id }, data: { balance: { decrement: milestone.amount } } });
  if (escrow.project?.designerId) {
    await db.earning.create({ data: { designerId: escrow.project.designerId, amount: payout, currency: milestone.currency, type: "milestone_payment", description: milestone.title, status: "available" } });
  }
  await db.milestone.update({ where: { id: params.milestoneId }, data: { status: "paid", paidAt: new Date() } });
  await db.platformTransaction.create({ data: { type: "PROJECT_COMMISSION", amount: fee, referenceId: params.projectId, description: `Commission: ${milestone.title}` } });
  return { payout, fee };
}

export async function refundEscrow(params: { projectId: string; amount: number; reason: string }) {
  const escrow = await db.escrowAccount.findUnique({ where: { projectId: params.projectId } });
  if (!escrow || params.amount > escrow.balance) throw new Error("Insufficient balance");
  await db.escrowTransaction.create({ data: { escrowAccountId: escrow.id, amount: params.amount, type: "REFUND", status: "REFUNDED", description: params.reason, processedAt: new Date() } });
  await db.escrowAccount.update({ where: { id: escrow.id }, data: { balance: { decrement: params.amount } } });
}

export async function lockEscrow(projectId: string, lock: boolean) {
  return db.escrowAccount.update({ where: { projectId }, data: { isLocked: lock } });
}
