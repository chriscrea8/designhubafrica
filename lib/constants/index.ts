export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: number | string;
  group?: string;
}

// ── CLIENT NAV ───────────────────────────────────────────────────────────────
export const dashboardNavItems: NavItem[] = [
  // Core
  { title: "Dashboard",        href: "/dashboard",       icon: "LayoutDashboard",  group: "main" },
  { title: "My Projects",      href: "/projects",        icon: "FolderKanban",     group: "main" },
  { title: "Messages",         href: "/messages",        icon: "MessageSquare",    group: "main" },
  { title: "Invoices",         href: "/invoices",        icon: "FileText",         group: "main" },
  // Discovery
  { title: "Find Designers",   href: "/designers",       icon: "Users",            group: "discover" },
  { title: "Find Artisans",    href: "/artisans",        icon: "Hammer",           group: "discover" },
  { title: "Marketplace",      href: "/marketplace",     icon: "ShoppingCart",     group: "discover" },
  { title: "Inspiration",      href: "/inspiration",     icon: "Sparkles",         group: "discover" },
  // Bookings
  { title: "Consultations",    href: "/consultations",   icon: "Calendar",         group: "bookings" },
  { title: "RFQ / Get Quotes",  href: "/rfq",             icon: "FileText",         group: "bookings" },
  { title: "Job Requests",     href: "/job-requests",    icon: "Briefcase",        group: "bookings" },
  { title: "Site Visits",      href: "/site-visits",     icon: "MapPin",           group: "bookings" },
  // Saved
  { title: "Moodboards",       href: "/moodboards",      icon: "BookMarked",       group: "saved" },
  { title: "Wishlist",         href: "/wishlist",        icon: "Heart",            group: "saved" },
  { title: "Saved Designers",  href: "/saved-designers", icon: "Star",             group: "saved" },
  // Account
  { title: "Business Account", href: "/business",        icon: "Building2",        group: "account" },
  { title: "Support",          href: "/support",         icon: "HelpCircle",       group: "account" },
  { title: "Settings",         href: "/settings",        icon: "Settings",         group: "account" },
];

// ── DESIGNER NAV ─────────────────────────────────────────────────────────────
export const designerNavItems: NavItem[] = [
  // Core
  { title: "Dashboard",          href: "/designer-dashboard",    icon: "LayoutDashboard",  group: "main" },
  { title: "Find Projects",      href: "/find-projects",         icon: "Search",           group: "main" },
  { title: "My Proposals",       href: "/proposals",             icon: "ClipboardList",    group: "main" },
  { title: "Active Projects",    href: "/active-projects",       icon: "FolderKanban",     group: "main" },
  { title: "Messages",           href: "/client-messages",       icon: "MessageSquare",    group: "main" },
  // Consultations
  { title: "Consultations",      href: "/designer-consultations", icon: "Calendar",        group: "consult" },
  { title: "Consultation Setup", href: "/consultation-settings",  icon: "Settings2",       group: "consult" },
  { title: "Availability",       href: "/availability",           icon: "CalendarCheck",   group: "consult" },
  { title: "Site Visits",        href: "/site-visits",            icon: "MapPin",          group: "consult" },
  // Portfolio & Gallery
  { title: "Portfolio",          href: "/portfolio",             icon: "Image",            group: "portfolio" },
  { title: "Inspiration Gallery", href: "/inspirations",         icon: "Sparkles",         group: "portfolio" },
  // Finance
  { title: "Earnings",           href: "/earnings",              icon: "DollarSign",       group: "finance" },
  { title: "Invoices",           href: "/designer-invoices",     icon: "Receipt",          group: "finance" },
  { title: "Subscription",       href: "/subscription",          icon: "Star",             group: "finance" },
  // Account
  { title: "Business Account",   href: "/business",              icon: "Building2",        group: "account" },
  { title: "Verification",       href: "/designer-verification", icon: "ShieldCheck",      group: "account" },
  { title: "Support",            href: "/designer-support",      icon: "HelpCircle",       group: "account" },
  { title: "Settings",           href: "/designer-settings",     icon: "Settings",         group: "account" },
];

// ── ARTISAN NAV ──────────────────────────────────────────────────────────────
export const artisanNavItems: NavItem[] = [
  { title: "Dashboard",      href: "/artisan-dashboard",   icon: "LayoutDashboard", group: "main" },
  { title: "My Services",    href: "/artisan-services",    icon: "Package",         group: "main" },
  { title: "Job Requests",   href: "/artisan-proposals",   icon: "Briefcase",       group: "main" },
  { title: "Active Jobs",    href: "/artisan-jobs",        icon: "FolderKanban",    group: "main" },
  { title: "Messages",       href: "/artisan-messages",    icon: "MessageSquare",   group: "main" },
  { title: "Verification",   href: "/artisan-verification",icon: "ShieldCheck",     group: "account" },
  { title: "Earnings",       href: "/artisan-earnings",    icon: "DollarSign",      group: "account" },
  { title: "Settings",       href: "/artisan-settings",    icon: "Settings",        group: "account" },
];

// ── VENDOR NAV ───────────────────────────────────────────────────────────────
export const vendorNavItems: NavItem[] = [
  { title: "Dashboard",      href: "/vendor-dashboard",    icon: "LayoutDashboard", group: "main" },
  { title: "My Products",    href: "/products",            icon: "Package",         group: "main" },
  { title: "RFQ Requests",    href: "/vendor-rfqs",         icon: "FileText",        group: "main" },
  { title: "Growth Center",   href: "/vendor-growth",       icon: "Rocket",          group: "main" },
  { title: "Inquiries",      href: "/vendor-inquiries",    icon: "Inbox",           group: "main" },
  { title: "Store Analytics",href: "/vendor-analytics",    icon: "BarChart3",       group: "main" },
  { title: "Subscription",   href: "/vendor-subscription", icon: "Star",            group: "account" },
  { title: "Verification",   href: "/vendor-verification", icon: "ShieldCheck",     group: "account" },
  { title: "Store Settings", href: "/store-settings",      icon: "Settings",        group: "account" },
];

// ── ADMIN NAV ────────────────────────────────────────────────────────────────
export const adminNavItems: NavItem[] = [
  // Overview
  { title: "Dashboard",           href: "/admin-dashboard",        icon: "LayoutDashboard",  group: "main" },
  { title: "Analytics",           href: "/analytics",              icon: "BarChart3",         group: "main" },
  // People
  { title: "Users",               href: "/users",                  icon: "Users",             group: "people" },
  { title: "Designer Approvals",  href: "/designer-approvals",     icon: "UserCheck",         group: "people" },
  { title: "Artisan Approvals",   href: "/artisan-approvals",      icon: "Hammer",            group: "people" },
  { title: "Business Approvals",  href: "/business-approvals",     icon: "Building2",         group: "people" },
  // Marketplace
  { title: "Vendor Approvals",    href: "/vendor-approvals",       icon: "Store",             group: "marketplace" },
  { title: "Product Moderation",  href: "/marketplace-moderation", icon: "ShieldCheck",       group: "marketplace" },
  // Content
  { title: "Gallery Moderation",  href: "/inspiration-moderation", icon: "Image",             group: "content" },
  { title: "Message Moderation",  href: "/moderation-queue",       icon: "MessageSquare",     group: "content" },
  // Operations
  { title: "Projects",            href: "/project-monitoring",     icon: "FolderKanban",      group: "ops" },
  { title: "Disputes",            href: "/admin-disputes",         icon: "AlertTriangle",     group: "ops" },
  { title: "Support Tickets",     href: "/admin-support",          icon: "HelpCircle",        group: "ops" },
  // Finance
  { title: "Financial",           href: "/financial",              icon: "DollarSign",        group: "finance" },
  { title: "Audit Log",           href: "/audit-log",              icon: "FileText",          group: "finance" },
];
