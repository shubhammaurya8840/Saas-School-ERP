"use client";

import React from "react";
import {
  BookOpen,
  Bookmark,
  Repeat,
  Users,
  Search,
} from "lucide-react";
import { PanelLayout, NavItem } from "@/components/layout/panel-layout";

const navItems: NavItem[] = [
  {
    title: "Circulation Desk",
    href: "/library",
    icon: BookOpen,
    badge: "Live",
  },
  {
    title: "Book Repository",
    href: "/library/books",
    icon: Bookmark,
  },
  {
    title: "Issue & Return Log",
    href: "/library/circulation",
    icon: Repeat,
  },
  {
    title: "Library Members",
    href: "/library/members",
    icon: Users,
  },
];

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PanelLayout
      role="LIBRARIAN"
      roleTitle="Library & Circulation Management"
      roleSubtitle="Books Cataloging, Barcode Issue/Return, Overdue Tracking & Digital Passes"
      badgeText="Librarian"
      navItems={navItems}
    >
      {children}
    </PanelLayout>
  );
}
