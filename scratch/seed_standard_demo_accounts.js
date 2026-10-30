const { PrismaClient, UserRole, SchoolStatus, SubscriptionPlan } = require('../saas-backend/node_modules/@prisma/client');
const bcrypt = require('../saas-backend/node_modules/bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding standard demo accounts across all 7 ERP roles...");

  // 1. Password Hash (Admin@12345 for all school demo accounts)
  const defaultPasswordHash = await bcrypt.hash("Admin@12345", 12);
  const superAdminPasswordHash = await bcrypt.hash("SuperAdmin@2026", 12);

  // 2. Ensure Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: "alex.sterling@edusaas.io" },
    update: {
      fullName: "Alex Sterling (Super Admin)",
      passwordHash: superAdminPasswordHash,
      isActive: true,
      role: UserRole.SUPER_ADMIN,
    },
    create: {
      email: "alex.sterling@edusaas.io",
      fullName: "Alex Sterling (Super Admin)",
      role: UserRole.SUPER_ADMIN,
      passwordHash: superAdminPasswordHash,
      isActive: true,
    },
  });
  console.log("✅ Super Admin verified:", superAdmin.email);

  // 3. Ensure Demo School Tenant: Apex International Academy
  const school = await prisma.school.upsert({
    where: { slug: "apex-academy" },
    update: {
      name: "Apex International Academy",
      legalName: "Apex Educational Foundation Ltd.",
      status: SchoolStatus.ACTIVE,
      plan: SubscriptionPlan.ENTERPRISE,
      board: "CBSE",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      timezone: "Asia/Kolkata",
      currency: "INR",
      maxStudents: 5000,
      maxStaff: 500,
    },
    create: {
      name: "Apex International Academy",
      legalName: "Apex Educational Foundation Ltd.",
      schoolCode: "APX-101",
      slug: "apex-academy",
      status: SchoolStatus.ACTIVE,
      plan: SubscriptionPlan.ENTERPRISE,
      board: "CBSE",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      timezone: "Asia/Kolkata",
      currency: "INR",
      maxStudents: 5000,
      maxStaff: 500,
      storageLimitMb: 50000,
      allowStudentUploads: true,
      allowParentUploads: true,
      allowStaffUploads: true,
    },
  });
  console.log("✅ Demo School verified:", school.name, `(${school.id})`);

  // 4. Ensure all 14 Modules are enabled for Demo School
  const moduleKeys = [
    "students", "teachers", "attendance", "timetable", "exams",
    "fees", "notices", "library", "reports", "homework",
    "transport", "hostel", "inventory", "admissions"
  ];

  for (const moduleKey of moduleKeys) {
    await prisma.schoolModule.upsert({
      where: {
        schoolId_moduleKey: {
          schoolId: school.id,
          moduleKey,
        },
      },
      update: { isEnabled: true },
      create: {
        schoolId: school.id,
        moduleKey,
        isEnabled: true,
      },
    });
  }
  console.log("✅ All 14 modules enabled for demo school.");

  // 5. School Admin User
  const schoolAdmin = await prisma.user.upsert({
    where: { email: "admin@apex.edu" },
    update: {
      fullName: "Dr. Alok Verma (Principal)",
      role: UserRole.SCHOOL_ADMIN,
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
      isActive: true,
      employeeId: "APX-ADM-001",
    },
    create: {
      email: "admin@apex.edu",
      fullName: "Dr. Alok Verma (Principal)",
      role: UserRole.SCHOOL_ADMIN,
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
      isActive: true,
      employeeId: "APX-ADM-001",
      designation: "Principal & School Admin",
      department: "Administration",
    },
  });
  console.log("✅ School Admin verified:", schoolAdmin.email);

  // 6. Accountant User
  const accountant = await prisma.user.upsert({
    where: { email: "accountant@apex.edu" },
    update: {
      fullName: "Ramesh Sharma (Senior Bursar)",
      role: UserRole.ACCOUNTANT,
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
      isActive: true,
      employeeId: "APX-ACC-001",
    },
    create: {
      email: "accountant@apex.edu",
      fullName: "Ramesh Sharma (Senior Bursar)",
      role: UserRole.ACCOUNTANT,
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
      isActive: true,
      employeeId: "APX-ACC-001",
      designation: "Chief Accountant",
      department: "Accounts & Finance",
    },
  });
  console.log("✅ Accountant verified:", accountant.email);

  // 7. Teacher User
  const teacher = await prisma.user.upsert({
    where: { email: "teacher@apex.edu" },
    update: {
      fullName: "Sunita Kapoor (Senior Math Faculty)",
      role: UserRole.TEACHER,
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
      isActive: true,
      employeeId: "APX-TCH-001",
    },
    create: {
      email: "teacher@apex.edu",
      fullName: "Sunita Kapoor (Senior Math Faculty)",
      role: UserRole.TEACHER,
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
      isActive: true,
      employeeId: "APX-TCH-001",
      designation: "Head of Mathematics",
      department: "Academics",
    },
  });
  console.log("✅ Teacher verified:", teacher.email);

  // 8. Librarian User
  const librarian = await prisma.user.upsert({
    where: { email: "librarian@apex.edu" },
    update: {
      fullName: "Meenakshi Sundaram (Chief Librarian)",
      role: UserRole.LIBRARIAN,
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
      isActive: true,
      employeeId: "APX-LIB-001",
    },
    create: {
      email: "librarian@apex.edu",
      fullName: "Meenakshi Sundaram (Chief Librarian)",
      role: UserRole.LIBRARIAN,
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
      isActive: true,
      employeeId: "APX-LIB-001",
      designation: "Head Librarian",
      department: "Library & Information",
    },
  });
  console.log("✅ Librarian verified:", librarian.email);

  // 9. Parent User
  const parent = await prisma.user.upsert({
    where: { email: "parent@apex.edu" },
    update: {
      fullName: "Vikram Malhotra (Guardian)",
      role: UserRole.PARENT,
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
      isActive: true,
    },
    create: {
      email: "parent@apex.edu",
      fullName: "Vikram Malhotra (Guardian)",
      role: UserRole.PARENT,
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
      isActive: true,
      phone: "+91 98765 43210",
    },
  });
  console.log("✅ Parent verified:", parent.email);

  // 10. Student User
  const studentUser = await prisma.user.upsert({
    where: { email: "student@apex.edu" },
    update: {
      fullName: "Aarav Malhotra (Student)",
      role: UserRole.STUDENT,
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
      isActive: true,
    },
    create: {
      email: "student@apex.edu",
      fullName: "Aarav Malhotra (Student)",
      role: UserRole.STUDENT,
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
      isActive: true,
    },
  });
  console.log("✅ Student User verified:", studentUser.email);

  // 11. Class Section: Grade 10 - Section A
  let classSection = await prisma.classSection.findFirst({
    where: {
      schoolId: school.id,
      className: "Grade 10",
      section: "A",
    },
  });

  if (!classSection) {
    classSection = await prisma.classSection.create({
      data: {
        schoolId: school.id,
        className: "Grade 10",
        section: "A",
        room: "Room 101",
        academicYear: "2026-2027",
        classTeacherId: teacher.id,
      },
    });
  }
  console.log("✅ Class Section verified:", classSection.className, classSection.section);

  // 12. Student Profile linked to Student User & Parent
  let studentProfile = await prisma.student.findFirst({
    where: {
      schoolId: school.id,
      admissionNumber: "APX-ADM-2026-0001",
    },
  });

  if (!studentProfile) {
    studentProfile = await prisma.student.create({
      data: {
        schoolId: school.id,
        admissionNumber: "APX-ADM-2026-0001",
        fullName: "Aarav Malhotra",
        dateOfBirth: new Date("2010-05-15"),
        gender: "MALE",
        gradeLevel: "Grade 10",
        section: "A",
        rollNumber: "01",
        academicYear: "2026-2027",
        address: "42 Park Avenue, New Delhi",
        hasStudentPortalAccess: true,
        studentUserId: studentUser.id,
        classSectionId: classSection.id,
      },
    });
  } else {
    await prisma.student.update({
      where: { id: studentProfile.id },
      data: {
        studentUserId: studentUser.id,
        classSectionId: classSection.id,
      },
    });
  }
  console.log("✅ Student Profile verified:", studentProfile.fullName, `(${studentProfile.admissionNumber})`);

  // 13. Parent-Student Relationship Link
  const parentStudentLink = await prisma.parentStudent.findFirst({
    where: {
      parentId: parent.id,
      studentId: studentProfile.id,
    },
  });

  if (!parentStudentLink) {
    await prisma.parentStudent.create({
      data: {
        parentId: parent.id,
        studentId: studentProfile.id,
        relationship: "FATHER",
        isPrimary: true,
      },
    });
  }
  console.log("✅ Parent-Student linkage verified: Father of", studentProfile.fullName);

  // 14. Library Policy & Sample Books
  await prisma.librarySetting.upsert({
    where: { schoolId: school.id },
    update: {
      maxBooksPerStudent: 5,
      maxBooksPerStaff: 10,
      defaultLoanDays: 14,
      maxRenewals: 2,
      finePerDay: 5,
    },
    create: {
      schoolId: school.id,
      maxBooksPerStudent: 5,
      maxBooksPerStaff: 10,
      defaultLoanDays: 14,
      maxRenewals: 2,
      finePerDay: 5,
    },
  });

  const sampleBook = await prisma.book.upsert({
    where: {
      schoolId_isbn: {
        schoolId: school.id,
        isbn: "978-0132350884",
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      title: "Clean Code: A Handbook of Agile Software Craftsmanship",
      author: "Robert C. Martin",
      isbn: "978-0132350884",
      category: "Computer Science",
      publisher: "Prentice Hall",
      shelfLocation: "Rack CS-04",
      totalCopies: 5,
      availableCopies: 5,
    },
  });

  // Ensure copies for sample book
  const existingCopies = await prisma.bookCopy.count({
    where: { bookId: sampleBook.id },
  });
  if (existingCopies === 0) {
    for (let i = 1; i <= 5; i++) {
      const barcode = `LIB-9780132350884-${i.toString().padStart(3, "0")}`;
      await prisma.bookCopy.create({
        data: {
          schoolId: school.id,
          bookId: sampleBook.id,
          barcode,
          copyNumber: i,
          status: "AVAILABLE",
        },
      });
    }
  }
  console.log("✅ Library Catalog & Policy initialized with sample book:", sampleBook.title);

  console.log("\n===============================================================================");
  console.log("DEMO ACCOUNTS READY FOR MANUAL TESTING (Password: Admin@12345, SuperAdmin@2026)");
  console.log("===============================================================================");
  console.log("1. SUPER ADMIN   : alex.sterling@edusaas.io  | SuperAdmin@2026  -> /super-admin");
  console.log("2. SCHOOL ADMIN  : admin@apex.edu            | Admin@12345      -> /school-admin");
  console.log("3. ACCOUNTANT    : accountant@apex.edu       | Admin@12345      -> /accountant");
  console.log("4. TEACHER       : teacher@apex.edu          | Admin@12345      -> /teacher");
  console.log("5. LIBRARIAN     : librarian@apex.edu        | Admin@12345      -> /library");
  console.log("6. PARENT        : parent@apex.edu           | Admin@12345      -> /parent");
  console.log("7. STUDENT       : student@apex.edu          | Admin@12345      -> /student");
  console.log("===============================================================================\n");
}

seed()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
