import { NavItem } from "@/lib/types";

export const publicNavItems: NavItem[] = [
  { title: "Home", href: "/" }, { title: "Designers", href: "/designers" },
  { title: "Marketplace", href: "/marketplace" }, { title: "Inspiration", href: "/inspiration" },
  { title: "About", href: "/about" },
];

export const dashboardNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { title: "My Projects", href: "/projects", icon: "FolderKanban" },
  { title: "Find Designers", href: "/designers", icon: "Users" },
  { title: "Consultations", href: "/consultations", icon: "Calendar" },
  { title: "Saved Designers", href: "/saved-designers", icon: "Heart" },
  { title: "Orders", href: "/orders", icon: "ShoppingBag" },
  { title: "Messages", href: "/messages", icon: "MessageSquare" },
  { title: "Wallet", href: "/wallet", icon: "Wallet" },
  { title: "Invoices", href: "/invoices", icon: "FileText" },
  { title: "Support", href: "/support", icon: "HelpCircle" },
  { title: "Settings", href: "/settings", icon: "Settings" },
];

export const designerNavItems: NavItem[] = [
  { title: "Dashboard", href: "/designer-dashboard", icon: "LayoutDashboard" },
  { title: "Find Projects", href: "/find-projects", icon: "Search" },
  { title: "My Proposals", href: "/proposals", icon: "FileText" },
  { title: "Active Projects", href: "/active-projects", icon: "FolderKanban" },
  { title: "Portfolio", href: "/portfolio", icon: "Image" },
  { title: "Messages", href: "/client-messages", icon: "MessageSquare" },
  { title: "Earnings", href: "/earnings", icon: "DollarSign" },
  { title: "Analytics", href: "/designer-analytics", icon: "BarChart3" },
  { title: "Verification", href: "/designer-verification", icon: "ShieldCheck" },
  { title: "Subscription", href: "/subscription", icon: "DollarSign" },
  { title: "Support", href: "/designer-support", icon: "HelpCircle" },
  { title: "Settings", href: "/designer-settings", icon: "Settings" },
];

export const artisanNavItems: NavItem[] = [
  { title: "Dashboard", href: "/artisan-dashboard", icon: "LayoutDashboard" },
  { title: "My Services", href: "/artisan-services", icon: "Package" },
  { title: "Proposals", href: "/artisan-proposals", icon: "FileText" },
  { title: "Active Jobs", href: "/artisan-jobs", icon: "FolderKanban" },
  { title: "Messages", href: "/artisan-messages", icon: "MessageSquare" },
  { title: "Earnings", href: "/artisan-earnings", icon: "DollarSign" },
  { title: "Settings", href: "/artisan-settings", icon: "Settings" },
];

export const vendorNavItems: NavItem[] = [
  { title: "Dashboard", href: "/vendor-dashboard", icon: "LayoutDashboard" },
  { title: "Verification", href: "/vendor-verification", icon: "ShieldCheck" },
  { title: "Products", href: "/products", icon: "Package" },
  { title: "Orders", href: "/vendor-orders", icon: "ShoppingBag" },
  { title: "Inventory", href: "/inventory", icon: "Warehouse" },
  { title: "Settings", href: "/store-settings", icon: "Settings" },
];

export const adminNavItems: NavItem[] = [
  { title: "Dashboard", href: "/admin-dashboard", icon: "LayoutDashboard" },
  { title: "Users", href: "/users", icon: "Users" },
  { title: "Designer Approvals", href: "/designer-approvals", icon: "UserCheck" },
  { title: "Vendor Approvals", href: "/vendor-approvals", icon: "Store" },
  { title: "Product Moderation", href: "/marketplace-moderation", icon: "ShieldCheck" },
  { title: "Message Moderation", href: "/moderation-queue", icon: "MessageSquare" },
  { title: "Projects", href: "/project-monitoring", icon: "FolderKanban" },
  { title: "Disputes", href: "/disputes", icon: "AlertTriangle" },
  { title: "Escrow", href: "/escrow", icon: "Wallet" },
  { title: "Subscriptions", href: "/subscriptions", icon: "DollarSign" },
  { title: "Audit Log", href: "/audit-log", icon: "FileText" },
  { title: "Analytics", href: "/analytics", icon: "BarChart3" },
];
