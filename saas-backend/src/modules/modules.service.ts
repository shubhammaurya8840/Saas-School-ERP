import { Injectable } from "@nestjs/common";

export interface ModuleDefinition {
  key: string;
  name: string;
  description: string;
  category: "core" | "portals" | "academics" | "operations";
  defaultEnabled: boolean;
}

export const ERP_MODULE_REGISTRY: ModuleDefinition[] = [
  {
    key: "school_admin",
    name: "School Administration & Profile",
    description: "Manage school profile, departments, campus metadata, and academic sessions.",
    category: "core",
    defaultEnabled: true,
  },
  {
    key: "student_records",
    name: "Student Admission & Records",
    description: "Manage student enrollments, roll numbers, admission files, and parent linkages.",
    category: "core",
    defaultEnabled: true,
  },
  {
    key: "accounts_fees",
    name: "Accounts & Fees Management",
    description: "Fee structures, fee receipt generation, payment tracking, and ledger exports.",
    category: "operations",
    defaultEnabled: true,
  },
  {
    key: "teacher_portal",
    name: "Teacher & Staff Portal",
    description: "Class assignments, subject allocation, syllabus progress, and daily attendance.",
    category: "portals",
    defaultEnabled: true,
  },
  {
    key: "parent_portal",
    name: "Parent Portal & Child Linking",
    description: "Multi-child dashboard, fee receipts, published report cards, and notices.",
    category: "portals",
    defaultEnabled: true,
  },
  {
    key: "student_portal",
    name: "Student Portal (Class 5+)",
    description: "Academic reports, homework submissions, and personal timetable.",
    category: "portals",
    defaultEnabled: true,
  },
  {
    key: "attendance",
    name: "Daily & Period Attendance",
    description: "Student and staff attendance tracking with real-time absentee alerts.",
    category: "academics",
    defaultEnabled: true,
  },
  {
    key: "examinations",
    name: "Examinations, Marks & Report Cards",
    description: "Exam schedules, mark entry with audit trails, and automated report cards.",
    category: "academics",
    defaultEnabled: true,
  },
  {
    key: "timetable",
    name: "Timetable & Room Scheduling",
    description: "Period scheduling, classroom allocations, and faculty conflict checks.",
    category: "academics",
    defaultEnabled: true,
  },
  {
    key: "notices",
    name: "Noticeboard & Targeted Circulars",
    description: "Announcements targeted by role, class, or individual school department.",
    category: "core",
    defaultEnabled: true,
  },
  {
    key: "library",
    name: "Library Management",
    description: "Book catalogue, book issue, return, and overdue fine management.",
    category: "operations",
    defaultEnabled: true,
  },
  {
    key: "transport",
    name: "Transport & Bus Routes",
    description: "Bus routes, stops, vehicle tracking, and driver contact directory.",
    category: "operations",
    defaultEnabled: false,
  },
  {
    key: "payroll_hr",
    name: "Payroll & HR",
    description: "Staff salary structures, allowances, deductions, and pay slip exports.",
    category: "operations",
    defaultEnabled: false,
  },
  {
    key: "reports",
    name: "Reports & Analytics Exports",
    description: "Comprehensive financial, academic, and attendance data export suites.",
    category: "operations",
    defaultEnabled: true,
  },
];

@Injectable()
export class ModulesService {
  getAvailableModules(): ModuleDefinition[] {
    return ERP_MODULE_REGISTRY;
  }
}
