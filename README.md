# School ERP SaaS — Phase 2: Unified Architecture and Backend

A production-grade, multi-tenant School ERP SaaS platform architected for scalable school onboarding, role-based operations, and database-level tenant isolation.

---

## 1. Canonical Project Structure

The project has been unified into a single frontend and single backend architecture:

```text
school-erp-saas/
├── saas-frontend/               # Unified Next.js 16 (Turbopack) + TypeScript + Tailwind CSS Frontend
│   └── src/
│       ├── app/
│       │   ├── login/           # Unified authentication route for all ERP roles
│       │   ├── super-admin/     # Super Admin SaaS control center & aggregate telemetry
│       │   ├── school-admin/    # School Admin tenant workspace, quotas & academic configuration
│       │   ├── accountant/      # Finance console, tuition fee ledger & payment receipts
│       │   ├── teacher/         # Teacher portal, period timetable & attendance roll call
│       │   ├── parent/          # Parent multi-child dashboard, fee invoices & grades
│       │   ├── student/         # Student learning hub, homework deadlines & timetable
│       │   ├── library/         # Library circulation desk, barcode loans & catalog
│       │   ├── schools/         # School directory & 5-step registration wizard
│       │   └── layout.tsx       # Root layout & executive styling
│       ├── components/          # Reusable design system, modals, tables, badges
│       ├── modules/             # 14 ERP module registry & entitlement descriptors
│       ├── services/            # Type-safe API client (api.ts) with Bearer token & error handling
│       └── types/               # TypeScript interfaces, subscription plans, quotas & roles
├── saas-backend/                # Unified NestJS + Prisma ORM + PostgreSQL Backend
│   ├── src/
│   │   ├── auth/                # SuperAdmin login, JWT, single-use invitation flow & redemption
│   │   ├── schools/             # Atomic school registration, SCH-XXXX code generator & directory
│   │   ├── users/               # Multi-tenant user service, role management & credentials
│   │   ├── modules/             # 14 Core ERP module entitlement controllers & guards
│   │   ├── audit/               # Zero-data-loss audit logging service (transaction-aware)
│   │   ├── common/              # @Roles() decorator, RolesGuard, JwtAuthGuard & currentUser
│   │   ├── health/              # GET /api/health with live PostgreSQL latency probe
│   │   └── main.ts              # Global prefix /api, CORS, validation pipe & port 4000
│   └── prisma/
│       ├── schema.prisma        # Models: School, User, SchoolModule, AuditLog (UUIDs, enums)
│       └── migrations/          # Applied database migration 20261028093054_init
└── README.md
```

---

## 2. Technology Stack & Running Ports

| Component | Technology | Default Port | Base URL |
| :--- | :--- | :--- | :--- |
| **Unified Frontend** | Next.js 16.4.3, React 19, Tailwind CSS v4, Lucide Icons | `3000` | `http://localhost:3000` |
| **Unified Backend** | NestJS, Prisma ORM, TypeScript, Bcrypt, JWT | `4000` | `http://localhost:4000/api` |
| **Database Engine** | PostgreSQL 17 (Prisma Client v5.22.0) | `5432` | Database: `school_erp` |

---

## 3. Seed Accounts & Credentials

The backend automatically verifies and seeds the initial SuperAdmin account on startup:

| Role | Email | Password | Default Panel | Scoping & Privacy |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `alex.sterling@edusaas.io` | `SuperAdmin@2026` | `/super-admin` | Global SaaS overview (Aggregate metrics only; zero private student data access) |
| **School Admin** | Auto-invited via registration | Set via Single-Use Token | `/school-admin` | Tenant isolated to invited school workspace (`schoolId`) |

---

## 4. Phase 2 Features Implemented & Tested

### Backend Capabilities (`saas-backend`)
1. **Super Admin Authentication**:
   - Encrypted passwords via bcrypt with work factor 12.
   - JWT tokens signed with RS256/HMAC secret and stored in secure request headers.
2. **Role-Based Access Control (RBAC)**:
   - Built-in `@Roles()` decorator, `RolesGuard`, and `JwtAuthGuard`.
   - Prevents unauthorized actions (e.g., School Admins cannot register schools or access cross-tenant records).
3. **School Registration API (`POST /api/schools`)**:
   - Full DTO validation (`class-validator`, `class-transformer`).
   - Automatically generated unique school codes (e.g., `SCH-2237`).
   - Database transaction (`prisma.$transaction`) ensuring atomic commit of:
     - School record with quotas (`maxStudents`, `maxStaff`, `storageLimitMb`).
     - 14 initial `SchoolModule` entitlements.
     - Single-use crypto invitation token (72-hour validity).
     - School Admin user record in `pending_setup` state.
     - Audit trail log (`SCHOOL_REGISTERED`).
4. **Single-Use Invitation Flow**:
   - `GET /api/auth/invitation/:token`: Validates token and returns school branding.
   - `POST /api/auth/invitation/redeem`: Hashes password, activates user, clears token to prevent replay/reuse.
5. **Authorized School Listing (`GET /api/schools`)**:
   - Super Admin authorized endpoint returning aggregate statistics, active/trial/suspended counts, and school profiles.
6. **Data Security & Privacy**:
   - Passwords, hashes, and invitation tokens are strictly sanitized and never exposed in ordinary API responses.

### Frontend Capabilities (`saas-frontend`)
1. **Connected Authentication**:
   - Real `POST /api/auth/login` integration with JWT token storage in `localStorage`.
   - Automatic role-based redirect upon login (`SUPER_ADMIN` -> `/super-admin`, `SCHOOL_ADMIN` -> `/school-admin`, etc.).
2. **Connected School Registration**:
   - 5-step wizard connected to `POST /api/schools`.
   - Real-time display of auto-generated school code and single-use invitation setup URL.
3. **Connected School Directory**:
   - Real-time directory fetching from `GET /api/schools` with search, filter, and module toggles.
4. **7 Dedicated Role Panels**:
   - `/super-admin`: Platform overview, live database latency probe, recent tenants, module adoption.
   - `/school-admin`: Tenant workspace, quota utilization gauges, onboarding checklist.
   - `/accountant`: Fee collections, day book, pending dues ledger, receipts stream.
   - `/teacher`: Period timetable, class roll call, grading queue, assignments.
   - `/parent`: Multi-child switcher, fee invoices, monthly presence, exam report cards.
   - `/student`: Student ID badge, class timetable, homework deadlines, digital library.
   - `/library`: Central library circulation, book loans, overdue tracker, ISBN search.
5. **Universal Design System**:
   - Crisp white cards, subtle borders (`border-slate-200`), clean typography (`Plus Jakarta Sans`), zero black boxes, zero dark inputs.
   - Interactive role switcher allowing seamless review across all 7 panels.

---

## 5. Verification Test Results

Automated test suite (`scratch/test_phase2_backend.js`):
```text
====================================================
SCHOOL ERP SAAS — PHASE 2: UNIFIED BACKEND TEST SUITE
====================================================

[PASS] Health check returns 200 OK and database connected
[PASS] Invalid credentials returns 401 Unauthorized
[PASS] Accessing GET /api/schools without Bearer token returns 401 Unauthorized
[PASS] Super Admin login returns 200/201 with JWT and role SUPER_ADMIN
[PASS] Token and user payload verified
[PASS] Register school returns 201 Created
[PASS] School code auto-generated: SCH-2237
[PASS] Single-use Admin Invitation Token generated successfully
[PASS] Duplicate school slug/email prevented with 409 Conflict
[PASS] Invitation token verification returns 200 OK
[PASS] Invitation payload matches invited School Admin email
[PASS] Invitation redeemed successfully, password set
[PASS] School Admin activation confirmed in response
[PASS] Reusing redeemed invitation token is rejected (400/404)
[PASS] School Admin login with newly set password succeeded
[PASS] User role is confirmed SCHOOL_ADMIN
[PASS] School Admin registering a new school is forbidden (403 Forbidden)
[PASS] GET /api/schools with Super Admin token returns 200 OK
[PASS] Found 2 schools listed with aggregate stats
[PASS] GET /api/auth/me returns 200
[PASS] passwordHash and invitationToken are NOT exposed in user payload

----------------------------------------------------
TEST RESULTS: 21 PASSED, 0 FAILED
----------------------------------------------------
```

---

## 5. Phase 3 Features: School Users and Student Management

### Database Schema Updates (`schema.prisma`)
1. **`Student` Model**:
   - `id`: UUID primary key.
   - `admissionNumber`: Auto-generated unique admission number (`<SCH_PREFIX>-ADM-<YEAR>-<SEQ>`), strictly scoped per school via `@@unique([schoolId, admissionNumber])`.
   - `fullName`, `gradeLevel`, `section`, `rollNumber`, `academicYear`, `dateOfBirth`, `gender`, `address`, `status`.
   - `hasStudentPortalAccess`: Boolean governing direct student credentials.
   - `studentUserId`: Optional foreign key to student `User` account (`UserRole.STUDENT`).
   - `schoolId`: Strict multi-tenant foreign key linking student to school.
2. **`ParentStudent` Junction Model**:
   - Implements **Rule 5** (One parent linked to multiple children across classes/sections).
   - `parentId`, `studentId`, `relationship`, `isPrimary`, `createdAt`.
   - `@@unique([parentId, studentId])` preventing duplicate parent-student bindings.
3. **`User` Model Extensions**:
   - Added `employeeId` with school scoping: `@@unique([schoolId, employeeId])`.
   - Added `department` and `designation` for teachers and staff.
   - Added `parentLinks ParentStudent[]` for parent accounts.
   - Added `studentProfile Student?` for student portal logins.

### Backend APIs (`saas-backend`)
1. **Users Module (`/api/users`)**:
   - `POST /api/users`: School Admin registers teachers (`TEACHER`) and staff (`ACCOUNTANT`, `LIBRARIAN`).
   - Auto-generates unique, sequentially incremented Employee IDs (`TCH-XXXX`, `EMP-XXXX`, `ACC-XXXX`).
   - Enforces school quotas (`school.maxStaff`).
   - Issues 72-hour secure cryptographic invitation tokens for password setup or hashes direct passwords with bcrypt (12 rounds).
   - `GET /api/users`: Lists school staff with role, department, and search filters.
   - `PATCH /api/users/:id`: Updates staff profile and status (`isActive`).
   - `DELETE /api/users/:id`: Deactivates staff with audit logging.
2. **Students Module (`/api/students`)**:
   - `POST /api/students`: Accountant and School Admin admit new students.
   - **Rule 6 Access Enforcement**: Students in LKG through Class 4 are strictly restricted to Parent Portal only. Attempts to enable student portal access are rejected with `400 Bad Request`. Class 5 onward may optionally have both parent and student portal access.
   - **Rule 5 Multi-Child Linkage**: If the parent's email already exists in the school, the existing parent account is reused and attached to the child; otherwise, a parent account with invitation token is atomically provisioned.
   - Atomic transaction (`prisma.$transaction`) guarantees that student record, parent account, parent-student linkage, and audit log commit atomically.
   - `GET /api/students`: Filter by grade level, section, status, and search query.
   - `GET /api/students/parents`: Family overview endpoint returning parents and all their linked children.
   - `GET /api/students/:id`: Detailed student profile with parent cards and audit logs.
3. **Security & Tenant Isolation**:
   - Every API query strictly filters by `schoolId` extracted from authenticated JWT (`@CurrentUser()`).
   - Cross-tenant access attempts return `404 Not Found` or `403 Forbidden`.
   - Super Admin is strictly prevented from accessing individual private student records (`403 Forbidden`).

### Frontend Dashboards (`saas-frontend`)
1. **Staff & Teachers Directory (`/school-admin/users`)**:
   - Live staff listing with search and role filters (Teacher, Accountant, Librarian).
   - "Register Staff / Teacher" modal with auto-generated Employee IDs and copyable invitation links.
2. **Student Admissions & Directory (`/accountant/students` and `/school-admin/students`)**:
   - Real-time directory with filters by Grade Level (Nursery to Class 12) and Section.
   - KPI metrics: Total Enrolled, Parent-Only Access count (LKG-Class 4), Dual Access count (Class 5+), Registered Families.
   - **Admission Modal**: Form validation, dynamic Rule 6 policy warning banner for junior grades, Class 5+ student portal credentials toggle, auto-generated admission numbers.
   - **Family & Multi-Child Tab**: Visual cards displaying parent accounts with all linked children.
3. **Updated Parent Portal (`/parent`)**:
   - Dynamically pulls authenticated parent profile and linked children.
   - Child selector pill allows parents to toggle between multiple children seamlessly.
   - Displays portal access policy badge for active child.
4. **Updated Student Portal (`/student`)**:
   - Dynamically pulls authenticated student profile, displaying real name, grade, section, admission number, and Class 5+ verified badge.

### Automated Test Verification
Both backend test suites (`test_phase3_backend.js` and `test_phase3_extended.js`) pass with 100% success rate:
- **`test_phase3_backend.js`**: **21 PASSED, 0 FAILED**
- **`test_phase3_extended.js`**: **18 PASSED, 0 FAILED**
Total: **39 automated end-to-end integration assertions verified**.

---

## 6. Phase 4: Manual Fee Management Module

Phase 4 implements a complete, multi-tenant, double-entry manual fee management system with **strictly NO online payment gateway**. Payments are confirmed and recorded manually by authorized School Admins and Accountants.

### Database & Prisma Models
1. **`FeeHead`**: Standard fee categories (`name`, `code`, `isRecurring`, scoped per school via `@@unique([schoolId, code])`).
2. **`FeePlan`**: Academic year fee structures (`name`, `academicYear`, `applicableGrade`, `totalAmount`).
3. **`FeePlanItem`**: Detailed itemized head breakdown (`feePlanId`, `feeHeadId`, `amount`, `@@unique([feePlanId, feeHeadId])`).
4. **`FeePlanInstallment`**: Term schedule with due dates and late fee fine configurations.
5. **`StudentFeePlan`**: Student assignment record (`grossAmount`, `concessionType`, `concessionAmount`, `netAmount`, `paidAmount`, `balanceAmount`, `status`, `@@unique([studentId, academicYear])`).
6. **`StudentFeeInstallment`**: Student installment schedule with waterfall allocation.
7. **`FeePayment`**: Immutable payment ledger record (`receiptNumber`, `amount`, `paymentMethod`, `transactionReference`, `idempotencyKey`, `status` [SUCCESS / REFUNDED], `refundAmount`, `refundReason`, `refundedAt`, `refundedById`, `@@unique([schoolId, receiptNumber])`).

### Key Accounting & Security Features
- **Strictly Manual / Offline Collection**: Supported payment methods are `CASH`, `BANK_TRANSFER` (NEFT/RTGS/IMPS), `CHEQUE`, and `UPI`. No online gateways (Razorpay, Stripe, payment links) are integrated.
- **Atomic Transactions & Idempotency**: Payment recording uses `prisma.$transaction` and client-generated `idempotencyKey`. Resubmitting a duplicate payment returns the existing receipt without double-charging.
- **Waterfall Installment Allocation**: Partial and full payments automatically satisfy pending installments in chronological order by `dueDate`.
- **Unique Sequential Receipts**: Receipts are formatted as `<SCHOOL_CODE>-RCP-<YEAR>-<SEQ>` (e.g., `SCH-1383-RCP-2026-0001`) with printable modal views.
- **Audited Reversals & Refunds**: Posted payment records are **never silently deleted**. Reversals update `status = 'REFUNDED'`, restore the student's fee plan balance, and log an audit trail entry.
- **Role-Based Privacy & Tenant Isolation**:
  - **Accountant & School Admin**: Manage heads, plans, assignments, manual collections, refunds, and reports within their own school.
  - **Parents**: Access `/parent/fees` to view only linked children's fee structures, installment due dates, payment history, and printable receipts. Parents are strictly blocked from recording payments (403 Forbidden).
  - **Super Admin**: Access platform-level aggregate statistics (`/api/fees/super-admin/aggregate`), but are strictly blocked from student fee ledgers (403 Forbidden).

### Frontend Screens Implemented
- **Accountant Dashboard (`/accountant`)**: Real-time KPI cards (Gross Billed, Concessions, Net Billed, Total Collected, Outstanding Dues), payment method breakdown, and recent payments ledger with receipt modal.
- **Fee Categories & Plans (`/accountant/categories`)**: Create fee heads with unique codes; create multi-head fee plans with dynamic installments and due dates.
- **Student Invoices & Dues (`/accountant/invoices`)**: Student fee dues ledger, status/grade filters, "Assign Fee Plan to Student" modal with live concession calculations, and student ledger inspection modal.
- **Manual Payment Collections (`/accountant/collections`)**: Record manual payments (Cash, Bank Transfer, Cheque, UPI) with idempotency protection, printable receipt modal, and audited refund modal.
- **Parent Portal (`/parent` & `/parent/fees`)**: Multi-child fee statement, installment schedule, confirmed payment history, and printable official receipt modal.

### Phase 4 Automated Test Verification
The comprehensive end-to-end integration suite (`scratch/test_phase4_fees.js`) verifies all 54 assertions:
- **`test_phase4_fees.js`**: **54 PASSED, 0 FAILED** (100% pass rate)

---

## 7. Phase 5: Attendance & Timetable Module

Phase 5 implements a robust, multi-tenant Attendance and Timetable system for schools, fully connected to PostgreSQL with strict role-based access control, automated conflict detection, and safe roll call upserting.

### Database & Prisma Models
1. **`ClassSection`**: Class groupings (`className`, `section`, `room`, `academicYear`, optional `classTeacherId`, `@@unique([schoolId, className, section, academicYear])`).
2. **`Subject`**: School-specific subject catalog (`name`, `code`, `applicableGrade`, `description`, `@@unique([schoolId, code])`).
3. **`Attendance`**: Daily student attendance record (`studentId`, `classSectionId`, `date` (`@db.Date`), `status` [`PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`, `EXCUSED_LEAVE`], `remarks`, `markedById`, `@@unique([schoolId, studentId, date])`).
4. **`StaffAttendance`**: Daily teacher and staff attendance record (`userId`, `date` (`@db.Date`), `status`, `checkIn`, `checkOut`, `remarks`, `markedById`, `@@unique([schoolId, userId, date])`).
5. **`TimetableSlot`**: Monday–Saturday schedule slot (`classSectionId`, `dayOfWeek` [MONDAY..SATURDAY], `periodNumber` [1..8], `startTime`, `endTime`, `room`, `subjectId`, `teacherId`, `@@unique([classSectionId, dayOfWeek, periodNumber])`).
6. **`SchoolHoliday`**: Institutional academic calendar holidays (`title`, `startDate`, `endDate`, `description`, `academicYear`).

### Scheduling & Conflict Prevention Engines
- **Teacher Scheduling Conflict Guard**: Before saving any timetable slot or bulk period schedule, the service scans all other classes within the school for the same `dayOfWeek` and `periodNumber`. If the assigned teacher is already scheduled, the API rejects the request with `409 Conflict` and specifies the clashing class.
- **Classroom Double-Booking Guard**: If a room is already occupied during that specific day and period by any other section, the API blocks the request with `409 Conflict` and specifies the occupying class.
- **Strict School-Level Tenant Scoping**: Every slot, subject, room, teacher, and student is validated against the authenticated tenant's `schoolId`. Cross-tenant links return `404 Not Found`.

### Attendance Rules & Privacy Guarantees
- **Safe Roll Call Upsert**: Daily roll calls leverage `@@unique([schoolId, studentId, date])` and an atomic transaction (`prisma.$transaction`). Re-submitting attendance for a date updates the existing rows with new statuses or remarks without creating duplicate records.
- **Teacher Class Authorization**: Teachers can only take roll call for classes where they are the designated class teacher or assigned a period in the timetable. Unauthorized attempts return `403 Forbidden`.
- **Parent Privacy**: Parents can view attendance only for their linked children via `/parent/attendance`. Multi-child toggle enables parents to switch between children effortlessly.
- **Student Privacy**: Students can view only their own authorized timetable via `/student/timetable`. Attempts to access another student's timetable return `403 Forbidden`.
- **Monthly Percentage Calculation**: Working days, present days, absent days, and excused leaves are aggregated to compute an exact attendance percentage (Full day & Late = 1, Half day = 0.5, Excused leave excluded from penalties).

### Connected Frontend Screens (`saas-frontend`)
- **Teacher Portal (`/teacher` & `/teacher/attendance`)**:
  - Live daily timetable schedule showing today's teaching periods with room and subject badges.
  - Interactive Attendance Roll Call page with class selector, calendar picker, "Mark All Present" button, individual status pills (Present, Absent, Late, Half Day, Leave), custom remarks input, and real-time attendance KPI counter.
- **Student Portal (`/student/timetable`)**:
  - Weekly Monday through Saturday timetable grid with day selector tabs, period cards (1–8), subject tags, teacher names, and assigned classroom rooms.
- **Parent Portal (`/parent/attendance`)**:
  - Multi-child attendance register with child selector tabs, month/year navigator, attendance percentage KPI cards (Present, Absent, Late, Excused), daily attendance status log, and school holidays banner.
- **School Admin Console (`/school-admin/academic-year`)**:
  - 4-in-1 Academic Management console with tabs for **Class Sections**, **Subject Catalog**, **Weekly Timetable Scheduler** (with clash detection notice), and **School Holidays Calendar**, complete with creation modals.

### Phase 5 Automated Test Verification
The comprehensive end-to-end integration suite (`scratch/test_phase5_attendance_timetable.js`) verifies all 58 assertions:
- **`test_phase5_attendance_timetable.js`**: **58 PASSED, 0 FAILED** (100% pass rate)

---

## 8. Phase 6: Exams, Marks & Report Cards Module

Phase 6 implements a comprehensive, tenant-isolated academic examination, marks recording, and report card generation system, fully connected to PostgreSQL with strict role-based access control, automatic grading calculations, and official printable report cards.

### Database & Prisma Models
1. **`Exam`**: Core examination entity (`schoolId`, `name`, `academicYear`, `term`, `classSectionId`, `description`, `status` [`DRAFT`, `REVIEWED`, `PUBLISHED`], `publishedAt`, `publishedById`, `startDate`, `endDate`).
2. **`ExamPaper`**: Subject papers scheduled under an exam (`schoolId`, `examId`, `classSectionId`, `subjectId`, `examDate` (`@db.Date`), `startTime`, `endTime`, `maxMarks`, `passingMarks`, `room`, `@@unique([examId, subjectId])`).
3. **`ExamMark`**: Individual student score records (`schoolId`, `examId`, `examPaperId`, `studentId`, `subjectId`, `marksObtained`, `percentage`, `grade`, `isPassed`, `remarks`, `enteredById`, `@@unique([examPaperId, studentId])`, `@@unique([examId, subjectId, studentId])`).
4. **`GradingRule`**: Configurable school-level grading criteria (`schoolId`, `name`, `minPercentage`, `maxPercentage`, `grade`, `gradePoint`, `description`, `isPassing`, `academicYear`, `@@unique([schoolId, grade, academicYear])`).

### Key Business Logic & Security Guarantees
- **Teacher Subject/Class Authorization (Rule 2)**:
  - Teachers are restricted to entering and modifying marks only for classes where they are the designated class teacher or assigned in the weekly timetable for that subject (`403 Forbidden` if unauthorized).
  - School Admin retains administrative authority to configure exams and manage permissions.
- **Score Validation & Safe Upsert (Rule 3)**:
  - Input marks are validated: marks obtained cannot be negative and cannot exceed the maximum marks configured for that paper (`400 Bad Request`).
  - Marks entry utilizes atomic upserts (`prisma.examMark.upsert`) keyed by `@@unique([examPaperId, studentId])`. Re-evaluating or re-submitting marks safely updates scores and recalculates percentages/grades without generating duplicate rows.
- **Configurable Grading Engine (Rule 4)**:
  - Automatic calculation of subject percentages, subject grades, cumulative total marks, overall percentage, overall grade, GPA point, and final pass/fail status.
  - School Admins can configure custom grading tiers per academic year (e.g., CBSE, ICSE, or IB scales). Unset ranges seamlessly fall back to the standard 7-tier scale (A+ through F).
- **Three-Tier Publication Lifecycle (Rule 5)**:
  - Exam results progress through `DRAFT` (initial mark entries) -> `REVIEWED` (teacher verification) -> `PUBLISHED` (official release).
  - Only `SCHOOL_ADMIN` (or `SUPER_ADMIN`) can execute publication. Attempts by teachers or unauthorized staff return `403 Forbidden`.
  - Students and parents can access report cards and marks sheets **only after publication** (`403 Forbidden` when in `DRAFT` or `REVIEWED` status).
- **Official Printable Report Cards with Attendance Summary (Rule 6)**:
  - Generates comprehensive digital and printable performance cards:
    - Institutional header: School name, legal affiliation, board, school code, address, and contact info.
    - Student profile: Full name, admission number, roll number, class & section, academic year.
    - Subject-wise table: Subject name & code, maximum marks, passing marks, marks obtained, percentage, grade, and pass/fail indicator.
    - Aggregate totals: Grand total marks, overall percentage, overall grade, grade point, and overall result (`PASSED` / `FAILED`).
    - Attendance summary: Total working days, days present, attendance percentage (calculated live from Phase 5 attendance records).
    - Certification: Official signature blocks for Class Teacher, Exam Incharge, and Principal.
    - High-quality `@media print` styling optimized for A4 paper and PDF export.
- **Linked-Child Authorization & Tenant Isolation (Rule 8)**:
  - Parents can access report cards only for their verified linked children via `ParentStudent`.
  - Students can access only their own authorized report card.
  - Every exam, paper, mark, and grading rule is strictly isolated by `schoolId`. Cross-tenant queries return `404 Not Found`.
- **Audit Trail Logs**:
  - Full audit logging for exam creation (`EXAM_CREATED`), marks entry (`MARKS_RECORDED`), and result publication (`EXAM_RESULTS_PUBLISHED`).

### Connected Frontend Screens (`saas-frontend`)
- **Teacher Portal (`/teacher/gradebook`)**:
  - Dynamic gradebook with exam and paper selectors, live KPI counters, student roster table, real-time score validation, instant percentage/grade calculation pills, "Save Marks", and "Submit Review".
- **Student Portal (`/student/exams`)**:
  - Scheduled examinations date-sheet with subject timings and rooms, alongside published results tab with "View & Print Official Report Card" modal.
- **Parent Portal (`/parent/report-card`)**:
  - Multi-child switcher tabs, published examination selector, performance KPI cards, subject breakdown table, and "Print Active Report Card" functionality.
- **School Admin Console (`/school-admin/exams`)**:
  - Full examination management with **Examinations Directory** (status filters, marks sheet audit, add paper modal), **Publication Approval Queue**, and **Configurable School Grading Rules** console.

### Automated Test Verification
- **Phase 6 Test Suite (`scratch/test_phase6_exams_marks.js`)**: **62 PASSED, 0 FAILED** (100% pass rate)
- **Phase 5 Regression (`scratch/test_phase5_attendance_timetable.js`)**: **58 PASSED, 0 FAILED** (100% pass rate)
- **Phase 4 Regression (`scratch/test_phase4_fees.js`)**: **54 PASSED, 0 FAILED** (100% pass rate)
- **Total Combined Verified Assertions**: **174 PASSED, 0 FAILED**

---

## 9. Phase 7: Notices & Notifications Module

Phase 7 introduces institutional circulars, role/class targeted broadcasts, granular staff publishing delegations, and real-time read/unread tracking across all 4 school portals:

### Backend Architecture & Database Additions (`saas-backend`)
- **Prisma Schema Enhancements**:
  - `NoticePriority`: `LOW`, `NORMAL`, `HIGH`, `URGENT`
  - `NoticeStatus`: `DRAFT`, `PUBLISHED`, `EXPIRED`
  - `NoticeTargetAudience`: `ALL`, `STAFF_ONLY`, `TEACHERS`, `PARENTS`, `STUDENTS`, `CLASS_SECTION`
  - `Notice` Model: Institutional bulletins with title, message, priority, status, target audience, class/section targeting, publish date, expiry date, published timestamps, author and publisher relations.
  - `NoticeRead` Model: Recipient read receipts with composite unique key `@@unique([noticeId, userId])` for zero-duplicate idempotent tracking.
  - `User.canManageNotices`: Boolean delegation flag allowing School Admins to grant teachers and staff notice management rights.
- **Granular Staff Publishing Authorizations (Rule 2)**:
  - School Admin and explicitly authorized staff (`canManageNotices: true`) can create, update, and publish notices.
  - Unauthorized staff attempts to post or edit notices return `403 Forbidden`.
  - School Admin can view all staff permissions (`GET /api/notices/staff/permissions`) and grant/revoke rights (`PATCH /api/notices/staff/:userId/permission`).
- **Targeting & Delivery Rules (Rule 3)**:
  - `ALL`: Delivered to all students, parents, teachers, and staff in the school.
  - `STAFF_ONLY`: Delivered to all teaching and non-teaching staff.
  - `TEACHERS`: Delivered specifically to faculty.
  - `PARENTS`: Delivered to parents and guardians.
  - `STUDENTS`: Delivered to enrolled students with portal access.
  - `CLASS_SECTION`: Strictly scoped to students and parents of that specific section (e.g. Class 8-A only; Class 8-B students and parents are strictly isolated).
  - Cross-school class targeting is rejected with `404 Not Found`.
- **Recipient Portals & Read Tracking (Rules 4 & 5)**:
  - `GET /api/notices`: Returns notices filtered by recipient role, linked children (for parents), and class sections.
  - Auto-marks read and computes `isExpired` dynamically.
  - `POST /api/notices/:id/read`: Manually marks notice as read.
  - `GET /api/notices/unread-count`: Returns real-time unread notices count.
- **Module Entitlements & Tenant Isolation (Rules 6 & 7)**:
  - If the `notices` module is disabled for a school, all notice endpoints return `403 Forbidden`.
  - Targeting students requires the `student_portal` module to be active.
  - Every notice and read record is strictly bound to `schoolId`. Cross-school access returns `404 Not Found`.
- **Audit Logging (Rule 8)**:
  - Complete audit trail for `NOTICE_CREATED`, `NOTICE_UPDATED`, `NOTICE_PUBLISHED`, `NOTICE_DELETED`, and `NOTICE_PERMISSION_CHANGED`.

### Connected Frontend Screens (`saas-frontend`)
- **School Admin Notices Console (`/school-admin/notices`)**:
  - Live KPI stats: Total Notices, Active Broadcasts, Drafts in Queue, Authorized Staff.
  - Tab 1: **All Bulletins & Notices** (Search, Status filters, Priority badges, Target Audience pills, View modal, Edit, Publish, Delete).
  - Tab 2: **Draft & Review Queue** (Focused feed for notices awaiting review).
  - Tab 3: **Staff Publishing Authorizations** (Table of faculty with instant toggle switches to grant/revoke publishing rights).
- **Teacher Bulletins Portal (`/teacher/notices`)**:
  - School-wide circulars, staff bulletins, class notices, unread counter pill, "Mark as Read" buttons.
  - For authorized teachers (`canManageNotices: true`), displays "Post Notice" action with full audience/class targeting modal.
- **Student Notice Board (`/student/notices`)**:
  - Clean student view for school circulars, holiday notices, and class announcements with unread indicators and auto-mark-read on detail view.
- **Parent Circulars Portal (`/parent/notices`)**:
  - Multi-child filter switcher (view all or filter by ward), school circulars, PTM notices, fee announcements, and class circulars.

### Automated Test Verification
- **Phase 7 Test Suite (`scratch/test_phase7_notices.js`)**: **79 PASSED, 0 FAILED** (100% pass rate)
- **Phase 6 Regression (`scratch/test_phase6_exams_marks.js`)**: **62 PASSED, 0 FAILED** (100% pass rate)
- **Phase 5 Regression (`scratch/test_phase5_attendance_timetable.js`)**: **58 PASSED, 0 FAILED** (100% pass rate)
- **Phase 4 Regression (`scratch/test_phase4_fees.js`)**: **54 PASSED, 0 FAILED** (100% pass rate)
- **Total Combined Verified Assertions Across Phases 4–7**: **253 PASSED, 0 FAILED**

---

## 10. Phase 8: Library Management & Institutional Reports

Phase 8 introduces enterprise-grade Library Management and multi-domain Institutional Reports for the School ERP SaaS platform, delivering full catalogue indexing, physical copy tracking, concurrency-safe circulation, configurable late-return fine ledgers, and institutional performance intelligence.

### Key Architecture & PostgreSQL Schema Models (`saas-backend/prisma/schema.prisma`)
- **`Book`**: ISBN-keyed catalogue entity tracking title, author, category, publisher, edition, shelf location, description, `totalCopies`, and `availableCopies` with unique compound index `[schoolId, isbn]`.
- **`BookCopy`**: Individual physical inventory item tracking `barcode` (`LIB-{ISBN}-{001}`), `copyNumber`, `condition`, and `status` (`AVAILABLE`, `ISSUED`, `RESERVED`, `DAMAGED`, `LOST`). Prevents duplicate active issues and copy double-booking.
- **`BookIssue`**: Circulation transaction tracking borrower type (`STUDENT` or `STAFF`), issue date, due date, return date, `renewalCount`, `maxRenewals`, status (`ISSUED`, `RETURNED`, `OVERDUE`, `LOST`), daily fine rate, calculated fine amount, payment status, and audited fee-ledger adjustment linkages.
- **`LibrarySetting`**: Per-school circulation policy configuring `maxBooksPerStudent`, `maxBooksPerStaff`, `defaultLoanDays`, `maxRenewals`, `finePerDay`, and `isFineEnabled`.
- **`UserRole.LIBRARIAN`**: First-class ERP role for library desk staff.

### Core Business Logic & Invariants
1. **Physical Copy Tracking & Concurrency-Safe Stock Management**:
   - Creating a book automatically provisions physical `BookCopy` records with unique barcodes.
   - Issuing a copy locks the copy status to `ISSUED` and atomically decrements `availableCopies` inside a database transaction.
   - Returning a book restores copy status to `AVAILABLE` and increments `availableCopies`.
2. **Circulation & Quota Enforcement**:
   - Enforces student borrowing limits (`maxBooksPerStudent`) and faculty limits (`maxBooksPerStaff`).
   - Prevents duplicate active issues of the same physical copy.
   - Enforces renewal limits (`maxRenewals`) with atomic date extension.
3. **Configurable Late Fines & Rule 4 Audited Fee-Ledger Adjustment**:
   - Overdue days and penalty amounts are calculated dynamically based on policy (`finePerDay * overdueDays`).
   - **Rule 4 Enforced**: Overdue fines do **NOT** automatically modify student fee ledgers or affect fee balances.
   - Any transfer of a library fine to the tuition fee ledger requires an explicit, audited call to `POST /api/library/issues/:id/adjust-to-fee`, strictly authorized for `SCHOOL_ADMIN` and `ACCOUNTANT`.
   - The adjustment atomically creates a linked `FeePayment` receipt record, credits the student's `StudentFeePlan` ledger, sets `fineAdjustedToFee: true` with `fineFeePaymentId`, and logs a `LIBRARY_FINE_ADJUSTED_TO_FEE` audit event.
4. **Institutional Reports Engine (`ReportsService`)**:
   - Reuses existing domain services (`FeesService`, `ExamsService`, `AttendanceService`, `LibraryService`) without code duplication.
   - Delivers 6 institutional reports:
     1. **Library Inventory Report** (`GET /api/reports/library/inventory`)
     2. **Issued Books Circulation Report** (`GET /api/reports/library/issued`)
     3. **Overdue Returns & Accrued Fines Report** (`GET /api/reports/library/overdue`)
     4. **Student Attendance Summary Report** (`GET /api/reports/attendance/summary`)
     5. **Fee Dues & Collections Summary Report** (`GET /api/reports/fees/summary`)
     6. **Published Exam Results Report** (`GET /api/reports/exams/results`)
5. **Tenant Isolation & Entitlements**:
   - Strict `schoolId` multi-tenant boundaries on every database query.
   - If `library` or `reports` modules are disabled for a tenant, all related endpoints return `403 Forbidden`.

### Connected Frontend Screens (`saas-frontend`)
- **Librarian Circulation Desk (`/library`)**:
  - Live KPI stats: Total Books, Available Copies, Active Loans, Overdue Items, Unpaid Fines.
  - Tab 1: **Circulation & Loans Register** (Active loans, Quick Issue modal, Return modal, Renew book, Adjust fine).
  - Tab 2: **Book Repository & Catalogue** (Filter by category, search by title/author/ISBN, Add Book modal with auto-copy generation).
  - Tab 3: **Overdue Returns & Penalties** (Highlighted overdue days, accumulated fines, settle/adjust fine modal).
  - Tab 4: **Circulation Policy & Rules** (Configurable loan periods, student/staff quotas, daily fines).
- **Subpages**:
  - `/library/books`: Dedicated full-screen catalogue and inventory repository.
  - `/library/circulation`: High-density circulation desk for quick issue and return scans.
  - `/library/members`: Directory of student and staff borrowers with active loan counts and history.
- **School Admin Institutional Reports Portal (`/school-admin/reports`)**:
  - 6 tabbed analytical views: Library Inventory, Issued Books, Overdue Returns, Student Attendance, Fee Collections, Published Exam Results.
  - Interactive grade/category filters, summary statistic cards, detailed data tables, and print support.
- **Student Digital Library (`/student/library`)**:
  - Personal loan overview: currently borrowed books, due date alerts, overdue penalty warnings, self-service renewal, and catalogue browsing.
- **Parent Library Loans Oversight (`/parent/library`)**:
  - Multi-child overview of books borrowed across linked wards, upcoming return deadlines, and overdue alerts.

### Automated Test Verification
- **Phase 8 Test Suite (`scratch/test_phase8_library_reports.js`)**: **70 PASSED, 0 FAILED** (100% pass rate)
- **Phase 7 Regression (`scratch/test_phase7_notices.js`)**: **60 PASSED, 0 FAILED** (100% pass rate)
- **Phase 6 Regression (`test_phase6_exams_marks.js`)**: **62 PASSED, 0 FAILED** (100% pass rate)
- **Phase 5 Regression (`test_phase5_attendance_timetable.js`)**: **58 PASSED, 0 FAILED** (100% pass rate)
- **Total Combined Verified Assertions Across Phases 5–8**: **250 PASSED, 0 FAILED**

---

## 11. Legacy Folder Inventory & Migration Plan

As instructed, legacy folders were preserved without automatic deletion. Below is the inventory and recommendation for future migration/archival:

| Legacy Folder | Nature & Architecture | Unique Features | Migration / Archival Recommendation |
| :--- | :--- | :--- | :--- |
| `backend/` | Express.js + Mongoose (MongoDB) | 32 Mongoose models (`Student.js`, `FeeRecord.js`, `Exam.js`, etc.) | **Archive**: Database is MongoDB (incompatible with target PostgreSQL). The business rules for student records, fee challans, and marks will be migrated to Prisma models in subsequent phases. |
| `backend-nest/` | Partial NestJS skeleton | Early Prisma prototype schema | **Safe to remove**: Completely superseded by `saas-backend/`, which contains the fully working NestJS architecture, auth, Prisma migrations, and tests. |
| `frontend/` (8 folders) | 8 separate Vite/React projects (`ERP-SuperAdmin`, `ERP-SchoolAdmin`, `ERP-AccountantAdmin`, `ERP-TeacherPanel`, `ERP-ParentPanel`, `ERP-StudentPanel`, `ERP-LibraryPanel`, `ERP-ReceiptionAdmin`) | Individual UI form snippets and mock views | **Archive**: Superseded by `saas-frontend/src/app/` which consolidates all panels into one Next.js app with shared authentication, navigation, and API client. |

---

## 12. How to Run Locally

### 1. Unified Backend
```bash
cd saas-backend
npm install
npm run build
npm run start:dev   # Or: node dist/main.js
# Runs on http://localhost:4000/api
```

### 2. Unified Frontend
```bash
cd saas-frontend
npm install
npm run build
npm run dev
# Runs on http://localhost:3000
```



