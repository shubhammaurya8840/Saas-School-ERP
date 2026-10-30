"use client";

import React from "react";
import {
  GraduationCap,
  Calendar,
  FileCheck,
  BookOpen,
  Award,
  Bell,
} from "lucide-react";
import { PanelLayout, NavItem } from "@/components/layout/panel-layout";

const navItems: NavItem[] = [
  {
    title: "Student Hub",
    href: "/student",
    icon: GraduationCap,
    badge: "Active",
  },
  {
    title: "Notice Board",
    href: "/student/notices",
    icon: Bell,
    badge: "Notices",
  },
  {
    title: "Class Timetable",
    href: "/student/timetable",
    icon: Calendar,
  },
  {
    title: "Homework & Tasks",
    href: "/student/homework",
    icon: FileCheck,
  },
  {
    title: "Exam Schedule",
    href: "/student/exams",
    icon: Award,
  },
  {
    title: "Digital Library",
    href: "/student/library",
    icon: BookOpen,
    badge: "Books",
  },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PanelLayout
      role="STUDENT"
      roleTitle="Student Learning Portal"
      roleSubtitle="Daily Timetable, Homework Submissions, Examination Dates & Library Passes"
      badgeText="Student"
      navItems={navItems}
    >
      {children}
    </PanelLayout>
  );
}
