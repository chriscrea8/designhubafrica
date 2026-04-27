import { z } from "zod";

export const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["CLIENT", "DESIGNER", "ARTISAN", "VENDOR"]),
  location: z.string().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(500).optional(),
  image: z.string().optional(),
});

export const createProjectSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  roomType: z.string(),
  style: z.string(),
  budgetMin: z.number().min(0),
  budgetMax: z.number().min(0),
  currency: z.string().default("NGN"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  urgency: z.enum(["low", "medium", "high"]).optional(),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export const createProposalSchema = z.object({
  projectId: z.string(),
  coverLetter: z.string().min(50).max(3000),
  proposedRate: z.number().min(1000),
  currency: z.string().default("NGN"),
  deliveryDays: z.number().min(1).max(365),
});

export const createProductSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10).max(3000),
  price: z.number().min(100),
  currency: z.string().default("NGN"),
  category: z.string(),
  stockCount: z.number().min(0).default(0),
  dimensions: z.string().optional(),
  material: z.string().optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const createOrderSchema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number().min(1) })).min(1),
  shippingAddress: z.string().min(10),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  type: z.enum(["text", "image", "file"]).default("text"),
  fileUrl: z.string().url().optional(),
});

export const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(2000).optional(),
  designerId: z.string().optional(),
  productId: z.string().optional(),
  projectId: z.string().optional(),
  qualityRating: z.number().min(1).max(5).optional(),
  communicationRating: z.number().min(1).max(5).optional(),
  timelinessRating: z.number().min(1).max(5).optional(),
  professionalismRating: z.number().min(1).max(5).optional(),
}).refine((d) => d.designerId || d.productId, { message: "Must specify designerId or productId" });

export const createDisputeSchema = z.object({
  projectId: z.string(),
  targetId: z.string(),
  reason: z.string().min(20).max(5000),
  evidence: z.array(z.string()).optional(),
});

export const resolveDisputeSchema = z.object({
  outcome: z.enum(["REFUND_CLIENT", "RELEASE_DESIGNER", "PARTIAL_REFUND", "NO_ACTION"]),
  refundAmount: z.number().min(0).optional(),
  adminNotes: z.string().max(3000).optional(),
});

export const escrowDepositSchema = z.object({ projectId: z.string(), milestoneId: z.string(), amount: z.number().min(1000) });
export const escrowReleaseSchema = z.object({ projectId: z.string(), milestoneId: z.string() });
export const subscriptionSchema = z.object({ plan: z.enum(["FREE", "PRO", "ELITE"]), billingCycle: z.enum(["MONTHLY", "YEARLY"]).default("MONTHLY") });

export const initializePaymentSchema = z.object({
  amount: z.number().min(100),
  email: z.string().email(),
  orderId: z.string().optional(),
  milestoneId: z.string().optional(),
  callbackUrl: z.string().url().optional(),
});
