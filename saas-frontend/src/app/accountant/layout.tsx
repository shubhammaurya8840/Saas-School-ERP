"use client";

import React from "react";
import {
  DollarSign,
  FileText,
  Receipt,
  CreditCard,
  PieChart,
} from "lucide-react";
import { PanelLayout, NavItem } from "@/components/layout/panel-layout";

const navItems: NavItem[] = [
  {
    title: "Fee Overview",
    href: "/accountant",
    icon: DollarSign,
    badge: "Active",
  },
  {
    title: "Students & Admissions",
    href: "/accountant/students",
    icon: Receipt,
    badge: "Students",
  },
  {
    title: "Fee Invoices & Challans",
    href: "/accountant/invoices",
    icon: FileText,
  },
  {
    title: "Payment Collections",
    href: "/accountant/collections",
    icon: Receipt,
  },
  {
    title: "Fee Categories",
    href: "/accountant/categories",
    icon: CreditCard,
  },
];

export default function AccountantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PanelLayout
      role="ACCOUNTANT"
      roleTitle="Accountant & Financial Ledger Console"
      roleSubtitle="Tuition Fee Schedules, Payment Receipts, Cash Book & Bank Reconciliation"
      badgeText="Accountant"
      navItems={navItems}
    >
      {children}
    </PanelLayout>
  );
}
