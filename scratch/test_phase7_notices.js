/**
 * Automated Test Suite — Phase 7: Notices & Notifications
 * Tests: Notice CRUD, Targeting by Role/Class/Section, Staff Permission Authorization,
 * Read/Unread Tracking, Expiry, Tenant Isolation, Module Entitlements & Audit Logging
 */

const BASE_URL = 'http://localhost:4000/api';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    testsPassed++;
  } else {
    console.error(`[FAIL] ${message}`);
    testsFailed++;
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return { status: res.status, data };
}

async function runPhase7Tests() {
  console.log('================================================================');
  console.log('SCHOOL ERP SAAS — PHASE 7: NOTICES & NOTIFICATIONS TEST SUITE');
  console.log('================================================================\n');

  try {
    // 1. Super Admin Authentication
    const saLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: 'alex.sterling@edusaas.io', password: 'SuperAdmin@2026' },
    });
    assert(saLogin.status === 200 && saLogin.data.accessToken, 'Super Admin login successful');
    const saToken = saLogin.data.accessToken;

    // 2. Register School A
    const schoolARand = Math.floor(1000 + Math.random() * 9000);
    const regA = await request('/schools', {
      method: 'POST',
      token: saToken,
      body: {
        name: `DPS Notice Academy ${schoolARand}`,
        slug: `dps-notice-${schoolARand}`,
        board: 'CBSE',
        city: 'New Delhi',
        state: 'Delhi',
        adminEmail: `admin${schoolARand}@dpsnotice.edu`,
        adminName: 'Principal Dr. Verma',
      },
    });
    assert(regA.status === 201 && regA.data.school, 'School A registered successfully');
    const schoolA = regA.data.school;
    const adminEmailA = regA.data.admin?.email || `admin${schoolARand}@dpsnotice.edu`;
    const invTokenA = regA.data.invitation.token;

    // Redeem School Admin password
    const redeemA = await request('/auth/invitation/redeem', {
      method: 'POST',
      body: { token: invTokenA, password: 'AdminPassword@2026' },
    });
    assert(redeemA.status === 200, 'School Admin redeemed password');

    const adminALogin = await request('/auth/login', {
      method: 'POST',
      body: { email: adminEmailA, password: 'AdminPassword@2026' },
    });
    assert(adminALogin.status === 200 && adminALogin.data.accessToken, 'School Admin logged in successfully');
    const adminAToken = adminALogin.data.accessToken;

    // Register School B (for Cross-Tenant Isolation Testing)
    const schoolBRand = Math.floor(1000 + Math.random() * 9000);
    const regB = await request('/schools', {
      method: 'POST',
      token: saToken,
      body: {
        name: `Cross-Tenant High ${schoolBRand}`,
        slug: `cross-tenant-${schoolBRand}`,
        board: 'ICSE',
        city: 'Mumbai',
        state: 'Maharashtra',
        adminEmail: `admin${schoolBRand}@crosstenant.edu`,
        adminName: 'Principal B',
      },
    });
    const schoolB = regB.data.school;
    const adminEmailB = regB.data.admin?.email || `admin${schoolBRand}@crosstenant.edu`;
    const redeemB = await request('/auth/invitation/redeem', {
      method: 'POST',
      body: { token: regB.data.invitation.token, password: 'AdminPassword@2026' },
    });
    const adminBLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: adminEmailB, password: 'AdminPassword@2026' },
    });
    const adminBToken = adminBLogin.data.accessToken;

    // 3. Create Teachers in School A
    // Teacher 1: Unauthorized by default
    const createT1 = await request('/users', {
      method: 'POST',
      token: adminAToken,
      body: {
        fullName: 'Mr. Arvind Sharma',
        email: `arvind${schoolARand}@dpsnotice.edu`,
        role: 'TEACHER',
        designation: 'Senior PGT Mathematics',
        department: 'Science & Mathematics',
        employeeId: `EMP-${schoolARand}-01`,
      },
    });
    assert(createT1.status === 201, 'Teacher 1 (Arvind Sharma) created');
    const t1User = createT1.data.user || createT1.data;
    const t1TokenRes = createT1.data.invitation?.token;
    await request('/auth/invitation/redeem', {
      method: 'POST',
      body: { token: t1TokenRes, password: 'TeacherPassword@2026' },
    });
    const t1Login = await request('/auth/login', {
      method: 'POST',
      body: { email: `arvind${schoolARand}@dpsnotice.edu`, password: 'TeacherPassword@2026' },
    });
    assert(t1Login.status === 200, 'Teacher 1 logged in successfully');
    const t1Token = t1Login.data.accessToken;

    // Teacher 2: Will be granted permission
    const createT2 = await request('/users', {
      method: 'POST',
      token: adminAToken,
      body: {
        fullName: 'Mrs. Rekha Sen',
        email: `rekha${schoolARand}@dpsnotice.edu`,
        role: 'TEACHER',
        designation: 'Activity Coordinator',
        department: 'Humanities',
        employeeId: `EMP-${schoolARand}-02`,
      },
    });
    assert(createT2.status === 201, 'Teacher 2 (Rekha Sen) created');
    const t2User = createT2.data.user || createT2.data;
    const t2TokenRes = createT2.data.invitation?.token;
    await request('/auth/invitation/redeem', {
      method: 'POST',
      body: { token: t2TokenRes, password: 'TeacherPassword@2026' },
    });
    const t2Login = await request('/auth/login', {
      method: 'POST',
      body: { email: `rekha${schoolARand}@dpsnotice.edu`, password: 'TeacherPassword@2026' },
    });
    const t2Token = t2Login.data.accessToken;

    // 4. Create Class Sections in School A (Class 8-A and Class 8-B)
    const sec8A = await request('/timetable/class-sections', {
      method: 'POST',
      token: adminAToken,
      body: {
        className: 'Class 8',
        section: 'A',
        room: 'Room 101',
        academicYear: '2026-2027',
        classTeacherId: t1User.id,
      },
    });
    assert(sec8A.status === 201, 'Class 8-A created');
    const class8AId = sec8A.data.id;

    const sec8B = await request('/timetable/class-sections', {
      method: 'POST',
      token: adminAToken,
      body: {
        className: 'Class 8',
        section: 'B',
        room: 'Room 102',
        academicYear: '2026-2027',
      },
    });
    assert(sec8B.status === 201, 'Class 8-B created');
    const class8BId = sec8B.data.id;

    // 5. Enroll Students & Parent in School A
    // Student 1 in Class 8-A
    const enrolS1 = await request('/students', {
      method: 'POST',
      token: adminAToken,
      body: {
        fullName: 'Kavya Sharma',
        admissionNumber: `ADM-${schoolARand}-001`,
        gradeLevel: 'Class 8',
        section: 'A',
        classSectionId: class8AId,
        dateOfBirth: '2012-05-15',
        gender: 'FEMALE',
        parentName: 'Ramesh Sharma',
        parentEmail: `parent${schoolARand}@family.io`,
        parentPhone: '+91 9833445566',
        enableStudentPortalLogin: true,
        studentEmail: `kavya${schoolARand}@student.io`,
        studentPassword: 'StudentPassword@2026',
      },
    });
    assert(enrolS1.status === 201, 'Student 1 (Kavya Sharma, Class 8-A) enrolled');
    const student1 = enrolS1.data;
    const parentInvToken = enrolS1.data.parentInvitationUrl
      ? enrolS1.data.parentInvitationUrl.split('token=')[1]
      : enrolS1.data.parentInvitationToken;

    // Student 2 in Class 8-B (Different class, test class-level targeting)
    const enrolS2 = await request('/students', {
      method: 'POST',
      token: adminAToken,
      body: {
        fullName: 'Rahul Bose',
        admissionNumber: `ADM-${schoolARand}-002`,
        gradeLevel: 'Class 8',
        section: 'B',
        classSectionId: class8BId,
        dateOfBirth: '2012-08-20',
        gender: 'MALE',
        parentName: 'Alok Bose',
        parentEmail: `alok${schoolARand}@bose.io`,
        enableStudentPortalLogin: true,
        studentEmail: `rahul${schoolARand}@student.io`,
        studentPassword: 'StudentPassword@2026',
      },
    });
    assert(enrolS2.status === 201, 'Student 2 (Rahul Bose, Class 8-B) enrolled');

    // Redeem Parent password
    const parentRedeem = await request('/auth/invitation/redeem', {
      method: 'POST',
      body: { token: parentInvToken, password: 'ParentPassword@2026' },
    });
    assert(parentRedeem.status === 200, 'Parent redeemed invitation token');
    const parentLogin = await request('/auth/login', {
      method: 'POST',
      body: { email: `parent${schoolARand}@family.io`, password: 'ParentPassword@2026' },
    });
    assert(parentLogin.status === 200, 'Parent logged in successfully');
    const parentToken = parentLogin.data.accessToken;

    const s1Login = await request('/auth/login', {
      method: 'POST',
      body: { email: `kavya${schoolARand}@student.io`, password: 'StudentPassword@2026' },
    });
    assert(s1Login.status === 200, 'Student 1 logged in successfully');
    const s1Token = s1Login.data.accessToken;

    const s2Login = await request('/auth/login', {
      method: 'POST',
      body: { email: `rahul${schoolARand}@student.io`, password: 'StudentPassword@2026' },
    });
    assert(s2Login.status === 200, 'Student 2 logged in successfully');
    const s2Token = s2Login.data.accessToken;

    // =========================================================================
    // TEST SECTION A: AUTHORIZATION & PERMISSIONS (Rule 2)
    // =========================================================================
    console.log('\n--- Test Section A: Authorization & Staff Permissions (Rule 2) ---');

    // 1. Unauthorized staff (Teacher 1) attempts to create notice -> 403 Forbidden
    const unauthCreate = await request('/notices', {
      method: 'POST',
      token: t1Token,
      body: {
        title: 'Unauthorized Announcement',
        message: 'This should be blocked',
      },
    });
    assert(unauthCreate.status === 403, 'Unauthorized teacher blocked from creating notice (403 Forbidden)');

    // 2. School Admin lists staff permissions
    const staffPerms = await request('/notices/staff/permissions', {
      token: adminAToken,
    });
    assert(staffPerms.status === 200 && Array.isArray(staffPerms.data), 'School Admin can list staff notice permissions');
    const t2InList = staffPerms.data.find((u) => u.id === t2User.id);
    assert(t2InList && t2InList.canManageNotices === false, 'Teacher 2 initially has canManageNotices = false');

    // 3. School Admin explicitly grants notice permission to Teacher 2
    const grantPerm = await request(`/notices/staff/${t2User.id}/permission`, {
      method: 'PATCH',
      token: adminAToken,
      body: { canManageNotices: true },
    });
    assert(grantPerm.status === 200 && grantPerm.data.canManageNotices === true, 'School Admin successfully granted notice permission to Teacher 2');

    // 4. Now authorized Teacher 2 creates notice -> 201 Created
    const teacherCreate = await request('/notices', {
      method: 'POST',
      token: t2Token,
      body: {
        title: 'Annual Sports Day Auditions',
        message: 'Track and field tryouts begin next Tuesday at 07:00 AM in the school stadium.',
        priority: 'HIGH',
        status: 'DRAFT',
        targetAudience: 'ALL',
      },
    });
    assert(teacherCreate.status === 201 && teacherCreate.data.id, 'Authorized Teacher 2 successfully created notice in DRAFT status');
    const sportsNoticeId = teacherCreate.data.id;

    // 5. Students & Parents blocked from creating notices -> 403 Forbidden
    const studentCreate = await request('/notices', {
      method: 'POST',
      token: s1Token,
      body: { title: 'Student Post', message: 'Hello' },
    });
    assert(studentCreate.status === 403, 'Students blocked from creating notices (403 Forbidden)');

    // =========================================================================
    // TEST SECTION B: TARGETING & CROSS-SCHOOL ISOLATION (Rule 3 & 6)
    // =========================================================================
    console.log('\n--- Test Section B: Targeting & Cross-School Isolation (Rule 3 & 6) ---');

    // 1. Cross-school classSection targeting blocked -> 404 Not Found
    const crossSchoolClass = await request('/notices', {
      method: 'POST',
      token: adminBToken,
      body: {
        title: 'Cross School Notice',
        message: 'Trying to reference School A classSectionId',
        classSectionId: class8AId,
      },
    });
    assert(crossSchoolClass.status === 404, 'Notice referencing classSection from another school rejected with 404 Not Found');

    // 2. School Admin creates General School Notice (Audience: ALL)
    const noticeAll = await request('/notices', {
      method: 'POST',
      token: adminAToken,
      body: {
        title: 'Founder Day Gala & Holiday',
        message: 'The school campus will remain closed on Friday for Founder Day celebrations.',
        priority: 'NORMAL',
        status: 'PUBLISHED',
        targetAudience: 'ALL',
      },
    });
    assert(noticeAll.status === 201 && noticeAll.data.status === 'PUBLISHED', 'General School Notice created and PUBLISHED');
    const noticeAllId = noticeAll.data.id;

    // 3. School Admin creates Staff-Only Notice (Audience: STAFF_ONLY)
    const noticeStaff = await request('/notices', {
      method: 'POST',
      token: adminAToken,
      body: {
        title: 'Academic Council Faculty Meeting',
        message: 'Staff meeting regarding mid-term syllabus completion in Board Room 1.',
        priority: 'HIGH',
        status: 'PUBLISHED',
        targetAudience: 'STAFF_ONLY',
      },
    });
    assert(noticeStaff.status === 201, 'Staff-Only Notice created');
    const noticeStaffId = noticeStaff.data.id;

    // 4. School Admin creates Class-Specific Notice for Class 8-A (Audience: CLASS_SECTION)
    const notice8A = await request('/notices', {
      method: 'POST',
      token: adminAToken,
      body: {
        title: 'Class 8-A Science Practical Kit Submission',
        message: 'All students of Class 8-A must submit optics kits to Lab 2 by Thursday.',
        priority: 'NORMAL',
        status: 'PUBLISHED',
        targetAudience: 'CLASS_SECTION',
        classSectionId: class8AId,
      },
    });
    assert(notice8A.status === 201, 'Class 8-A specific notice created');
    const notice8AId = notice8A.data.id;

    // 5. Verify recipient visibility
    // Teacher sees ALL and STAFF_ONLY notices
    const teacherList = await request('/notices', { token: t1Token });
    assert(teacherList.status === 200, 'Teacher retrieved notice feed');
    const teacherNoticeIds = teacherList.data.map((n) => n.id);
    assert(teacherNoticeIds.includes(noticeAllId), 'Teacher sees General notice');
    assert(teacherNoticeIds.includes(noticeStaffId), 'Teacher sees Staff-Only notice');

    // Student 1 (Class 8-A) sees General notice and Class 8-A notice, but NOT Staff notice
    const s1List = await request('/notices', { token: s1Token });
    assert(s1List.status === 200, 'Student 1 retrieved notice feed');
    const s1NoticeIds = s1List.data.map((n) => n.id);
    assert(s1NoticeIds.includes(noticeAllId), 'Student 1 sees General notice');
    assert(s1NoticeIds.includes(notice8AId), 'Student 1 sees Class 8-A specific notice');
    assert(!s1NoticeIds.includes(noticeStaffId), 'Student 1 strictly excluded from Staff-Only notice');

    // Student 2 (Class 8-B) sees General notice, but NOT Class 8-A notice or Staff notice
    const s2List = await request('/notices', { token: s2Token });
    assert(s2List.status === 200, 'Student 2 retrieved notice feed');
    const s2NoticeIds = s2List.data.map((n) => n.id);
    assert(s2NoticeIds.includes(noticeAllId), 'Student 2 sees General notice');
    assert(!s2NoticeIds.includes(notice8AId), 'Student 2 (Class 8-B) strictly excluded from Class 8-A notice');
    assert(!s2NoticeIds.includes(noticeStaffId), 'Student 2 strictly excluded from Staff notice');

    // Parent sees General notice and linked ward Class 8-A notice, but NOT Staff notice
    const parentList = await request('/notices', { token: parentToken });
    assert(parentList.status === 200, 'Parent retrieved notice feed');
    const parentNoticeIds = parentList.data.map((n) => n.id);
    assert(parentNoticeIds.includes(noticeAllId), 'Parent sees General notice');
    assert(parentNoticeIds.includes(notice8AId), 'Parent sees linked child Class 8-A notice');
    assert(!parentNoticeIds.includes(noticeStaffId), 'Parent strictly excluded from Staff notice');

    // =========================================================================
    // TEST SECTION C: READ/UNREAD TRACKING & LIFECYCLE (Rule 1 & 5)
    // =========================================================================
    console.log('\n--- Test Section C: Read/Unread Tracking & Lifecycle (Rule 1 & 5) ---');

    // 1. Initial unread count for Student 1
    const unreadBefore = await request('/notices/unread-count', { token: s1Token });
    assert(unreadBefore.status === 200 && unreadBefore.data.unreadCount >= 2, `Student 1 has unread count (${unreadBefore.data.unreadCount})`);
    const initialCount = unreadBefore.data.unreadCount;

    // 2. Student 1 opens single notice (auto mark-as-read)
    const readNotice = await request(`/notices/${notice8AId}`, { token: s1Token });
    assert(readNotice.status === 200 && readNotice.data.isRead === true, 'Student 1 opened notice; marked as isRead = true');

    // 3. Verify unread count decremented by 1
    const unreadAfter = await request('/notices/unread-count', { token: s1Token });
    assert(unreadAfter.status === 200 && unreadAfter.data.unreadCount === initialCount - 1, 'Unread count successfully decremented');

    // 4. Manual mark-as-read endpoint
    const manualRead = await request(`/notices/${noticeAllId}/read`, {
      method: 'POST',
      token: s1Token,
    });
    assert(manualRead.status === 200, 'Manual mark-as-read endpoint returned 200 OK');

    const unreadAfter2 = await request('/notices/unread-count', { token: s1Token });
    assert(unreadAfter2.data.unreadCount === initialCount - 2, 'Unread count decremented again after manual read');

    // 5. Publication Lifecycle: DRAFT notice cannot be viewed by Student
    const draftNotice = await request('/notices', {
      method: 'POST',
      token: adminAToken,
      body: {
        title: 'Confidential Exam Schedule',
        message: 'Draft schedule under teacher review.',
        status: 'DRAFT',
      },
    });
    const draftId = draftNotice.data.id;

    const studentDraftView = await request(`/notices/${draftId}`, { token: s1Token });
    assert(studentDraftView.status === 403, 'Student blocked from viewing DRAFT notice (403 Forbidden)');

    // School Admin publishes the draft notice
    const pubRes = await request(`/notices/${draftId}/publish`, {
      method: 'POST',
      token: adminAToken,
    });
    assert(pubRes.status === 200 && pubRes.data.status === 'PUBLISHED', 'School Admin successfully published DRAFT notice');

    // Now student can view it
    const studentPubView = await request(`/notices/${draftId}`, { token: s1Token });
    assert(studentPubView.status === 200, 'Student can view notice once PUBLISHED');

    // 6. Expiry Logic: Notice with past expiry date
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const expiredNotice = await request('/notices', {
      method: 'POST',
      token: adminAToken,
      body: {
        title: 'Yesterday Book Fair Flash Sale',
        message: 'This event expired yesterday.',
        status: 'PUBLISHED',
        expiryDate: pastDate,
      },
    });
    assert(expiredNotice.status === 201, 'Notice with past expiry date created');
    const expiredId = expiredNotice.data.id;

    // In student feed, expired notice is excluded
    const studentFeedCheck = await request('/notices', { token: s1Token });
    const feedIds = studentFeedCheck.data.map((n) => n.id);
    assert(!feedIds.includes(expiredId), 'Expired notice is filtered out from student active feed');

    // In admin list, notice is present and computedStatus is EXPIRED
    const adminCheck = await request(`/notices/${expiredId}`, { token: adminAToken });
    assert(adminCheck.status === 200 && adminCheck.data.computedStatus === 'EXPIRED', 'Admin sees computedStatus = EXPIRED for past expiry notice');

    // =========================================================================
    // TEST SECTION D: MODULE ENTITLEMENT & TENANT SECURITY (Rule 6 & 7)
    // =========================================================================
    console.log('\n--- Test Section D: Module Entitlement & Cross-Tenant Security (Rule 6 & 7) ---');

    // 1. Cross-school notice access blocked -> 404 Not Found
    const crossSchoolNotice = await request(`/notices/${noticeAllId}`, {
      token: adminBToken,
    });
    assert(crossSchoolNotice.status === 404, 'Cross-school notice access blocked with 404 Not Found');

    // 2. Disable 'notices' module for School A
    const disableMod = await request(`/schools/${schoolA.id}/modules`, {
      method: 'PATCH',
      token: adminAToken,
      body: { moduleKey: 'notices', isEnabled: false },
    });
    assert(disableMod.status === 200, "Successfully toggled 'notices' module to disabled");

    // Notice endpoints now blocked with 403 Forbidden
    const blockedList = await request('/notices', { token: adminAToken });
    assert(blockedList.status === 403, 'Notices API blocked with 403 Forbidden when module is disabled');

    const blockedCreate = await request('/notices', {
      method: 'POST',
      token: adminAToken,
      body: { title: 'Test Blocked', message: 'Test' },
    });
    assert(blockedCreate.status === 403, 'Notice creation blocked with 403 Forbidden when module is disabled');

    // Re-enable 'notices' module
    const enableMod = await request(`/schools/${schoolA.id}/modules`, {
      method: 'PATCH',
      token: adminAToken,
      body: { moduleKey: 'notices', isEnabled: true },
    });
    assert(enableMod.status === 200, "Successfully re-enabled 'notices' module");

    const restoredList = await request('/notices', { token: adminAToken });
    assert(restoredList.status === 200, 'Notices API access restored after re-enabling module');

    // =========================================================================
    // TEST SECTION E: AUDIT LOG VERIFICATION (Rule 8)
    // =========================================================================
    console.log('\n--- Test Section E: Audit Log Trail (Rule 8) ---');
    const path = require('path');
    const { PrismaClient } = require(path.resolve(__dirname, '../saas-backend/node_modules/@prisma/client'));
    const prisma = new PrismaClient();

    const noticeCreatedLogs = await prisma.auditLog.count({
      where: { schoolId: schoolA.id, action: 'NOTICE_CREATED' },
    });
    assert(noticeCreatedLogs >= 3, `Audit logs recorded for NOTICE_CREATED (${noticeCreatedLogs} logs)`);

    const noticePubLogs = await prisma.auditLog.count({
      where: { schoolId: schoolA.id, action: 'NOTICE_PUBLISHED' },
    });
    assert(noticePubLogs >= 1, `Audit logs recorded for NOTICE_PUBLISHED (${noticePubLogs} logs)`);

    const permChangeLogs = await prisma.auditLog.count({
      where: { schoolId: schoolA.id, action: 'NOTICE_PERMISSION_CHANGED' },
    });
    assert(permChangeLogs >= 1, `Audit logs recorded for NOTICE_PERMISSION_CHANGED (${permChangeLogs} logs)`);

    await prisma.$disconnect();

    console.log('\n----------------------------------------------------------------');
    console.log(`PHASE 7 TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log('----------------------------------------------------------------\n');

    if (testsFailed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test suite encountered an uncaught error:', err);
    process.exit(1);
  }
}

runPhase7Tests();
