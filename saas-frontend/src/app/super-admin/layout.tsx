"use client";

import React from "react";
import {
  LayoutDashboard,
  Building2,
  PlusCircle,
  ShieldCheck,
  Server,
  FileText,
} from "lucide-react";
import { PanelLayout, NavItem } from "@/components/layout/panel-layout";

const navItems: NavItem[] = [
  {
    title: "Platform Overview",
    href: "/super-admin",
    icon: LayoutDashboard,
    badge: "Live",
  },
  {
    title: "School Tenants",
    href: "/schools",
    icon: Building2,
  },
  {
    title: "Register New School",
    href: "/schools/register",
    icon: PlusCircle,
    highlight: true,
  },
];

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PanelLayout
      role="SUPER_ADMIN"
      roleTitle="Super Admin Console"
      roleSubtitle="SaaS Infrastructure, Multi-Tenant Provisioning & Aggregate Telemetry"
      badgeText="Super Admin"
      navItems={navItems}
    >
      {children}
    </PanelLayout>
  );
}
