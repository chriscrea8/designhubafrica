export type UserRole = "client" | "designer" | "vendor" | "admin";

export interface NavItem {
  title: string;
  href: string;
  icon?: string;
  badge?: string | number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}
