"use client";

import React from "react";
import {
  Building2,
  Calendar,
  Users,
  Sliders,
  GraduationCap,
  FileCheck,
  Award,
  Bell,
  BookOpen,
  FileText,
} from "lucide-react";
import { PanelLayout, NavItem } from "@/components/layout/panel-layout";

const navItems: NavItem[] = [
  {
    title: "School Overview",
    href: "/school-admin",
    icon: Building2,
    badge: "Active",
  },
  {
    title: "Notices & Broadcasts",
    href: "/school-admin/notices",
    icon: Bell,
    badge: "Notice Board",
  },
  {
    title: "Staff & Teachers",
    href: "/school-admin/users",
    icon: Users,
    badge: "Staff",
  },
  {
    title: "Students & Admissions",
    href: "/school-admin/students",
    icon: GraduationCap,
    badge: "Students",
  },
  {
    title: "Academic Sessions",
    href: "/school-admin/academic-year",
    icon: Calendar,
  },
  {
    title: "Exams & Results",
    href: "/school-admin/exams",
    icon: Award,
    badge: "Exams",
  },
  {
    title: "Library Catalogue",
    href: "/library",
    icon: BookOpen,
    badge: "Library",
  },
  {
    title: "Institutional Reports",
    href: "/school-admin/reports",
    icon: FileText,
    badge: "Reports",
  },
  {
    title: "Module Entitlements",
    href: "/school-admin/modules",
    icon: Sliders,
  },
];

export default function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PanelLayout
      role="SCHOOL_ADMIN"
      roleTitle="School Administrator Workspace"
      roleSubtitle="Tenant Configuration, Academic Calendars, Quotas & Role Delegation"
      badgeText="School Admin"
      navItems={navItems}
    >
      {children}
    </PanelLayout>
  );
}
