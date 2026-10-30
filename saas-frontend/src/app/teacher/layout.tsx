"use client";

import React from "react";
import {
  Briefcase,
  UserCheck,
  Award,
  BookMarked,
  Clock,
  Bell,
} from "lucide-react";
import { PanelLayout, NavItem } from "@/components/layout/panel-layout";

const navItems: NavItem[] = [
  {
    title: "My Classes & Timetable",
    href: "/teacher",
    icon: Briefcase,
    badge: "Today",
  },
  {
    title: "Notices & Bulletins",
    href: "/teacher/notices",
    icon: Bell,
    badge: "Notices",
  },
  {
    title: "Attendance Roll Call",
    href: "/teacher/attendance",
    icon: UserCheck,
  },
  {
    title: "Gradebook & Assessments",
    href: "/teacher/gradebook",
    icon: Award,
  },
  {
    title: "Homework & Syllabus",
    href: "/teacher/assignments",
    icon: BookMarked,
  },
];

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PanelLayout
      role="TEACHER"
      roleTitle="Teacher Academic Portal"
      roleSubtitle="Period Schedules, Attendance Roll Call, Marks Entry & Homework Distribution"
      badgeText="Teacher"
      navItems={navItems}
    >
      {children}
    </PanelLayout>
  );
}
