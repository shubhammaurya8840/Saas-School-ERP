/**
 * Unified ERP Modules Registry & Entitlement Descriptors
 * Phase 2 Canonical Architecture
 */

export interface ERPModuleMeta {
  key: string;
  name: string;
  description: string;
  category: "CORE" | "ACADEMICS" | "OPERATIONS" | "PORTALS";
  defaultEnabled: boolean;
  requiredPlan: "STARTER" | "GROWTH" | "ENTERPRISE";
}

export const ERP_MODULES: ERPModuleMeta[] = [
  {
    key: "STUDENT_INFORMATION",
    name: "Student Information System",
    description: "Core student demographics, admission records, and digital cumulative dossiers.",
    category: "CORE",
    defaultEnabled: true,
    requiredPlan: "STARTER",
  },
  {
    key: "ADMISSIONS_ENROLLMENT",
    name: "Admissions & Enrollment",
    description: "Online application pipeline, inquiry management, and enrollment confirmation.",
    category: "OPERATIONS",
    defaultEnabled: true,
    requiredPlan: "STARTER",
  },
  {
    key: "ACADEMIC_CURRICULUM",
    name: "Academic Curriculum & Classes",
    description: "Classes, sections, syllabus mapping, subject teachers, and department heads.",
    category: "ACADEMICS",
    defaultEnabled: true,
    requiredPlan: "STARTER",
  },
  {
    key: "ATTENDANCE_TRACKING",
    name: "Attendance Tracking",
    description: "Period-wise roll call, daily absence SMS alerts, and staff biometric logging.",
    category: "CORE",
    defaultEnabled: true,
    requiredPlan: "STARTER",
  },
  {
    key: "EXAMINATIONS_GRADING",
    name: "Examinations & Grading",
    description: "Exam schedules, hall tickets, GPA rubrics, automated report card generation.",
    category: "ACADEMICS",
    defaultEnabled: true,
    requiredPlan: "STARTER",
  },
  {
    key: "FEE_MANAGEMENT",
    name: "Fee Management & Invoicing",
    description: "Tuition structures, fee challan generation, online payment gateways, and dues ledger.",
    category: "CORE",
    defaultEnabled: true,
    requiredPlan: "STARTER",
  },
  {
    key: "EXPENSE_FINANCE",
    name: "Expense & Finance Accounting",
    description: "Vouchers, vendor payables, petty cash, and audited balance sheets.",
    category: "OPERATIONS",
    defaultEnabled: false,
    requiredPlan: "GROWTH",
  },
  {
    key: "TIMETABLE_SCHEDULING",
    name: "Timetable & Scheduling",
    description: "Automated routine generator, faculty clash prevention, room allocation.",
    category: "ACADEMICS",
    defaultEnabled: true,
    requiredPlan: "GROWTH",
  },
  {
    key: "LIBRARY_MANAGEMENT",
    name: "Library Management",
    description: "ISBN cataloging, student barcode passes, book issue/return circulation desk.",
    category: "OPERATIONS",
    defaultEnabled: true,
    requiredPlan: "GROWTH",
  },
  {
    key: "TRANSPORT_FLEET",
    name: "Transport & Fleet Management",
    description: "Bus routes, vehicle telemetry, stops, drivers, and transport fee allocation.",
    category: "OPERATIONS",
    defaultEnabled: false,
    requiredPlan: "ENTERPRISE",
  },
  {
    key: "HOSTEL_RESIDENCE",
    name: "Hostel & Residence",
    description: "Room inventory, student bed allocation, warden registers, and boarding fees.",
    category: "OPERATIONS",
    defaultEnabled: false,
    requiredPlan: "ENTERPRISE",
  },
  {
    key: "HR_PAYROLL",
    name: "HR & Staff Payroll",
    description: "Staff leaves, salary slips, deductions, provident fund, and appointment letters.",
    category: "OPERATIONS",
    defaultEnabled: false,
    requiredPlan: "ENTERPRISE",
  },
  {
    key: "COMMUNICATION_NOTICES",
    name: "Communication & Notice Circulars",
    description: "Urgent announcements, emergency circulars, multi-channel push notifications.",
    category: "CORE",
    defaultEnabled: true,
    requiredPlan: "STARTER",
  },
  {
    key: "PORTALS_SELF_SERVICE",
    name: "Self-Service Portals",
    description: "Dedicated workspaces for Teachers, Parents, Students, Accountants, and Librarians.",
    category: "PORTALS",
    defaultEnabled: true,
    requiredPlan: "STARTER",
  },
];
