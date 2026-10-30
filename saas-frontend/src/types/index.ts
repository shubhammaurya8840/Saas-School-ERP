export type SchoolStatus = "active" | "suspended" | "trial";
export type SubscriptionPlan = "starter" | "growth" | "enterprise";

export type ModuleKey =
  | "student_records"
  | "accounts_fees"
  | "teacher_portal"
  | "parent_portal"
  | "student_portal"
  | "attendance"
  | "examinations"
  | "timetable"
  | "notices"
  | "library"
  | "transport"
  | "payroll_hr"
  | "inventory"
  | "reports";

export interface ModuleDefinition {
  key: ModuleKey;
  name: string;
  description: string;
  category: "core" | "academic" | "operations" | "portals";
  isCore: boolean;
  requiredPlan?: SubscriptionPlan;
}

export interface SchoolAdminInfo {
  name: string;
  email: string;
  phone?: string;
  status: "active" | "pending_setup";
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: "active" | "trial" | "past_due";
  renewalDate: string;
  maxStudents: number;
  maxStaff: number;
  storageLimitMb: number;
}

export interface UploadSettings {
  allowStudentUploads: boolean;
  allowParentUploads: boolean;
  allowStaffUploads: boolean;
}

export interface SchoolMetrics {
  studentsCount: number;
  staffCount: number;
  storageUsedMb: number;
}

export interface School {
  id: string;
  schoolCode: string;
  name: string;
  legalName?: string;
  slug: string;
  logo?: string;
  board?: string;
  academicYear?: string;
  status: SchoolStatus;
  primaryAdmin: SchoolAdminInfo;
  subscription: SubscriptionInfo;
  modules: Record<ModuleKey, boolean>;
  uploadSettings: UploadSettings;
  metrics: SchoolMetrics;
  timezone: string;
  currency: string;
  city: string;
  state: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface SuperAdminMetrics {
  totalSchools: number;
  activeSchools: number;
  trialSchools: number;
  suspendedSchools: number;
  totalStudents: number;
  totalStaff: number;
  mrr: number;
  systemUptime: number;
  storageUsedGb: number;
  moduleAdoption: Array<{
    key: ModuleKey;
    name: string;
    count: number;
    percentage: number;
  }>;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "school_admin";
  avatar?: string;
}
