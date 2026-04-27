"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Button
const buttonVariants = cva("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      terracotta: "bg-terracotta-500 text-white hover:bg-terracotta-600 shadow-sm shadow-terracotta-500/25",
    },
    size: { default: "h-10 px-4 py-2", sm: "h-9 rounded-md px-3", lg: "h-11 rounded-md px-8 text-base", xl: "h-12 rounded-lg px-10 text-base", icon: "h-10 w-10" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean; }
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

// Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { icon?: React.ReactNode; }
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, icon, ...props }, ref) => {
  if (icon) return <div className="relative"><div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div><input type={type} className={cn("flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 transition-colors", className)} ref={ref} {...props} /></div>;
  return <input type={type} className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 transition-colors", className)} ref={ref} {...props} />;
});
Input.displayName = "Input";

// Badge
const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", {
  variants: { variant: { default: "border-transparent bg-primary text-primary-foreground", secondary: "border-transparent bg-secondary text-secondary-foreground", destructive: "border-transparent bg-destructive text-destructive-foreground", outline: "text-foreground", success: "border-transparent bg-emerald-50 text-emerald-700", warning: "border-transparent bg-amber-50 text-amber-700", info: "border-transparent bg-blue-50 text-blue-700" } },
  defaultVariants: { variant: "default" },
});
function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>) { return <div className={cn(badgeVariants({ variant }), className)} {...props} />; }

// Avatar
function Avatar({ src, fallback, size = "md", className }: { src?: string; fallback: string; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base", xl: "h-16 w-16 text-lg" };
  const [err, setErr] = React.useState(false);
  return <div className={cn("relative flex shrink-0 overflow-hidden rounded-full bg-muted items-center justify-center font-medium text-muted-foreground", sizes[size], className)}>
    {src && !err ? <img src={src} alt={fallback} className="aspect-square h-full w-full object-cover" onError={() => setErr(true)} /> : <span>{fallback}</span>}
  </div>;
}

// Card
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)} {...props} />);
Card.displayName = "Card";
const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />);
CardHeader.displayName = "CardHeader";
const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => <h3 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />);
CardTitle.displayName = "CardTitle";
const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />);
CardContent.displayName = "CardContent";

// Progress
function Progress({ value, className }: { value: number; className?: string }) {
  return <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}><div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

// Separator
function Separator({ className }: { className?: string }) { return <div className={cn("shrink-0 bg-border h-[1px] w-full", className)} />; }

// EmptyState
function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col items-center justify-center py-16 px-4 text-center">{icon && <div className="mb-4 text-muted-foreground">{icon}</div>}<h3 className="text-lg font-semibold mb-2">{title}</h3><p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>{action}</div>;
}

export { Button, buttonVariants, Input, Badge, badgeVariants, Avatar, Card, CardHeader, CardTitle, CardContent, Progress, Separator, EmptyState };
export type { ButtonProps, InputProps };
