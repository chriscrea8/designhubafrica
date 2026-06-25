import { describe, it, expect } from "vitest";
import { z } from "zod";

// Inline the schemas we want to test (mirrors what the API routes validate)
const registerSchema = z.object({
  firstName:  z.string().min(2).max(50),
  lastName:   z.string().min(2).max(50),
  email:      z.string().email(),
  password:   z.string().min(8),
  role:       z.enum(["CLIENT","DESIGNER","ARTISAN","VENDOR"]),
});

const projectSchema = z.object({
  title:       z.string().min(5).max(100),
  description: z.string().min(20),
  budget:      z.number().positive(),
  location:    z.string().min(2),
});

const invoiceItemSchema = z.object({
  itemName:   z.string().min(1),
  quantity:   z.number().int().positive(),
  unitPrice:  z.number().positive(),
}).transform(d => ({ ...d, totalPrice: d.quantity * d.unitPrice }));

describe("Registration validation", () => {
  it("accepts valid registration data", () => {
    expect(() => registerSchema.parse({
      firstName:"John", lastName:"Doe", email:"john@example.com", password:"secure123", role:"CLIENT"
    })).not.toThrow();
  });
  it("rejects invalid email", () => {
    expect(() => registerSchema.parse({
      firstName:"John", lastName:"Doe", email:"not-an-email", password:"secure123", role:"CLIENT"
    })).toThrow();
  });
  it("rejects short password", () => {
    expect(() => registerSchema.parse({
      firstName:"John", lastName:"Doe", email:"john@example.com", password:"abc", role:"CLIENT"
    })).toThrow();
  });
  it("rejects invalid role", () => {
    expect(() => registerSchema.parse({
      firstName:"John", lastName:"Doe", email:"j@e.com", password:"secure123", role:"HACKER"
    })).toThrow();
  });
});

describe("Invoice item auto-calculation", () => {
  it("calculates totalPrice correctly", () => {
    const result = invoiceItemSchema.parse({ itemName:"Chair", quantity:3, unitPrice:50000 });
    expect(result.totalPrice).toBe(150000);
  });
  it("rejects zero quantity", () => {
    expect(() => invoiceItemSchema.parse({ itemName:"Chair", quantity:0, unitPrice:50000 })).toThrow();
  });
  it("rejects negative price", () => {
    expect(() => invoiceItemSchema.parse({ itemName:"Chair", quantity:1, unitPrice:-100 })).toThrow();
  });
});

describe("Project validation", () => {
  it("rejects short title", () => {
    expect(() => projectSchema.parse({ title:"Hi", description:"x".repeat(20), budget:10000, location:"Lagos" })).toThrow();
  });
  it("rejects negative budget", () => {
    expect(() => projectSchema.parse({ title:"My project title", description:"x".repeat(20), budget:-1, location:"Lagos" })).toThrow();
  });
});
