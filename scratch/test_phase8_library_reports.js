/**
 * Phase 8 End-to-End Automated Test Suite: Library Management & Institutional Reports
 */

const BASE_URL = "http://localhost:4000/api";

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedCount++;
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...(options.headers || {}),
  };
  const body = options.body
    ? typeof options.body === "string"
      ? options.body
      : JSON.stringify(options.body)
    : undefined;

  const res = await fetch(url, {
    method: options.method || "GET",
    headers,
    body,
  });

  let data;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log("===============================================================================");
  console.log("SCHOOL ERP SAAS — PHASE 8: LIBRARY MANAGEMENT & REPORTS TEST SUITE");
  console.log("===============================================================================\n");

  const rand = Math.floor(Math.random() * 9000) + 1000;

  // 1. Super Admin Authentication
  console.log("Step 1: Super Admin Authentication...");
  const saLogin = await request("/auth/login", {
    method: "POST",
    body: { email: "alex.sterling@edusaas.io", password: "SuperAdmin@2026" },
  });
  assert(saLogin.status === 200 && saLogin.data.accessToken, "Super Admin login successful");
  const saToken = saLogin.data.accessToken;

  // 2. Register School A
  console.log("\nStep 2: Registering School A and School B for Tenant Isolation...");
  const regA = await request("/schools", {
    method: "POST",
    token: saToken,
    body: {
      name: `Apex Library Academy ${rand}`,
      slug: `apex-lib-${rand}`,
      board: "CBSE",
      city: "New Delhi",
      state: "Delhi",
      adminEmail: `admin${rand}@apexlib.edu`,
      adminName: "Dr. Apex Principal",
    },
  });
  assert(regA.status === 201 && regA.data.school, "School A registered successfully");
  const schoolA = regA.data.school;
  const adminEmailA = regA.data.admin?.email || `admin${rand}@apexlib.edu`;
  const invTokenA = regA.data.invitation.token;

  // Redeem School A Admin Password & Login
  const redeemA = await request("/auth/invitation/redeem", {
    method: "POST",
    body: { token: invTokenA, password: "AdminPassword@2026" },
  });
  assert(redeemA.status === 200, "School A Admin password redeemed");

  const adminALogin = await request("/auth/login", {
    method: "POST",
    body: { email: adminEmailA, password: "AdminPassword@2026" },
  });
  assert(adminALogin.status === 200 && adminALogin.data.accessToken, "School A Admin logged in");
  const tokenA = adminALogin.data.accessToken;

  // Register School B for Cross-Tenant Isolation
  const regB = await request("/schools", {
    method: "POST",
    token: saToken,
    body: {
      name: `Beacon Isolation High ${rand}`,
      slug: `beacon-lib-${rand}`,
      board: "ICSE",
      city: "Mumbai",
      state: "Maharashtra",
      adminEmail: `admin${rand}@beaconlib.edu`,
      adminName: "Principal Beacon",
    },
  });
  assert(regB.status === 201 && regB.data.school, "School B registered successfully");
  const schoolB = regB.data.school;
  const invTokenB = regB.data.invitation.token;

  await request("/auth/invitation/redeem", {
    method: "POST",
    body: { token: invTokenB, password: "AdminPassword@2026" },
  });
  const adminBLogin = await request("/auth/login", {
    method: "POST",
    body: { email: `admin${rand}@beaconlib.edu`, password: "AdminPassword@2026" },
  });
  assert(adminBLogin.status === 200 && adminBLogin.data.accessToken, "School B Admin logged in");
  const tokenB = adminBLogin.data.accessToken;

  // 3. Create Users in School A: Librarian, Teacher, Student, Parent
  console.log("\nStep 3: Creating Users & Profiles in School A...");
  // Librarian
  const createLib = await request("/users", {
    method: "POST",
    token: tokenA,
    body: {
      fullName: `Geeta Librarian ${rand}`,
      email: `librarian${rand}@apexlib.edu`,
      role: "LIBRARIAN",
      designation: "Head Librarian",
      department: "Library",
      employeeId: `LIB-${rand}-01`,
    },
  });
  assert(createLib.status === 201, "Librarian user created with LIBRARIAN role");
  const libTokenRes = createLib.data.invitation?.token;
  await request("/auth/invitation/redeem", {
    method: "POST",
    body: { token: libTokenRes, password: "LibrarianPassword@2026" },
  });
  const libLogin = await request("/auth/login", {
    method: "POST",
    body: { email: `librarian${rand}@apexlib.edu`, password: "LibrarianPassword@2026" },
  });
  assert(libLogin.status === 200 && libLogin.data.accessToken, "Librarian logged in");
  const libToken = libLogin.data.accessToken;

  // Teacher
  const createTeacher = await request("/users", {
    method: "POST",
    token: tokenA,
    body: {
      fullName: `Suresh Teacher ${rand}`,
      email: `teacher${rand}@apexlib.edu`,
      role: "TEACHER",
      designation: "PGT Physics",
      department: "Science",
      employeeId: `EMP-${rand}-01`,
    },
  });
  assert(createTeacher.status === 201, "Teacher created");
  const teacherId = createTeacher.data.user?.id || createTeacher.data.id;
  await request("/auth/invitation/redeem", {
    method: "POST",
    body: { token: createTeacher.data.invitation?.token, password: "TeacherPassword@2026" },
  });
  const teacherLogin = await request("/auth/login", {
    method: "POST",
    body: { email: `teacher${rand}@apexlib.edu`, password: "TeacherPassword@2026" },
  });
  assert(teacherLogin.status === 200, "Teacher logged in");
  const teacherToken = teacherLogin.data.accessToken;

  // Class Section for Student
  const classSecRes = await request("/timetable/class-sections", {
    method: "POST",
    token: tokenA,
    body: {
      className: "Class 10",
      section: "A",
      room: "Room 101",
      academicYear: "2026-2027",
    },
  });
  assert(classSecRes.status === 201, "Class 10-A created");
  const classSectionId = classSecRes.data.id;

  // Enroll Student & Parent
  const enrolRes = await request("/students", {
    method: "POST",
    token: tokenA,
    body: {
      fullName: `Rohan Verma ${rand}`,
      admissionNumber: `ADM-${rand}-001`,
      gradeLevel: "Class 10",
      section: "A",
      classSectionId,
      parentName: `Vikram Verma ${rand}`,
      parentEmail: `parent${rand}@family.io`,
      parentPhone: "+91 9876543210",
      parentRelationship: "FATHER",
      enableStudentPortalLogin: true,
      studentEmail: `rohan${rand}@student.io`,
      studentPassword: "StudentPassword@2026",
    },
  });
  assert(enrolRes.status === 201, "Student enrolled with portal credentials");
  const student = enrolRes.data.student || enrolRes.data;
  const studentId = student.id;

  // Student Login
  const studentLogin = await request("/auth/login", {
    method: "POST",
    body: { email: `rohan${rand}@student.io`, password: "StudentPassword@2026" },
  });
  assert(studentLogin.status === 200 && studentLogin.data.accessToken, "Student logged into portal");
  const studentToken = studentLogin.data.accessToken;

  // Parent Password Redemption & Login
  const parentInvToken = enrolRes.data.parentInvitationUrl
    ? enrolRes.data.parentInvitationUrl.split("token=")[1]
    : enrolRes.data.parentInvitationToken;
  if (parentInvToken) {
    await request("/auth/invitation/redeem", {
      method: "POST",
      body: { token: parentInvToken, password: "ParentPassword@2026" },
    });
  }
  const parentLogin = await request("/auth/login", {
    method: "POST",
    body: { email: `parent${rand}@family.io`, password: "ParentPassword@2026" },
  });
  assert(parentLogin.status === 200 && parentLogin.data.accessToken, "Parent logged into portal");
  const parentToken = parentLogin.data.accessToken;

  // 4. Configure Library Settings
  console.log("\nStep 4: Configuring Library Circulation Settings...");
  const updateSettings = await request("/library/settings", {
    method: "PATCH",
    token: tokenA,
    body: {
      maxBooksPerStudent: 2,
      maxBooksPerStaff: 5,
      loanPeriodDays: 14,
      renewalLimit: 1,
      finePerDay: 10,
      isFineEnabled: true,
    },
  });
  assert(updateSettings.status === 200, "Library circulation policy updated");
  assert(updateSettings.data.maxBooksPerStudent === 2, "maxBooksPerStudent = 2");
  assert(Number(updateSettings.data.finePerDay) === 10, "finePerDay = ₹10/day");

  const getSettings = await request("/library/settings", {
    method: "GET",
    token: libToken,
  });
  assert(
    getSettings.status === 200 &&
      (getSettings.data.renewalLimit === 1 || getSettings.data.maxRenewals === 1),
    "Librarian fetched library settings"
  );

  // 5. Book Catalogue Management (Books & Physical Copies)
  console.log("\nStep 5: Book Catalogue Management (Books & Copies)...");
  const createBook1 = await request("/library/books", {
    method: "POST",
    token: libToken,
    body: {
      title: "Principles of Quantum Mechanics",
      author: "P. A. M. Dirac",
      isbn: `978-0198520115-${rand}`,
      category: "Science",
      publisher: "Oxford University Press",
      edition: "4th Edition",
      locationRack: "Shelf S-04",
      initialCopies: 3,
    },
  });
  assert(createBook1.status === 201, "Book 1 created with 3 initial copies");
  const book1 = createBook1.data;
  assert(book1.totalCopies === 3, "Book 1 totalCopies === 3");
  assert(book1.availableCopies === 3, "Book 1 availableCopies === 3");
  assert(book1.copies.length === 3, "3 physical copy barcodes auto-generated");

  const createBook2 = await request("/library/books", {
    method: "POST",
    token: libToken,
    body: {
      title: "Clean Code",
      author: "Robert C. Martin",
      isbn: `978-0132350884-${rand}`,
      category: "Computer Science",
      publisher: "Prentice Hall",
      edition: "1st Edition",
      locationRack: "Shelf CS-01",
      initialCopies: 1,
    },
  });
  assert(createBook2.status === 201, "Book 2 created with 1 copy");
  const book2 = createBook2.data;

  // Update book
  const updateBook = await request(`/library/books/${book1.id}`, {
    method: "PATCH",
    token: libToken,
    body: { locationRack: "Shelf S-06" },
  });
  assert(
    updateBook.status === 200 &&
      (updateBook.data.locationRack === "Shelf S-06" || updateBook.data.shelfLocation === "Shelf S-06"),
    "Book 1 shelf rack updated"
  );

  // Filter books by category
  const listCat = await request("/library/books?category=Science", {
    method: "GET",
    token: libToken,
  });
  const booksList = listCat.data?.books || listCat.data?.data || (Array.isArray(listCat.data) ? listCat.data : []);
  assert(listCat.status === 200, "Books filtered by category Science");
  assert(booksList.length >= 1, "Category filter returned correct books");

  // 6. Book Issue, Duplicate Prevention & Safe Inventory
  console.log("\nStep 6: Circulation - Book Issue, Duplicate Prevention & Inventory Safe Constraints...");
  const copy1 = book1.copies[0];
  const copy2 = book1.copies[1];

  const issue1 = await request("/library/issues", {
    method: "POST",
    token: libToken,
    body: {
      bookId: book1.id,
      bookCopyId: copy1.id,
      borrowerType: "STUDENT",
      studentId: studentId,
      remarks: "Borrowed for research paper",
    },
  });
  assert(issue1.status === 201, "Copy 1 issued to student successfully");
  const issueRecord1 = issue1.data;
  assert(issueRecord1.status === "ISSUED", "Issue record status === ISSUED");
  assert(issueRecord1.bookCopy?.status === "ISSUED", "Book copy status marked ISSUED");

  // Verify stock safely decremented
  const checkBook1 = await request(`/library/books/${book1.id}`, {
    method: "GET",
    token: libToken,
  });
  assert(checkBook1.data.availableCopies === 2, "Available copies safely decremented from 3 to 2");

  // Rule 3: Prevent duplicate active issue of the exact same copy
  const dupIssue = await request("/library/issues", {
    method: "POST",
    token: libToken,
    body: {
      bookCopyId: copy1.id,
      borrowerType: "STUDENT",
      studentId: studentId,
    },
  });
  assert(dupIssue.status === 400, "Rule 3: Prevented duplicate active issue of the same copy (400 Bad Request)");

  // Issue copy 2 to student (within quota of 2)
  const issue2 = await request("/library/issues", {
    method: "POST",
    token: libToken,
    body: {
      bookId: book1.id,
      bookCopyId: copy2.id,
      borrowerType: "STUDENT",
      studentId: studentId,
    },
  });
  assert(issue2.status === 201, "Copy 2 issued to student (student now holds 2 active books)");

  // Attempt third book issue to student (exceeds max quota of 2)
  const copy3 = book1.copies[2];
  const quotaExceededIssue = await request("/library/issues", {
    method: "POST",
    token: libToken,
    body: {
      bookId: book1.id,
      bookCopyId: copy3.id,
      borrowerType: "STUDENT",
      studentId: studentId,
    },
  });
  assert(quotaExceededIssue.status === 400, "Quota check prevented student exceeding maxBooksPerStudent limit (400)");

  // 7. Issue Book to Staff Member
  console.log("\nStep 7: Issue Book to Staff Member...");
  const issueStaff = await request("/library/issues", {
    method: "POST",
    token: libToken,
    body: {
      bookId: book1.id,
      bookCopyId: copy3.id,
      borrowerType: "STAFF",
      staffUserId: teacherId,
    },
  });
  assert(issueStaff.status === 201, "Copy 3 issued to teacher");

  // 8. Book Renewal and Limits
  console.log("\nStep 8: Book Renewal & Quota Limits...");
  const renew1 = await request(`/library/issues/${issueRecord1.id}/renew`, {
    method: "POST",
    token: libToken,
  });
  assert(renew1.status === 200, "Book loan renewed");
  assert(renew1.data.renewalCount === 1, "renewalCount incremented to 1");

  // Attempt second renewal (renewalLimit is 1)
  const renewLimitExceeded = await request(`/library/issues/${issueRecord1.id}/renew`, {
    method: "POST",
    token: libToken,
  });
  assert(renewLimitExceeded.status === 400, "Renewal limit check prevented renewing beyond renewalLimit of 1");

  // 9. Book Return & Inventory Restoration
  console.log("\nStep 9: Book Return & Safe Inventory Restoration...");
  const returnRes = await request(`/library/issues/${issueRecord1.id}/return`, {
    method: "POST",
    token: libToken,
    body: { conditionNote: "Returned intact" },
  });
  assert(returnRes.status === 200, "Book returned successfully");
  assert(returnRes.data.status === "RETURNED", "Issue marked RETURNED");
  assert(returnRes.data.bookCopy?.status === "AVAILABLE", "Book copy marked AVAILABLE");

  const checkBookAfterReturn = await request(`/library/books/${book1.id}`, {
    method: "GET",
    token: libToken,
  });
  assert(checkBookAfterReturn.data.availableCopies === 1, "Available copies safely incremented after return");

  // 10. Late Return Fines & Audited Fee Adjustment (Rule 4)
  console.log("\nStep 10: Configurable Late Fines & Audited Fee Adjustment (Rule 4)...");
  // Assign Fee Plan to Student for ledger target
  const feeHeadRes = await request("/fees/heads", {
    method: "POST",
    token: tokenA,
    body: { name: `Annual Tuition ${rand}`, code: `ATU-${rand}` },
  });
  const feePlanRes = await request("/fees/plans", {
    method: "POST",
    token: tokenA,
    body: {
      name: `Class 10 Fee Schedule ${rand}`,
      academicYear: "2026-2027",
      applicableGrade: "Class 10",
      items: [{ feeHeadId: feeHeadRes.data.id, amount: 25000 }],
    },
  });
  const assignFeeRes = await request("/fees/assign", {
    method: "POST",
    token: tokenA,
    body: {
      studentId,
      feePlanId: feePlanRes.data.id,
      academicYear: "2026-2027",
    },
  });
  assert(assignFeeRes.status === 201, "Fee plan assigned to student");
  const studentFeePlanId = assignFeeRes.data.id;

  // Issue Book 2 with past due date (simulate 5 days overdue)
  const pastDueDate = new Date();
  pastDueDate.setDate(pastDueDate.getDate() - 5);

  const overdueIssueRes = await request("/library/issues", {
    method: "POST",
    token: libToken,
    body: {
      bookId: book2.id,
      bookCopyId: book2.copies[0].id,
      borrowerType: "STUDENT",
      studentId: studentId,
      dueDate: pastDueDate.toISOString(),
    },
  });
  assert(overdueIssueRes.status === 201, "Issued book with backdated due date for fine calculation");
  const overdueIssueId = overdueIssueRes.data.id;

  // Return overdue book: fine calculation is 5 days * ₹10/day = ₹50
  const returnOverdueRes = await request(`/library/issues/${overdueIssueId}/return`, {
    method: "POST",
    token: libToken,
  });
  assert(returnOverdueRes.status === 200, "Overdue book returned");
  assert(Number(returnOverdueRes.data.fineAmount) >= 50, `Calculated late fine is ₹${returnOverdueRes.data.fineAmount}`);
  assert(returnOverdueRes.data.isFinePaid === false, "Rule 4 enforced: Fine is unpaid; fee ledger untouched automatically");

  // Verify Fee Ledger was NOT automatically modified
  const ledgerBefore = await request(`/fees/students/${studentId}/ledger`, {
    method: "GET",
    token: tokenA,
  });
  assert(Number(ledgerBefore.data.feePlans[0].paidAmount) === 0, "Fee ledger paidAmount untouched before audited adjustment");

  // Unauthorized role: Teacher cannot adjust library fine to fee
  const unauthorizedAdjust = await request(`/library/issues/${overdueIssueId}/adjust-to-fee`, {
    method: "POST",
    token: teacherToken,
    body: { studentFeePlanId, remarks: "Teacher attempt" },
  });
  assert(unauthorizedAdjust.status === 403, "Role authorization: Teacher forbidden from adjusting fine to fee (403)");

  // Authorized adjustment: School Admin
  const authorizedAdjust = await request(`/library/issues/${overdueIssueId}/adjust-to-fee`, {
    method: "POST",
    token: tokenA,
    body: {
      studentFeePlanId,
      remarks: "Overdue book fine adjusted to student tuition fee plan",
    },
  });
  assert(authorizedAdjust.status === 200, "School Admin adjusted fine into fee ledger with audit log");
  assert(authorizedAdjust.data.fineFeePaymentId !== null, "Created linked FeePayment record");
  assert(authorizedAdjust.data.isFinePaid === true, "Fine marked paid");

  // Prevent double adjustment
  const doubleAdjust = await request(`/library/issues/${overdueIssueId}/adjust-to-fee`, {
    method: "POST",
    token: tokenA,
    body: { studentFeePlanId },
  });
  assert(doubleAdjust.status === 400 || doubleAdjust.status === 409, "Prevented adjusting already settled fine");

  // 11. Student and Parent Library Views
  console.log("\nStep 11: Student & Parent Library Views...");
  const studentLoans = await request("/library/student/my-loans", {
    method: "GET",
    token: studentToken,
  });
  assert(studentLoans.status === 200, "Student retrieved active and past book loans");
  assert(studentLoans.data.length >= 2, "Student has history of borrowed books");

  const parentLoans = await request("/library/parent/loans", {
    method: "GET",
    token: parentToken,
  });
  assert(parentLoans.status === 200, "Parent retrieved loans across linked children");
  assert(parentLoans.data.length >= 1, "Parent sees child loan overview");

  // 12. Comprehensive Reports Suite (6 Reports)
  console.log("\nStep 12: Comprehensive Reports Suite...");
  // Report 1: Library Inventory
  const repInventory = await request("/reports/library/inventory", {
    method: "GET",
    token: tokenA,
  });
  assert(repInventory.status === 200, "Report 1: Library Inventory fetched");
  assert(repInventory.data.totalTitles >= 2, "Report 1 totalTitles verified");

  // Report 2: Issued Books Log
  const repIssued = await request("/reports/library/issued?status=all", {
    method: "GET",
    token: tokenA,
  });
  assert(repIssued.status === 200, "Report 2: Issued Books Log fetched");
  assert(repIssued.data.totalCount >= 2, "Report 2 totalCount verified");

  // Report 3: Overdue Returns & Fines
  const repOverdue = await request("/reports/library/overdue", {
    method: "GET",
    token: tokenA,
  });
  assert(repOverdue.status === 200, "Report 3: Overdue Returns & Fines fetched");

  // Report 4: Student Attendance Summary
  await request("/attendance/students", {
    method: "POST",
    token: tokenA,
    body: {
      classSectionId,
      date: "2026-10-25",
      records: [{ studentId, status: "PRESENT" }],
    },
  });
  const repAttendance = await request("/reports/attendance/summary?gradeLevel=Class 10", {
    method: "GET",
    token: tokenA,
  });
  assert(repAttendance.status === 200, "Report 4: Student Attendance Summary fetched");
  assert(repAttendance.data.students.length >= 1, "Report 4 students included");

  // Report 5: Fee Dues & Collections Summary
  const repFees = await request("/reports/fees/summary?gradeLevel=Class 10", {
    method: "GET",
    token: tokenA,
  });
  assert(repFees.status === 200, "Report 5: Fee Dues & Collections fetched");
  assert(repFees.data.plans.length >= 1, "Report 5 plans included");

  // Report 6: Published Exam Results Summary
  const repExams = await request("/reports/exams/results", {
    method: "GET",
    token: tokenA,
  });
  assert(repExams.status === 200, "Report 6: Published Exam Results fetched");

  // 13. Tenant Isolation
  console.log("\nStep 13: Tenant Isolation Checks...");
  const crossBook = await request(`/library/books/${book1.id}`, {
    method: "GET",
    token: tokenB,
  });
  assert(crossBook.status === 404, "School B cannot access School A's book catalogue (404 Not Found)");

  const crossIssue = await request(`/library/issues/${issue2.data.id}/return`, {
    method: "POST",
    token: tokenB,
  });
  assert(crossIssue.status === 404, "School B cannot return School A's book issue (404 Not Found)");

  // 14. Module Entitlement Enforcement
  console.log("\nStep 14: Module Entitlement Enforcement...");
  // Disable library module in School A
  const disableModule = await request(`/schools/${schoolA.id}/modules`, {
    method: "PATCH",
    token: tokenA,
    body: { moduleKey: "library", enabled: false },
  });
  assert(disableModule.status === 200, "Library module disabled in School A");

  const libraryDisabled = await request("/library/books", {
    method: "GET",
    token: tokenA,
  });
  assert(libraryDisabled.status === 403, "Access to library blocked when module is disabled (403 Forbidden)");

  // Re-enable library module
  await request(`/schools/${schoolA.id}/modules`, {
    method: "PATCH",
    token: tokenA,
    body: { moduleKey: "library", enabled: true },
  });

  console.log("\n===============================================================================");
  console.log(`Phase 8 Test Results: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("===============================================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
