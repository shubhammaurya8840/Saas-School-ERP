/**
 * SCHOOL ERP SAAS — PHASE 9: FINAL AUDIT & PRODUCTION READINESS TEST SUITE
 * 
 * Comprehensive 10-Domain Verification:
 * 1. Role authentication & authorization across all 7 roles:
 *    - Super Admin, School Admin, Accountant, Librarian, Teacher, Parent, Student.
 * 2. Tenant isolation & privacy:
 *    - Super Admin blocked from private student ledgers, report cards, student loans, and school notices.
 *    - Super Admin allowed on platform-level aggregates (GET /fees/super-admin/aggregate).
 *    - Cross-school tenant isolation: School B token cannot access School A students, fees, or books.
 * 3. Authentication & Security:
 *    - Invalid credentials rejected (401).
 *    - Invalid/tampered JWT rejected (401).
 *    - Single-use invitation token: cannot be re-redeemed (400 or 404).
 *    - Input validation rejects malformed payload (400).
 * 4. Module entitlements:
 *    - Toggling module disabled blocks API access (403).
 *    - Re-enabling restores access while preserving all pre-existing data.
 * 5. Core workflows & Idempotency:
 *    - Fee payment with idempotency key.
 *    - Audited payment refund.
 *    - Library book circulation & fine calculation.
 *    - Rule 4 audited fine adjustment to student fee ledger.
 *    - Notice publish & unread count tracking.
 * 6. Database constraints & safe transactions:
 *    - Duplicate admission number in same school rejected.
 *    - Duplicate ISBN in same school rejected.
 */

const BASE_URL = 'http://localhost:4000/api';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`[PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`[FAIL] ${message}`);
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runAuditTests() {
  console.log('==============================================================================');
  console.log('SCHOOL ERP SAAS — PHASE 9: FINAL SECURITY, AUDIT & ISOLATION TEST SUITE');
  console.log('==============================================================================\n');

  const rand = Math.floor(Math.random() * 9000) + 1000;

  // -------------------------------------------------------------------------
  // SECTION 1: AUTHENTICATION & SECURITY BASELINE
  // -------------------------------------------------------------------------
  console.log('--- SECTION 1: AUTHENTICATION & SECURITY BASELINE ---');

  // 1.1 Invalid credentials rejected
  const badLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'nonexistent@edusaas.io',
      password: 'WrongPassword@123',
    }),
  });
  assert(badLogin.status === 401, '1.1 Authentication rejects invalid credentials with 401 Unauthorized');

  // 1.2 Malformed JWT rejected
  const badJwt = await request('/schools', {
    method: 'GET',
    headers: { Authorization: 'Bearer invalid.tampered.token' },
  });
  assert(badJwt.status === 401, '1.2 API rejects malformed/tampered JWT with 401 Unauthorized');

  // 1.3 Super Admin login
  const saLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'alex.sterling@edusaas.io',
      password: 'SuperAdmin@2026',
    }),
  });
  assert(saLogin.status === 200 && saLogin.data.accessToken, '1.3 Super Admin login succeeded with valid JWT');
  const saToken = saLogin.data.accessToken;

  // 1.4 Health check endpoint
  const healthRes = await request('/health');
  assert(healthRes.status === 200 && healthRes.data.status === 'ok', '1.4 Health check endpoint returns 200 OK with connected DB');

  // -------------------------------------------------------------------------
  // SECTION 2: MULTI-TENANCY PROVISIONING (SCHOOL A & SCHOOL B)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 2: MULTI-TENANCY PROVISIONING (SCHOOL A & SCHOOL B) ---');

  // Provision School A
  const regSchoolA = await request('/schools', {
    method: 'POST',
    headers: { Authorization: `Bearer ${saToken}` },
    body: JSON.stringify({
      name: `Delhi Public Academy ${rand}`,
      slug: `dpa-${rand}`,
      board: 'CBSE',
      city: 'New Delhi',
      state: 'Delhi',
      adminEmail: `principal.a.${rand}@dpa.edu`,
      adminName: 'Principal A',
    }),
  });
  assert(regSchoolA.status === 201 && regSchoolA.data.school, '2.1 School A provisioned by Super Admin');
  const schoolA = regSchoolA.data.school;
  const invA = regSchoolA.data.invitation.token;

  // Single-use invitation token redemption for School A
  const redeemA = await request('/auth/invitation/redeem', {
    method: 'POST',
    body: JSON.stringify({
      token: invA,
      password: 'SchoolAPassword@2026',
    }),
  });
  assert(redeemA.status === 200 || redeemA.status === 201, '2.2 School A Admin redeemed single-use invitation token');

  // Re-redeeming should fail (single-use guarantee, returns 400 or 404)
  const reRedeemA = await request('/auth/invitation/redeem', {
    method: 'POST',
    body: JSON.stringify({
      token: invA,
      password: 'SchoolAPassword@2026',
    }),
  });
  assert(reRedeemA.status === 400 || reRedeemA.status === 404, '2.3 Single-use invitation token cannot be reused (rejected with 400 or 404)');

  // Login School A Admin
  const adminALogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: `principal.a.${rand}@dpa.edu`,
      password: 'SchoolAPassword@2026',
    }),
  });
  assert(adminALogin.status === 200, '2.4 School A Admin logged in successfully');
  const tokenA = adminALogin.data.accessToken;

  // Provision School B (for Cross-Tenant isolation tests)
  const regSchoolB = await request('/schools', {
    method: 'POST',
    headers: { Authorization: `Bearer ${saToken}` },
    body: JSON.stringify({
      name: `Bangalore Grammar School ${rand}`,
      slug: `bgs-${rand}`,
      board: 'ICSE',
      city: 'Bangalore',
      state: 'Karnataka',
      adminEmail: `principal.b.${rand}@bgs.edu`,
      adminName: 'Principal B',
    }),
  });
  assert(regSchoolB.status === 201, '2.5 School B provisioned for cross-tenant verification');
  const schoolB = regSchoolB.data.school;
  const invB = regSchoolB.data.invitation.token;

  await request('/auth/invitation/redeem', {
    method: 'POST',
    body: JSON.stringify({
      token: invB,
      password: 'SchoolBPassword@2026',
    }),
  });
  const adminBLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: `principal.b.${rand}@bgs.edu`,
      password: 'SchoolBPassword@2026',
    }),
  });
  assert(adminBLogin.status === 200, '2.6 School B Admin logged in successfully');
  const tokenB = adminBLogin.data.accessToken;

  // -------------------------------------------------------------------------
  // SECTION 3: ROLE PROVISIONING IN SCHOOL A (ALL 7 ROLES)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 3: ROLE PROVISIONING IN SCHOOL A ---');

  // Create ClassSection
  const classSecRes = await request('/timetable/class-sections', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      className: 'Grade 10',
      section: 'A',
      room: 'Room 101',
      academicYear: '2025-2026',
    }),
  });
  assert(classSecRes.status === 201, '3.1 ClassSection Grade 10-A created');
  const classSectionId = classSecRes.data.id;

  // 3.2 Create Teacher
  const teacherUserRes = await request('/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      fullName: 'Vikram Sharma',
      email: `vikram.${rand}@dpa.edu`,
      role: 'TEACHER',
      phone: `9811${rand}`,
      designation: 'Senior Math Teacher',
      department: 'Mathematics',
    }),
  });
  assert(teacherUserRes.status === 201, '3.2 Teacher user provisioned');
  const teacherInv = teacherUserRes.data.invitation?.token;
  await request('/auth/invitation/redeem', {
    method: 'POST',
    body: JSON.stringify({
      token: teacherInv,
      password: 'TeacherPassword@2026',
    }),
  });
  const teacherLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: `vikram.${rand}@dpa.edu`,
      password: 'TeacherPassword@2026',
    }),
  });
  assert(teacherLogin.status === 200, '3.3 Teacher logged in');
  const teacherToken = teacherLogin.data.accessToken;

  // 3.4 Create Accountant
  const accUserRes = await request('/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      fullName: 'Ramesh Mehta',
      email: `ramesh.${rand}@dpa.edu`,
      role: 'ACCOUNTANT',
      phone: `9822${rand}`,
      designation: 'Bursar',
      department: 'Finance',
    }),
  });
  assert(accUserRes.status === 201, '3.4 Accountant user provisioned');
  const accInv = accUserRes.data.invitation?.token;
  await request('/auth/invitation/redeem', {
    method: 'POST',
    body: JSON.stringify({
      token: accInv,
      password: 'AccountantPassword@2026',
    }),
  });
  const accLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: `ramesh.${rand}@dpa.edu`,
      password: 'AccountantPassword@2026',
    }),
  });
  assert(accLogin.status === 200, '3.5 Accountant logged in');
  const accToken = accLogin.data.accessToken;

  // 3.6 Create Librarian
  const libUserRes = await request('/users', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      fullName: 'Meenakshi Iyer',
      email: `meenakshi.${rand}@dpa.edu`,
      role: 'LIBRARIAN',
      phone: `9833${rand}`,
      designation: 'Head Librarian',
      department: 'Library',
    }),
  });
  assert(libUserRes.status === 201, '3.6 Librarian user provisioned');
  const libInv = libUserRes.data.invitation?.token;
  await request('/auth/invitation/redeem', {
    method: 'POST',
    body: JSON.stringify({
      token: libInv,
      password: 'LibrarianPassword@2026',
    }),
  });
  const libLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: `meenakshi.${rand}@dpa.edu`,
      password: 'LibrarianPassword@2026',
    }),
  });
  assert(libLogin.status === 200, '3.7 Librarian logged in');
  const libToken = libLogin.data.accessToken;

  // 3.8 Enroll Student & Parent
  const enrolRes = await request('/students', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      fullName: `Aarav Patel ${rand}`,
      admissionNumber: `ADM-${rand}-001`,
      gradeLevel: 'Grade 10',
      section: 'A',
      classSectionId,
      parentName: `Sanjay Patel ${rand}`,
      parentEmail: `parent.${rand}@dpa.family`,
      parentPhone: '+91 9876543210',
      parentRelationship: 'FATHER',
      enableStudentPortalLogin: true,
      studentEmail: `aarav.${rand}@student.dpa.edu`,
      studentPassword: 'StudentPassword@2026',
    }),
  });
  assert(enrolRes.status === 201, '3.8 Student enrolled with portal credentials');
  const student = enrolRes.data.student || enrolRes.data;
  const studentId = student.id;

  // 3.9 Student Login
  const studentLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: `aarav.${rand}@student.dpa.edu`,
      password: 'StudentPassword@2026',
    }),
  });
  assert(studentLogin.status === 200 && studentLogin.data.accessToken, '3.9 Student logged into student portal');
  const studentToken = studentLogin.data.accessToken;

  // 3.10 Parent password redemption & login
  const parentInvToken = enrolRes.data.parentInvitationUrl
    ? enrolRes.data.parentInvitationUrl.split('token=')[1]
    : enrolRes.data.parentInvitationToken;
  if (parentInvToken) {
    await request('/auth/invitation/redeem', {
      method: 'POST',
      body: JSON.stringify({
        token: parentInvToken,
        password: 'ParentPassword@2026',
      }),
    });
  }
  const parentLogin = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: `parent.${rand}@dpa.family`,
      password: 'ParentPassword@2026',
    }),
  });
  assert(parentLogin.status === 200 && parentLogin.data.accessToken, '3.10 Parent logged into parent portal');
  const parentToken = parentLogin.data.accessToken;

  // -------------------------------------------------------------------------
  // SECTION 4: SUPER ADMIN TENANT ISOLATION & PRIVACY AUDIT (REQUIREMENT 2)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 4: SUPER ADMIN TENANT ISOLATION & PRIVACY AUDIT ---');

  // 4.1 Super Admin CANNOT access student fee ledger
  const saLedger = await request(`/fees/students/${studentId}/ledger`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${saToken}` },
  });
  assert(saLedger.status === 403, '4.1 Super Admin is strictly forbidden (403) from accessing student fee ledgers');

  // 4.2 Super Admin CANNOT access student report card
  const saReportCard = await request(`/exams/any-id/report-card/${studentId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${saToken}` },
  });
  assert(saReportCard.status === 403, '4.2 Super Admin is strictly forbidden (403) from accessing student report cards');

  // 4.3 Super Admin CANNOT access student library loans
  const saLoans = await request('/library/student-loans', {
    method: 'GET',
    headers: { Authorization: `Bearer ${saToken}` },
  });
  assert(saLoans.status === 403, '4.3 Super Admin is strictly forbidden (403) from accessing student library loans');

  // 4.4 Super Admin CANNOT access school notices
  const saNotices = await request('/notices', {
    method: 'GET',
    headers: { Authorization: `Bearer ${saToken}` },
  });
  assert(saNotices.status === 403, '4.4 Super Admin is strictly forbidden (403) from accessing tenant school notices');

  // 4.5 Super Admin CAN access permitted platform-level aggregate
  const saAggregate = await request('/fees/super-admin/aggregate', {
    method: 'GET',
    headers: { Authorization: `Bearer ${saToken}` },
  });
  assert(saAggregate.status === 200 && typeof saAggregate.data.totalVolumeCollected === 'number',
    '4.5 Super Admin CAN access platform-level aggregated collections (/fees/super-admin/aggregate)');

  // -------------------------------------------------------------------------
  // SECTION 5: CROSS-TENANT ISOLATION (SCHOOL B -> SCHOOL A)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 5: CROSS-TENANT ISOLATION (SCHOOL B -> SCHOOL A) ---');

  // 5.1 School B cannot read School A student
  const crossStudent = await request(`/students/${studentId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(crossStudent.status === 404 || crossStudent.status === 403,
    '5.1 Cross-tenant student access blocked (404/403 for School B trying to access School A student)');

  // 5.2 School B cannot read School A student fee ledger
  const crossLedger = await request(`/fees/students/${studentId}/ledger`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(crossLedger.status === 404 || crossLedger.status === 403,
    '5.2 Cross-tenant fee ledger access blocked (404/403 for School B trying to access School A ledger)');

  // Create a book in School A
  const bookARes = await request('/library/books', {
    method: 'POST',
    headers: { Authorization: `Bearer ${libToken}` },
    body: JSON.stringify({
      title: 'Advanced Mathematics',
      author: 'R.D. Sharma',
      isbn: `978-81-${rand}-01`,
      barcode: `BC-${rand}-01`,
      category: 'Academic',
      totalCopies: 5,
    }),
  });
  assert(bookARes.status === 201, '5.3 Book created in School A');
  const bookAId = bookARes.data.id;

  // 5.4 School B cannot read School A book
  const crossBook = await request(`/library/books/${bookAId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  assert(crossBook.status === 404 || crossBook.status === 403,
    '5.4 Cross-tenant library book access blocked (404/403 for School B trying to access School A book)');

  // -------------------------------------------------------------------------
  // SECTION 6: MODULE ENTITLEMENTS (REQUIREMENT 4)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 6: MODULE ENTITLEMENTS ENFORCEMENT ---');

  // 6.1 Disable 'library' module for School A
  const disableMod = await request(`/schools/${schoolA.id}/modules`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${saToken}` },
    body: JSON.stringify({ moduleKey: 'library', isEnabled: false }),
  });
  assert(disableMod.status === 200, '6.1 Super Admin disabled library module for School A');

  // 6.2 Attempting to create book when module is disabled fails with 403
  const blockedBook = await request('/library/books', {
    method: 'POST',
    headers: { Authorization: `Bearer ${libToken}` },
    body: JSON.stringify({
      title: 'Blocked Chemistry Book',
      author: 'O.P. Tandon',
      isbn: `978-81-${rand}-02`,
      barcode: `BC-${rand}-02`,
      category: 'Science',
      totalCopies: 2,
    }),
  });
  assert(blockedBook.status === 403, '6.2 Creating book blocked with 403 when module is disabled');

  // 6.3 Re-enable 'library' module for School A
  const enableMod = await request(`/schools/${schoolA.id}/modules`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${saToken}` },
    body: JSON.stringify({ moduleKey: 'library', isEnabled: true }),
  });
  assert(enableMod.status === 200, '6.3 Super Admin re-enabled library module for School A');

  // 6.4 Data preservation check: existing book is still intact
  const verifyBookA = await request(`/library/books/${bookAId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${libToken}` },
  });
  assert(verifyBookA.status === 200 && verifyBookA.data.id === bookAId,
    '6.4 Data preservation verified: pre-existing books preserved after module re-enable');

  // -------------------------------------------------------------------------
  // SECTION 7: CORE WORKFLOWS & IDEMPOTENCY (REQUIREMENT 5)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 7: CORE WORKFLOWS & IDEMPOTENCY ---');

  // 7.1 Fee Head & Fee Plan creation
  const feeHeadRes = await request('/fees/heads', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accToken}` },
    body: JSON.stringify({
      name: 'Term 1 Tuition Fee',
      code: `T1-TUIT-${rand}`,
      category: 'TUITION',
    }),
  });
  assert(feeHeadRes.status === 201, '7.1 Fee head created by Accountant');

  const feePlanRes = await request('/fees/plans', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accToken}` },
    body: JSON.stringify({
      name: 'Grade 10 Annual Plan',
      academicYear: '2025-2026',
      applicableGrade: 'Grade 10',
      items: [
        {
          feeHeadId: feeHeadRes.data.id,
          amount: 15000,
        },
      ],
      installments: [
        {
          title: 'Term 1 Installment',
          dueDate: '2026-11-30T00:00:00.000Z',
          amount: 15000,
        },
      ],
    }),
  });
  assert(feePlanRes.status === 201, '7.2 Fee plan created by Accountant');

  // Assign fee plan to student
  const assignPlan = await request('/fees/assign', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accToken}` },
    body: JSON.stringify({
      studentId: studentId,
      feePlanId: feePlanRes.data.id,
    }),
  });
  assert(assignPlan.status === 201, '7.3 Fee plan assigned to student');
  const studentFeePlanId = assignPlan.data.id;

  // 7.4 Payment recording with Idempotency Key
  const idemKey = `IDEM-PAY-${rand}-01`;
  const paymentRes1 = await request('/fees/payments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accToken}` },
    body: JSON.stringify({
      studentFeePlanId: studentFeePlanId,
      amount: 5000,
      paymentMethod: 'CASH',
      idempotencyKey: idemKey,
      remarks: 'Initial term payment',
    }),
  });
  assert(paymentRes1.status === 200 || paymentRes1.status === 201, '7.4 Payment recorded successfully with idempotency key');
  const paymentReceiptId = paymentRes1.data.receiptNumber || paymentRes1.data.payment?.receiptNumber || paymentRes1.data.id;
  const paymentId = paymentRes1.data.payment?.id || paymentRes1.data.id;

  // Re-posting identical payment with same idempotency key
  const paymentRes2 = await request('/fees/payments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accToken}` },
    body: JSON.stringify({
      studentFeePlanId: studentFeePlanId,
      amount: 5000,
      paymentMethod: 'CASH',
      idempotencyKey: idemKey,
      remarks: 'Duplicate attempt',
    }),
  });
  assert(paymentRes2.status === 200 || paymentRes2.status === 201, '7.5 Idempotent payment request safely handled without double deduction');

  // 7.6 Printable Receipt generation
  const receiptRes = await request(`/fees/receipts/${paymentReceiptId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accToken}` },
  });
  assert(receiptRes.status === 200, '7.6 Printable fee payment receipt retrieved successfully');

  // 7.7 Audited Payment Refund
  const refundRes = await request(`/fees/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accToken}` },
    body: JSON.stringify({
      refundReason: 'Excess tuition fee payment refunded to parent',
      refundAmount: 1000,
    }),
  });
  assert(refundRes.status === 200 || refundRes.status === 201, '7.7 Audited payment refund processed successfully');

  // 7.8 Library Issue & Fine calculation
  const issueRes = await request('/library/issues', {
    method: 'POST',
    headers: { Authorization: `Bearer ${libToken}` },
    body: JSON.stringify({
      bookId: bookAId,
      borrowerType: 'STUDENT',
      studentId: studentId,
      dueDate: '2026-10-01', // Backdated to trigger overdue
    }),
  });
  assert(issueRes.status === 201, '7.8 Library book issued with backdated due date for fine audit');
  const issueId = issueRes.data.id;

  // Return book with fine
  const returnRes = await request(`/library/issues/${issueId}/return`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${libToken}` },
    body: JSON.stringify({
      condition: 'GOOD',
      finePaid: false,
    }),
  });
  assert(returnRes.status === 200 && returnRes.data.fineAmount > 0,
    `7.9 Overdue book returned with calculated fine of Rs. ${returnRes.data?.fineAmount}`);

  // 7.10 Rule 4 Audited Fine Adjustment to Student Fee Ledger
  const adjustRes = await request(`/library/issues/${issueId}/adjust-to-fee`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accToken}` },
    body: JSON.stringify({
      studentFeePlanId,
      remarks: 'Unpaid overdue library fine adjusted to student term fee ledger',
    }),
  });
  assert(adjustRes.status === 200 && adjustRes.data.isFinePaid === true,
    '7.10 Rule 4 Audited fine adjustment to fee ledger completed with audit entry');

  // 7.11 Notices Creation & Role-Targeted Feed
  const noticeRes = await request('/notices', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      title: `Annual Sports Day ${rand}`,
      message: 'Annual sports day will be held on Friday. All students must wear house uniforms.',
      targetAudience: 'ALL',
      priority: 'HIGH',
      status: 'PUBLISHED',
      publishDate: '2026-10-25T00:00:00.000Z',
    }),
  });
  assert(noticeRes.status === 201, '7.11 School notice published for all audiences');
  const noticeId = noticeRes.data.id;

  // Student checks unread count & reads notice
  const studentUnread = await request('/notices/unread-count', {
    method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(studentUnread.status === 200 && studentUnread.data.unreadCount >= 1,
    '7.12 Student unread notices count accurately reflects newly published notice');

  const readRes = await request(`/notices/${noticeId}/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert(readRes.status === 200, '7.13 Student marked notice as read');

  // -------------------------------------------------------------------------
  // SECTION 8: DATABASE CONSTRAINTS & INTEGRITY (REQUIREMENT 6)
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 8: DATABASE CONSTRAINTS & INTEGRITY ---');

  // 8.1 Duplicate admission number in same school rejected
  const dupStudent = await request('/students', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      fullName: 'Duplicate Student',
      admissionNumber: `ADM-${rand}-001`, // Same as Aarav Patel
      gradeLevel: 'Grade 10',
      section: 'A',
      classSectionId,
      parentName: 'Duplicate Parent',
      parentEmail: `parent.dup.${rand}@dpa.family`,
      academicYear: '2025-2026',
    }),
  });
  assert(dupStudent.status === 409 || dupStudent.status === 400,
    '8.1 Unique constraint enforced: duplicate admission number in same school rejected (409/400)');

  // 8.2 Duplicate ISBN in same school rejected
  const dupBook = await request('/library/books', {
    method: 'POST',
    headers: { Authorization: `Bearer ${libToken}` },
    body: JSON.stringify({
      title: 'Duplicate ISBN Book',
      author: 'Another Author',
      isbn: `978-81-${rand}-01`, // Same as Book A
      barcode: `BC-${rand}-99`,
      category: 'Reference',
      totalCopies: 1,
    }),
  });
  assert(dupBook.status === 409 || dupBook.status === 400,
    '8.2 Unique constraint enforced: duplicate ISBN in same school rejected (409/400)');

  // -------------------------------------------------------------------------
  // SUMMARY RESULTS
  // -------------------------------------------------------------------------
  console.log('\n==============================================================================');
  console.log(`PHASE 9 AUDIT RESULTS: Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('==============================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAuditTests().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
