/**
 * Unified API Client for School ERP SaaS Platform
 * Phase 2 Canonical API Layer
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

export interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  role:
    | "SUPER_ADMIN"
    | "SCHOOL_ADMIN"
    | "ACCOUNTANT"
    | "TEACHER"
    | "PARENT"
    | "STUDENT"
    | "LIBRARIAN";
  designation?: string | null;
  department?: string | null;
  employeeId?: string | null;
  schoolId?: string | null;
  canManageNotices?: boolean;
  parentLinks?: Array<{
    id: string;
    relationship: string;
    isPrimary: boolean;
    student: {
      id: string;
      admissionNumber: string;
      fullName: string;
      gradeLevel: string;
      section?: string | null;
      rollNumber?: string | null;
      status: string;
      hasStudentPortalAccess: boolean;
    };
  }> | null;
  studentProfile?: {
    id: string;
    admissionNumber: string;
    fullName: string;
    gradeLevel: string;
    section?: string | null;
    rollNumber?: string | null;
    status: string;
    hasStudentPortalAccess: boolean;
  } | null;
  school?: {
    id: string;
    schoolCode: string;
    name: string;
    slug: string;
    status: string;
    plan: string;
    board?: string;
  } | null;
}

export interface AuthSession {
  user: ApiUser;
  accessToken: string;
}

export class ApiError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

class ApiService {
  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("saas_token");
  }

  setSession(session: AuthSession) {
    if (typeof window === "undefined") return;
    localStorage.setItem("saas_token", session.accessToken);
    localStorage.setItem("saas_session", JSON.stringify(session.user));
  }

  getSession(): ApiUser | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem("saas_session");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  clearSession() {
    if (typeof window === "undefined") return;
    localStorage.removeItem("saas_token");
    localStorage.removeItem("saas_session");
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let responseData: any;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        const message =
          (Array.isArray(responseData?.message)
            ? responseData.message.join(", ")
            : responseData?.message) ||
          responseData?.error ||
          `Request failed with status ${response.status}`;
        throw new ApiError(message, response.status, responseData);
      }

      return responseData as T;
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(
        err.message || "Network error. Please check your connection.",
        0,
        err
      );
    }
  }

  // --- AUTH MODULE ---
  auth = {
    login: async (credentials: { email: string; password: string }): Promise<AuthSession> => {
      const res = await this.request<AuthSession>("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      this.setSession(res);
      return res;
    },

    getProfile: async (): Promise<ApiUser> => {
      const res = await this.request<ApiUser>("/auth/me");
      if (typeof window !== "undefined") {
        localStorage.setItem("saas_session", JSON.stringify(res));
      }
      return res;
    },

    verifyInvitation: async (token: string) => {
      return this.request<{
        valid: boolean;
        email: string;
        fullName: string;
        designation?: string;
        school?: any;
      }>(`/auth/invitation/${encodeURIComponent(token)}`);
    },

    redeemInvitation: async (payload: { token: string; password: string }) => {
      return this.request<{ success: boolean; message: string; email: string }>(
        "/auth/invitation/redeem",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },

    logout: () => {
      this.clearSession();
    },
  };

  // --- SCHOOLS MODULE ---
  schools = {
    list: async (params?: {
      search?: string;
      status?: string;
      plan?: string;
      limit?: number;
      offset?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      if (params?.status && params.status !== "all") query.append("status", params.status);
      if (params?.plan && params.plan !== "all") query.append("plan", params.plan);
      if (params?.limit) query.append("limit", params.limit.toString());
      if (params?.offset) query.append("offset", params.offset.toString());

      const qs = query.toString() ? `?${query.toString()}` : "";
      return this.request<{
        total: number;
        counts: {
          all: number;
          active: number;
          trial: number;
          suspended: number;
        };
        schools: any[];
      }>(`/schools${qs}`);
    },

    get: async (id: string) => {
      return this.request<any>(`/schools/${encodeURIComponent(id)}`);
    },

    register: async (payload: {
      name: string;
      legalName?: string;
      slug: string;
      board?: string;
      academicYear?: string;
      email: string;
      phone: string;
      address?: string;
      city: string;
      state: string;
      postalCode?: string;
      country?: string;
      timezone?: string;
      currency?: string;
      plan?: string;
      maxStudents?: number;
      maxStaff?: number;
      storageLimitMb?: number;
      adminName: string;
      adminEmail: string;
      adminPhone?: string;
      adminDesignation?: string;
      modules?: Record<string, boolean>;
      uploadSettings?: {
        allowStudentUploads?: boolean;
        allowParentUploads?: boolean;
        allowStaffUploads?: boolean;
      };
    }) => {
      return this.request<{
        school: {
          id: string;
          schoolCode: string;
          name: string;
          slug: string;
          city: string;
          state: string;
          plan: string;
          status: string;
        };
        admin: {
          id: string;
          fullName: string;
          email: string;
          designation?: string;
        };
        invitation: {
          token: string;
          expiresAt: string;
          invitationUrl: string;
        };
      }>("/schools", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    updateModules: async (id: string, modules: Record<string, boolean>) => {
      return this.request<{ success: boolean; updatedCount: number }>(
        `/schools/${encodeURIComponent(id)}/modules`,
        {
          method: "PATCH",
          body: JSON.stringify({ modules }),
        }
      );
    },

    updateStatus: async (id: string, status: string, reason?: string) => {
      return this.request<{ success: boolean; status: string }>(
        `/schools/${encodeURIComponent(id)}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({ status, reason }),
        }
      );
    },
  };

  // --- USERS MODULE (Phase 3: Staff & User Management) ---
  users = {
    list: async (params?: {
      role?: string;
      search?: string;
      department?: string;
      limit?: number;
      offset?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.role && params.role !== "all") query.append("role", params.role);
      if (params?.search) query.append("search", params.search);
      if (params?.department && params.department !== "all") query.append("department", params.department);
      if (params?.limit) query.append("limit", params.limit.toString());
      if (params?.offset) query.append("offset", params.offset.toString());

      const qs = query.toString() ? `?${query.toString()}` : "";
      return this.request<{ total: number; users: any[] }>(`/users${qs}`);
    },

    get: async (id: string) => {
      return this.request<any>(`/users/${encodeURIComponent(id)}`);
    },

    create: async (payload: {
      fullName: string;
      email: string;
      role: string;
      phone?: string;
      designation?: string;
      department?: string;
      employeeId?: string;
      password?: string;
    }) => {
      return this.request<{
        user: any;
        invitation?: {
          token: string;
          expiresAt?: string;
          invitationUrl?: string;
        };
      }>("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    update: async (
      id: string,
      payload: {
        fullName?: string;
        phone?: string;
        designation?: string;
        department?: string;
        isActive?: boolean;
      }
    ) => {
      return this.request<any>(`/users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    delete: async (id: string) => {
      return this.request<{ success: boolean; message: string }>(
        `/users/${encodeURIComponent(id)}`,
        { method: "DELETE" }
      );
    },
  };

  // --- STUDENTS MODULE (Phase 3: Student Management & Parent Linkage) ---
  students = {
    list: async (params?: {
      gradeLevel?: string;
      section?: string;
      search?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.gradeLevel && params.gradeLevel !== "all") query.append("gradeLevel", params.gradeLevel);
      if (params?.section && params.section !== "all") query.append("section", params.section);
      if (params?.search) query.append("search", params.search);
      if (params?.status && params.status !== "all") query.append("status", params.status);
      if (params?.limit) query.append("limit", params.limit.toString());
      if (params?.offset) query.append("offset", params.offset.toString());

      const qs = query.toString() ? `?${query.toString()}` : "";
      return this.request<{ total: number; students: any[] }>(`/students${qs}`);
    },

    get: async (id: string) => {
      return this.request<any>(`/students/${encodeURIComponent(id)}`);
    },

    create: async (payload: {
      fullName: string;
      gradeLevel: string;
      section?: string;
      rollNumber?: string;
      academicYear?: string;
      dateOfBirth?: string;
      gender?: string;
      address?: string;
      admissionNumber?: string;
      parentName: string;
      parentEmail: string;
      parentPhone?: string;
      parentRelationship?: string;
      enableStudentPortalLogin?: boolean;
      studentEmail?: string;
      studentPassword?: string;
    }) => {
      return this.request<{
        student: any;
        parent: any;
        portalAccess: {
          parentPortal: boolean;
          studentPortal: boolean;
          studentEmail?: string | null;
        };
        parentInvitationUrl?: string;
      }>("/students", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    update: async (id: string, payload: any) => {
      return this.request<any>(`/students/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    getParents: async (params?: { search?: string }) => {
      const query = new URLSearchParams();
      if (params?.search) query.append("search", params.search);
      const qs = query.toString() ? `?${query.toString()}` : "";
      return this.request<any[]>(`/students/parents${qs}`);
    },
  };

  // --- FEES MODULE (Phase 4: Manual Fee Management) ---
  fees = {
    heads: {
      list: async () => {
        return this.request<any[]>("/fees/heads");
      },
      create: async (payload: {
        name: string;
        code: string;
        description?: string;
        isRecurring?: boolean;
      }) => {
        return this.request<any>("/fees/heads", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      },
      delete: async (id: string) => {
        return this.request<{ success: boolean; message: string }>(
          `/fees/heads/${encodeURIComponent(id)}`,
          { method: "DELETE" }
        );
      },
    },

    plans: {
      list: async (params?: { academicYear?: string; grade?: string }) => {
        const query = new URLSearchParams();
        if (params?.academicYear) query.append("academicYear", params.academicYear);
        if (params?.grade && params.grade !== "all") query.append("grade", params.grade);
        const qs = query.toString() ? `?${query.toString()}` : "";
        return this.request<any[]>(`/fees/plans${qs}`);
      },
      get: async (id: string) => {
        return this.request<any>(`/fees/plans/${encodeURIComponent(id)}`);
      },
      create: async (payload: {
        name: string;
        academicYear: string;
        applicableGrade?: string;
        description?: string;
        items: Array<{ feeHeadId: string; amount: number }>;
        installments?: Array<{
          title: string;
          dueDate: string;
          percentage?: number;
          amount: number;
          lateFeeFine?: number;
        }>;
      }) => {
        return this.request<any>("/fees/plans", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      },
    },

    assign: async (payload: {
      studentId: string;
      feePlanId: string;
      academicYear?: string;
      concessionType?: string;
      concessionAmount?: number;
    }) => {
      return this.request<any>("/fees/assign", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    payments: {
      list: async (params?: {
        search?: string;
        paymentMethod?: string;
        status?: string;
        limit?: number;
        offset?: number;
      }) => {
        const query = new URLSearchParams();
        if (params?.search) query.append("search", params.search);
        if (params?.paymentMethod && params.paymentMethod !== "all")
          query.append("paymentMethod", params.paymentMethod);
        if (params?.status && params.status !== "all")
          query.append("status", params.status);
        if (params?.limit) query.append("limit", params.limit.toString());
        if (params?.offset) query.append("offset", params.offset.toString());
        const qs = query.toString() ? `?${query.toString()}` : "";
        return this.request<{ total: number; payments: any[] }>(`/fees/payments${qs}`);
      },
      record: async (payload: {
        studentFeePlanId: string;
        amount: number;
        paymentMethod: string;
        transactionReference?: string;
        paymentDate?: string;
        remarks?: string;
        idempotencyKey?: string;
      }) => {
        return this.request<{
          duplicatePrevented?: boolean;
          payment: any;
          receiptNumber: string;
          updatedPlan: any;
          student?: any;
        }>("/fees/payments", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      },
      refund: async (id: string, payload: { refundReason: string; refundAmount?: number }) => {
        return this.request<any>(`/fees/payments/${encodeURIComponent(id)}/refund`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      },
    },

    getReceipt: async (identifier: string) => {
      return this.request<any>(`/fees/receipts/${encodeURIComponent(identifier)}`);
    },

    getStudentLedger: async (studentId: string) => {
      return this.request<{ student: any; feePlans: any[] }>(
        `/fees/students/${encodeURIComponent(studentId)}/ledger`
      );
    },

    getParentChildren: async () => {
      return this.request<any[]>("/fees/parent/children");
    },

    getSummary: async () => {
      return this.request<{
        totalPlansAssigned: number;
        totalGrossBilled: number;
        totalConcessionsGranted: number;
        totalNetBilled: number;
        totalCollected: number;
        totalOutstandingDues: number;
        methodBreakdown: Record<string, number>;
        statusCounts: Record<string, number>;
      }>("/fees/summary");
    },

    getDues: async (params?: {
      gradeLevel?: string;
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }) => {
      const query = new URLSearchParams();
      if (params?.gradeLevel && params.gradeLevel !== "all")
        query.append("gradeLevel", params.gradeLevel);
      if (params?.status && params.status !== "all") query.append("status", params.status);
      if (params?.search) query.append("search", params.search);
      if (params?.limit) query.append("limit", params.limit.toString());
      if (params?.offset) query.append("offset", params.offset.toString());
      const qs = query.toString() ? `?${query.toString()}` : "";
      return this.request<{ total: number; records: any[] }>(`/fees/dues${qs}`);
    },

    getSuperAdminAggregate: async () => {
      return this.request<any>("/fees/super-admin/aggregate");
    },
  };

  // --- TIMETABLE MODULE (Phase 5: Class Sections, Subjects & Timetables) ---
  timetable = {
    classSections: {
      list: async (params?: { academicYear?: string; className?: string }) => {
        const query = new URLSearchParams();
        if (params?.academicYear) query.append("academicYear", params.academicYear);
        if (params?.className && params.className !== "all")
          query.append("className", params.className);
        const qs = query.toString() ? `?${query.toString()}` : "";
        return this.request<any[]>(`/timetable/class-sections${qs}`);
      },
      get: async (id: string) => {
        return this.request<any>(`/timetable/class-sections/${encodeURIComponent(id)}`);
      },
      create: async (payload: {
        className: string;
        section: string;
        room?: string;
        academicYear: string;
        classTeacherId?: string;
      }) => {
        return this.request<any>("/timetable/class-sections", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      },
      delete: async (id: string) => {
        return this.request<{ success: boolean; message: string }>(
          `/timetable/class-sections/${encodeURIComponent(id)}`,
          { method: "DELETE" }
        );
      },
    },

    subjects: {
      list: async (params?: { grade?: string }) => {
        const query = new URLSearchParams();
        if (params?.grade && params.grade !== "all") query.append("grade", params.grade);
        const qs = query.toString() ? `?${query.toString()}` : "";
        return this.request<any[]>(`/timetable/subjects${qs}`);
      },
      create: async (payload: {
        name: string;
        code: string;
        applicableGrade?: string;
        description?: string;
      }) => {
        return this.request<any>("/timetable/subjects", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      },
      delete: async (id: string) => {
        return this.request<{ success: boolean; message: string }>(
          `/timetable/subjects/${encodeURIComponent(id)}`,
          { method: "DELETE" }
        );
      },
    },

    slots: {
      save: async (payload: {
        classSectionId: string;
        dayOfWeek: string;
        periodNumber: number;
        startTime: string;
        endTime: string;
        room?: string;
        subjectId: string;
        teacherId?: string;
      }) => {
        return this.request<any>("/timetable/slots", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      },
      bulkSave: async (slots: any[]) => {
        return this.request<any>("/timetable/slots/bulk", {
          method: "POST",
          body: JSON.stringify({ slots }),
        });
      },
      delete: async (id: string) => {
        return this.request<{ success: boolean; message: string }>(
          `/timetable/slots/${encodeURIComponent(id)}`,
          { method: "DELETE" }
        );
      },
    },

    getClassTimetable: async (classSectionId: string) => {
      return this.request<any>(`/timetable/classes/${encodeURIComponent(classSectionId)}`);
    },

    getTeacherMySchedule: async () => {
      return this.request<any>("/timetable/teachers/my-schedule");
    },

    getTeacherSchedule: async (teacherId: string) => {
      return this.request<any>(`/timetable/teachers/${encodeURIComponent(teacherId)}`);
    },

    getStudentTimetable: async (studentId: string) => {
      return this.request<any>(`/timetable/students/${encodeURIComponent(studentId)}`);
    },
  };

  // --- ATTENDANCE MODULE (Phase 5: Daily Roll Call, Register & Holidays) ---
  attendance = {
    markStudents: async (payload: {
      date: string;
      classSectionId?: string;
      records: Array<{ studentId: string; status: string; remarks?: string }>;
    }) => {
      return this.request<{
        date: string;
        totalRecorded: number;
        presentCount: number;
        absentCount: number;
        records: any[];
      }>("/attendance/students", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    getClassDaily: async (classSectionId: string, date?: string) => {
      const query = new URLSearchParams();
      if (date) query.append("date", date);
      const qs = query.toString() ? `?${query.toString()}` : "";
      return this.request<{
        classSection: any;
        date: string;
        isMarkedToday: boolean;
        totalStudents: number;
        presentCount: number;
        absentCount: number;
        roster: Array<{
          studentId: string;
          fullName: string;
          admissionNumber: string;
          rollNumber: string;
          gender?: string;
          status: string;
          remarks?: string;
          isAlreadyMarked: boolean;
        }>;
      }>(`/attendance/students/class/${encodeURIComponent(classSectionId)}${qs}`);
    },

    getStudentMonthly: async (studentId: string, month?: number, year?: number) => {
      const query = new URLSearchParams();
      if (month) query.append("month", month.toString());
      if (year) query.append("year", year.toString());
      const qs = query.toString() ? `?${query.toString()}` : "";
      return this.request<{
        student: any;
        month: number;
        year: number;
        summary: {
          totalDaysRecorded: number;
          effectivePresent: number;
          presentDays: number;
          absentDays: number;
          lateDays: number;
          halfDays: number;
          leaveDays: number;
          attendancePercentage: number;
        };
        attendances: any[];
        holidays: any[];
      }>(`/attendance/students/${encodeURIComponent(studentId)}/monthly${qs}`);
    },

    getParentChildren: async () => {
      return this.request<
        Array<{
          studentId: string;
          fullName: string;
          admissionNumber: string;
          gradeLevel: string;
          section?: string;
          schoolName: string;
          currentMonth: number;
          currentYear: number;
          stats: {
            totalDaysRecorded: number;
            effectivePresent: number;
            presentDays: number;
            absentDays: number;
            lateDays: number;
            halfDays: number;
            leaveDays: number;
            attendancePercentage: number;
          };
        }>
      >("/attendance/parent/children");
    },

    staff: {
      mark: async (payload: {
        userId: string;
        date: string;
        status: string;
        checkIn?: string;
        checkOut?: string;
        remarks?: string;
      }) => {
        return this.request<any>("/attendance/staff", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      },

      getDaily: async (date?: string) => {
        const query = new URLSearchParams();
        if (date) query.append("date", date);
        const qs = query.toString() ? `?${query.toString()}` : "";
        return this.request<{
          date: string;
          totalStaff: number;
          roster: any[];
        }>(`/attendance/staff${qs}`);
      },
    },

    holidays: {
      list: async (academicYear?: string) => {
        const query = new URLSearchParams();
        if (academicYear) query.append("academicYear", academicYear);
        const qs = query.toString() ? `?${query.toString()}` : "";
        return this.request<any[]>(`/attendance/holidays${qs}`);
      },

      create: async (payload: {
        title: string;
        startDate: string;
        endDate: string;
        description?: string;
        academicYear?: string;
      }) => {
        return this.request<any>("/attendance/holidays", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      },

      delete: async (id: string) => {
        return this.request<{ success: boolean; message: string }>(
          `/attendance/holidays/${encodeURIComponent(id)}`,
          { method: "DELETE" }
        );
      },
    },
  };

  // --- EXAMS, MARKS & REPORT CARDS MODULE (Phase 6) ---
  exams = {
    list: async (params?: {
      academicYear?: string;
      classSectionId?: string;
      status?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.academicYear) query.append("academicYear", params.academicYear);
      if (params?.classSectionId)
        query.append("classSectionId", params.classSectionId);
      if (params?.status) query.append("status", params.status);
      const qs = query.toString() ? `?${query.toString()}` : "";
      return this.request<any[]>(`/exams${qs}`);
    },

    getById: async (id: string) => {
      return this.request<any>(`/exams/${encodeURIComponent(id)}`);
    },

    create: async (payload: {
      name: string;
      academicYear: string;
      term?: string;
      classSectionId: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      papers?: Array<{
        subjectId: string;
        examDate: string;
        startTime?: string;
        endTime?: string;
        maxMarks?: number;
        passingMarks?: number;
        room?: string;
      }>;
      subjectId?: string;
      examDate?: string;
      startTime?: string;
      endTime?: string;
      maxMarks?: number;
      passingMarks?: number;
      room?: string;
    }) => {
      return this.request<any>("/exams", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    addPaper: async (
      examId: string,
      payload: {
        subjectId: string;
        examDate: string;
        startTime?: string;
        endTime?: string;
        maxMarks?: number;
        passingMarks?: number;
        room?: string;
      }
    ) => {
      return this.request<any>(`/exams/${encodeURIComponent(examId)}/papers`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    enterMarks: async (
      examId: string,
      payload: {
        examPaperId?: string;
        subjectId?: string;
        marks: Array<{
          studentId: string;
          marksObtained: number;
          remarks?: string;
        }>;
      }
    ) => {
      return this.request<any>(`/exams/${encodeURIComponent(examId)}/marks`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    updateStatus: async (
      examId: string,
      status: "DRAFT" | "REVIEWED" | "PUBLISHED"
    ) => {
      return this.request<any>(`/exams/${encodeURIComponent(examId)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },

    getMarksSheet: async (examId: string, paperId?: string) => {
      const query = new URLSearchParams();
      if (paperId) query.append("paperId", paperId);
      const qs = query.toString() ? `?${query.toString()}` : "";
      return this.request<{
        exam: any;
        students: any[];
        marks: any[];
      }>(`/exams/${encodeURIComponent(examId)}/marks-sheet${qs}`);
    },

    getReportCard: async (examId: string, studentId: string) => {
      return this.request<any>(
        `/exams/${encodeURIComponent(examId)}/report-card/${encodeURIComponent(studentId)}`
      );
    },

    getParentChildrenReportCards: async () => {
      return this.request<any[]>("/exams/parent/children-report-cards");
    },

    getGradingRules: async (academicYear?: string) => {
      const query = new URLSearchParams();
      if (academicYear) query.append("academicYear", academicYear);
      const qs = query.toString() ? `?${query.toString()}` : "";
      return this.request<any[]>(`/exams/grading-rules${qs}`);
    },

    createGradingRule: async (payload: {
      name: string;
      minPercentage: number;
      maxPercentage: number;
      grade: string;
      gradePoint?: number;
      description?: string;
      isPassing?: boolean;
      academicYear?: string;
    }) => {
      return this.request<any>("/exams/grading-rules", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
  };

  // --- NOTICES & NOTIFICATIONS MODULE (PHASE 7) ---
  notices = {
    list: async (params?: {
      status?: string;
      priority?: string;
      targetAudience?: string;
      search?: string;
    }) => {
      const query = new URLSearchParams();
      if (params?.status) query.append("status", params.status);
      if (params?.priority) query.append("priority", params.priority);
      if (params?.targetAudience) query.append("targetAudience", params.targetAudience);
      if (params?.search) query.append("search", params.search);
      const qs = query.toString() ? `?${query.toString()}` : "";
      return this.request<any[]>(`/notices${qs}`);
    },

    getById: async (id: string) => {
      return this.request<any>(`/notices/${encodeURIComponent(id)}`);
    },

    create: async (payload: {
      title: string;
      message: string;
      priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
      status?: "DRAFT" | "PUBLISHED" | "EXPIRED";
      targetAudience?:
        | "ALL"
        | "STAFF_ONLY"
        | "TEACHERS"
        | "PARENTS"
        | "STUDENTS"
        | "CLASS_SECTION";
      targetRoles?: string[];
      classSectionId?: string;
      targetGrade?: string;
      publishDate?: string;
      expiryDate?: string;
      attachments?: any[];
    }) => {
      return this.request<any>("/notices", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    update: async (
      id: string,
      payload: {
        title?: string;
        message?: string;
        priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
        targetAudience?:
          | "ALL"
          | "STAFF_ONLY"
          | "TEACHERS"
          | "PARENTS"
          | "STUDENTS"
          | "CLASS_SECTION";
        targetRoles?: string[];
        classSectionId?: string | null;
        targetGrade?: string | null;
        publishDate?: string;
        expiryDate?: string | null;
        attachments?: any[];
      }
    ) => {
      return this.request<any>(`/notices/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    publish: async (id: string) => {
      return this.request<any>(`/notices/${encodeURIComponent(id)}/publish`, {
        method: "POST",
      });
    },

    markAsRead: async (id: string) => {
      return this.request<{ isRead: boolean; readAt: string }>(
        `/notices/${encodeURIComponent(id)}/read`,
        {
          method: "POST",
        }
      );
    },

    getUnreadCount: async () => {
      return this.request<{ unreadCount: number }>("/notices/unread-count");
    },

    delete: async (id: string) => {
      return this.request<{ success: boolean; message: string }>(
        `/notices/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );
    },

    listStaffPermissions: async () => {
      return this.request<any[]>("/notices/staff/permissions");
    },

    setStaffPermission: async (userId: string, canManageNotices: boolean) => {
      return this.request<any>(
        `/notices/staff/${encodeURIComponent(userId)}/permission`,
        {
          method: "PATCH",
          body: JSON.stringify({ canManageNotices }),
        }
      );
    },
  };

  // --- LIBRARY MODULE ---
  library = {
    getStats: async () => {
      return this.request<{
        totalTitles: number;
        totalCopies: number;
        availableCopies: number;
        issuedCopies: number;
        overdueCount: number;
        activeLoansCount: number;
      }>("/library/stats");
    },

    getSettings: async () => {
      return this.request<{
        id: string;
        schoolId: string;
        maxBooksPerStudent: number;
        maxBooksPerStaff: number;
        loanPeriodDays: number;
        renewalLimit: number;
        finePerDay: number;
        isFineEnabled: boolean;
      }>("/library/settings");
    },

    updateSettings: async (payload: {
      maxBooksPerStudent?: number;
      maxBooksPerStaff?: number;
      loanPeriodDays?: number;
      renewalLimit?: number;
      finePerDay?: number;
      isFineEnabled?: boolean;
    }) => {
      return this.request<any>("/library/settings", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    getBooks: async (params?: {
      search?: string;
      category?: string;
      page?: number;
      limit?: number;
    }) => {
      const q = new URLSearchParams();
      if (params?.search) q.append("search", params.search);
      if (params?.category) q.append("category", params.category);
      if (params?.page) q.append("page", params.page.toString());
      if (params?.limit) q.append("limit", params.limit.toString());
      const queryStr = q.toString() ? `?${q.toString()}` : "";
      return this.request<{
        books: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/library/books${queryStr}`);
    },

    getBookById: async (id: string) => {
      return this.request<any>(`/library/books/${encodeURIComponent(id)}`);
    },

    createBook: async (payload: {
      isbn?: string;
      title: string;
      author: string;
      category: string;
      publisher?: string;
      edition?: string;
      description?: string;
      locationRack?: string;
      initialCopies?: number;
    }) => {
      return this.request<any>("/library/books", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    updateBook: async (
      id: string,
      payload: {
        isbn?: string;
        title?: string;
        author?: string;
        category?: string;
        publisher?: string;
        edition?: string;
        description?: string;
        locationRack?: string;
      }
    ) => {
      return this.request<any>(`/library/books/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },

    deleteBook: async (id: string) => {
      return this.request<{ success: boolean; message: string }>(
        `/library/books/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );
    },

    issueBook: async (payload: {
      bookCopyId?: string;
      bookId?: string;
      borrowerType: "STUDENT" | "STAFF";
      studentId?: string;
      staffUserId?: string;
      dueDate?: string;
      remarks?: string;
    }) => {
      return this.request<any>("/library/issues", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },

    returnBook: async (id: string, payload?: { conditionNote?: string }) => {
      return this.request<any>(
        `/library/issues/${encodeURIComponent(id)}/return`,
        {
          method: "POST",
          body: JSON.stringify(payload || {}),
        }
      );
    },

    renewBook: async (id: string, payload?: { newDueDate?: string }) => {
      return this.request<any>(
        `/library/issues/${encodeURIComponent(id)}/renew`,
        {
          method: "POST",
          body: JSON.stringify(payload || {}),
        }
      );
    },

    adjustFineToFee: async (
      id: string,
      payload: { studentFeePlanId: string; remarks?: string }
    ) => {
      return this.request<any>(
        `/library/issues/${encodeURIComponent(id)}/adjust-to-fee`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
    },

    getIssues: async (params?: {
      status?: string;
      studentId?: string;
      staffUserId?: string;
      page?: number;
      limit?: number;
    }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append("status", params.status);
      if (params?.studentId) q.append("studentId", params.studentId);
      if (params?.staffUserId) q.append("staffUserId", params.staffUserId);
      if (params?.page) q.append("page", params.page.toString());
      if (params?.limit) q.append("limit", params.limit.toString());
      const queryStr = q.toString() ? `?${q.toString()}` : "";
      return this.request<{
        issues: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`/library/issues${queryStr}`);
    },

    getOverdueIssues: async () => {
      return this.request<any[]>("/library/issues/overdue");
    },

    getStudentLoans: async (studentId?: string) => {
      const queryStr = studentId
        ? `?studentId=${encodeURIComponent(studentId)}`
        : "";
      return this.request<any[]>(`/library/student/my-loans${queryStr}`);
    },

    getParentLoans: async () => {
      return this.request<any[]>("/library/parent/loans");
    },
  };

  // --- REPORTS MODULE ---
  reports = {
    getLibraryInventory: async (category?: string) => {
      const queryStr = category
        ? `?category=${encodeURIComponent(category)}`
        : "";
      return this.request<{
        totalTitles: number;
        totalCopies: number;
        availableCopies: number;
        issuedCopies: number;
        lostCopies: number;
        books: any[];
      }>(`/reports/library/inventory${queryStr}`);
    },

    getLibraryIssued: async (status?: string) => {
      const queryStr = status ? `?status=${encodeURIComponent(status)}` : "";
      return this.request<{
        totalCount: number;
        issues: any[];
      }>(`/reports/library/issued${queryStr}`);
    },

    getLibraryOverdue: async () => {
      return this.request<{
        overdueCount: number;
        totalAccruedFine: number;
        issues: any[];
      }>("/reports/library/overdue");
    },

    getAttendanceSummary: async (params?: {
      gradeLevel?: string;
      section?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const q = new URLSearchParams();
      if (params?.gradeLevel) q.append("gradeLevel", params.gradeLevel);
      if (params?.section) q.append("section", params.section);
      if (params?.startDate) q.append("startDate", params.startDate);
      if (params?.endDate) q.append("endDate", params.endDate);
      const queryStr = q.toString() ? `?${q.toString()}` : "";
      return this.request<{
        gradeLevel: string;
        section?: string;
        totalStudents: number;
        averageAttendancePercentage: number;
        students: any[];
      }>(`/reports/attendance/summary${queryStr}`);
    },

    getFeesSummary: async (gradeLevel?: string) => {
      const queryStr = gradeLevel
        ? `?gradeLevel=${encodeURIComponent(gradeLevel)}`
        : "";
      return this.request<{
        gradeLevel: string;
        totalStudents: number;
        totalBilled: number;
        totalPaid: number;
        totalOutstanding: number;
        collectionRate: number;
        plans: any[];
      }>(`/reports/fees/summary${queryStr}`);
    },

    getExamResults: async (params?: {
      academicYear?: string;
      term?: string;
      gradeLevel?: string;
    }) => {
      const q = new URLSearchParams();
      if (params?.academicYear) q.append("academicYear", params.academicYear);
      if (params?.term) q.append("term", params.term);
      if (params?.gradeLevel) q.append("gradeLevel", params.gradeLevel);
      const queryStr = q.toString() ? `?${q.toString()}` : "";
      return this.request<{
        summary: {
          totalStudentsWithResults: number;
          overallAveragePercentage: number;
          gradeDistribution: Record<string, number>;
          passCount: number;
          failCount: number;
        };
        results: any[];
      }>(`/reports/exams/results${queryStr}`);
    },
  };

  // --- HEALTH MODULE ---
  health = {
    check: async () => {
      return this.request<any>("/health");
    },
  };
}

export const api = new ApiService();
