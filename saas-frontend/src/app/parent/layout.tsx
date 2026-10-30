"use client";

import React from "react";
import {
  Users,
  CreditCard,
  CalendarCheck,
  Award,
  Bell,
  BookOpen,
} from "lucide-react";
import { PanelLayout, NavItem } from "@/components/layout/panel-layout";

const navItems: NavItem[] = [
  {
    title: "Child Academic Hub",
    href: "/parent",
    icon: Users,
    badge: "Active",
  },
  {
    title: "School Circulars & Notices",
    href: "/parent/notices",
    icon: Bell,
    badge: "Notices",
  },
  {
    title: "Fee Payments & Receipts",
    href: "/parent/fees",
    icon: CreditCard,
  },
  {
    title: "Monthly Attendance",
    href: "/parent/attendance",
    icon: CalendarCheck,
  },
  {
    title: "Report Cards & Grades",
    href: "/parent/report-card",
    icon: Award,
  },
  {
    title: "Library Loans",
    href: "/parent/library",
    icon: BookOpen,
  },
];

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PanelLayout
      role="PARENT"
      roleTitle="Parent & Family Portal"
      roleSubtitle="Multi-Child Academic Progress, Fee Invoices, Attendance & Teacher Notices"
      badgeText="Parent"
      navItems={navItems}
    >
      {children}
    </PanelLayout>
  );
}
