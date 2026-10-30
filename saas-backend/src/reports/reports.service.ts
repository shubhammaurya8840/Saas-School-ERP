import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FeesService } from "../fees/fees.service";
import { ExamsService } from "../exams/exams.service";
import { AttendanceService } from "../attendance/attendance.service";
import { LibraryService } from "../library/library.service";
import { BookIssueStatus, BookCopyStatus, Prisma } from "@prisma/client";

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly feesService: FeesService,
    private readonly examsService: ExamsService,
    private readonly attendanceService: AttendanceService,
    private readonly libraryService: LibraryService
  ) {}

  // =========================================================================
  // HELPER: MODULE ENTITLEMENT CHECKS
  // =========================================================================

  private async assertModuleEnabled(schoolId: string, moduleKey: string) {
    const mod = await this.prisma.schoolModule.findUnique({
      where: { schoolId_moduleKey: { schoolId, moduleKey } },
    });
    if (mod && !mod.isEnabled) {
      throw new ForbiddenException(`${moduleKey} module is disabled for this school`);
    }
  }

  // =========================================================================
  // 1. LIBRARY INVENTORY REPORT
  // =========================================================================

  async getLibraryInventoryReport(schoolId: string, category?: string) {
    await this.assertModuleEnabled(schoolId, "reports");
    await this.assertModuleEnabled(schoolId, "library");

    const where: Prisma.BookWhereInput = {
      schoolId,
      ...(category && category !== "all" && {
        category: { equals: category, mode: "insensitive" },
      }),
    };

    const books = await this.prisma.book.findMany({
      where,
      include: {
        copies: {
          select: {
            id: true,
            copyNumber: true,
            barcode: true,
            status: true,
            condition: true,
          },
        },
        _count: {
          select: {
            issues: {
              where: {
                status: { in: [BookIssueStatus.ISSUED, BookIssueStatus.OVERDUE] },
              },
            },
          },
        },
      },
      orderBy: { title: "asc" },
    });

    // Aggregates by category
    const categoryBreakdown: Record<
      string,
      { titles: number; totalCopies: number; availableCopies: number; issuedCopies: number }
    > = {};

    let totalTitles = 0;
    let totalCopies = 0;
    let totalAvailable = 0;
    let totalIssued = 0;

    const items = books.map((b) => {
      totalTitles += 1;
      totalCopies += b.totalCopies;
      totalAvailable += b.availableCopies;
      const issued = b._count.issues;
      totalIssued += issued;

      const cat = b.category || "Uncategorized";
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { titles: 0, totalCopies: 0, availableCopies: 0, issuedCopies: 0 };
      }
      categoryBreakdown[cat].titles += 1;
      categoryBreakdown[cat].totalCopies += b.totalCopies;
      categoryBreakdown[cat].availableCopies += b.availableCopies;
      categoryBreakdown[cat].issuedCopies += issued;

      return {
        id: b.id,
        isbn: b.isbn,
        title: b.title,
        author: b.author,
        category: b.category,
        publisher: b.publisher,
        edition: b.edition,
        shelfLocation: b.shelfLocation,
        totalCopies: b.totalCopies,
        availableCopies: b.availableCopies,
        issuedCopies: issued,
        copiesSummary: b.copies.map((c) => ({
          copyNumber: c.copyNumber,
          barcode: c.barcode,
          status: c.status,
          condition: c.condition,
        })),
      };
    });

    return {
      totalTitles,
      totalCopies,
      availableCopies: totalAvailable,
      issuedCopies: totalIssued,
      summary: {
        totalTitles,
        totalCopies,
        totalAvailableCopies: totalAvailable,
        totalIssuedCopies: totalIssued,
        utilizationRatePercentage:
          totalCopies > 0 ? Number(((totalIssued / totalCopies) * 100).toFixed(2)) : 0,
      },
      categoryBreakdown,
      books: items,
    };
  }

  // =========================================================================
  // 2. LIBRARY ISSUED BOOKS REPORT
  // =========================================================================

  async getLibraryIssuedReport(schoolId: string, status?: string) {
    await this.assertModuleEnabled(schoolId, "reports");
    await this.assertModuleEnabled(schoolId, "library");

    const now = new Date();
    const where: Prisma.BookIssueWhereInput = {
      schoolId,
      ...(status && status !== "all"
        ? { status: status as BookIssueStatus }
        : !status
        ? { status: { in: [BookIssueStatus.ISSUED, BookIssueStatus.OVERDUE] } }
        : {}),
    };

    const issues = await this.prisma.bookIssue.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            category: true,
            shelfLocation: true,
          },
        },
        copy: {
          select: {
            id: true,
            copyNumber: true,
            barcode: true,
            status: true,
          },
        },
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNumber: true,
            gradeLevel: true,
            section: true,
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            employeeId: true,
          },
        },
        issuedBy: {
          select: {
            fullName: true,
            role: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const items = issues.map((i) => {
      const isOverdue =
        i.status === BookIssueStatus.ISSUED && new Date(i.dueDate) < now;
      let overdueDays = 0;
      let fineAmount = Number(i.fineAmount);

      if (isOverdue) {
        const diffMs = now.getTime() - new Date(i.dueDate).getTime();
        overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        fineAmount = overdueDays * Number(i.finePerDay);
      }

      return {
        id: i.id,
        bookTitle: i.book.title,
        isbn: i.book.isbn,
        author: i.book.author,
        category: i.book.category,
        copyNumber: i.copy.copyNumber,
        barcode: i.copy.barcode,
        borrowerType: i.borrowerType,
        borrowerName: i.student ? i.student.fullName : i.user?.fullName || "N/A",
        borrowerIdentifier: i.student ? i.student.admissionNumber : i.user?.employeeId || "N/A",
        borrowerGradeSection: i.student ? `${i.student.gradeLevel} - ${i.student.section || "A"}` : "Staff",
        issuedDate: i.issuedDate,
        dueDate: i.dueDate,
        returnedDate: i.returnedDate,
        renewalCount: i.renewalCount,
        maxRenewals: i.maxRenewals,
        status: isOverdue ? "OVERDUE" : i.status,
        isOverdue,
        overdueDays,
        fineAmount,
        finePerDay: Number(i.finePerDay),
        isFinePaid: i.isFinePaid,
        fineAdjustedToFee: i.fineAdjustedToFee,
        issuedBy: i.issuedBy?.fullName || "System",
      };
    });

    return {
      totalCount: items.length,
      totalIssued: items.length,
      overdueCount: items.filter((x) => x.isOverdue).length,
      activeLoans: items,
      issues: items,
    };
  }

  // =========================================================================
  // 3. LIBRARY OVERDUE RETURNS REPORT
  // =========================================================================

  async getLibraryOverdueReport(schoolId: string) {
    await this.assertModuleEnabled(schoolId, "reports");
    await this.assertModuleEnabled(schoolId, "library");

    const overdueList = await this.libraryService.getOverdueIssues(schoolId);

    let totalOverdueFines = 0;
    const items = overdueList.map((item) => {
      totalOverdueFines += item.accumulatedFine;
      return {
        id: item.id,
        bookTitle: item.book.title,
        isbn: item.book.isbn,
        copyNumber: item.copy.copyNumber,
        barcode: item.copy.barcode,
        borrowerType: item.borrowerType,
        borrowerName: item.student ? item.student.fullName : item.user?.fullName || "N/A",
        borrowerIdentifier: item.student ? item.student.admissionNumber : item.user?.employeeId || "N/A",
        gradeLevel: item.student?.gradeLevel || null,
        section: item.student?.section || null,
        issuedDate: item.issuedDate,
        dueDate: item.dueDate,
        overdueDays: item.overdueDays,
        finePerDay: Number(item.finePerDay),
        accumulatedFine: item.accumulatedFine,
        fineAdjustedToFee: item.fineAdjustedToFee,
        isFinePaid: item.isFinePaid,
      };
    });

    return {
      totalOverdueBooks: items.length,
      totalAccumulatedFines: totalOverdueFines,
      overdueReturns: items,
    };
  }

  // =========================================================================
  // 4. STUDENT ATTENDANCE SUMMARY REPORT (Reuses Attendance Data & Calculations)
  // =========================================================================

  async getAttendanceSummaryReport(
    schoolId: string,
    params?: {
      classSectionId?: string;
      gradeLevel?: string;
      startDate?: string;
      endDate?: string;
    }
  ) {
    await this.assertModuleEnabled(schoolId, "reports");
    await this.assertModuleEnabled(schoolId, "attendance");

    const where: Prisma.AttendanceWhereInput = { schoolId };

    if (params?.classSectionId) {
      where.classSectionId = params.classSectionId;
    }

    if (params?.startDate || params?.endDate) {
      where.date = {
        ...(params.startDate && { gte: new Date(params.startDate) }),
        ...(params.endDate && { lte: new Date(params.endDate) }),
      };
    }

    const records = await this.prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNumber: true,
            rollNumber: true,
            gradeLevel: true,
            section: true,
          },
        },
        classSection: {
          select: {
            className: true,
            section: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Student summary mapping
    const studentMap: Record<
      string,
      {
        studentId: string;
        fullName: string;
        admissionNumber: string;
        gradeLevel: string;
        section: string;
        totalDays: number;
        presentDays: number;
        absentDays: number;
        lateDays: number;
        halfDays: number;
        excusedDays: number;
      }
    > = {};

    let totalAttendanceEntries = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalLate = 0;
    let totalHalfDay = 0;

    for (const r of records) {
      totalAttendanceEntries += 1;
      const sId = r.studentId;
      if (!studentMap[sId]) {
        studentMap[sId] = {
          studentId: sId,
          fullName: r.student.fullName,
          admissionNumber: r.student.admissionNumber,
          gradeLevel: r.student.gradeLevel,
          section: r.student.section || "A",
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          halfDays: 0,
          excusedDays: 0,
        };
      }

      const st = studentMap[sId];
      st.totalDays += 1;

      if (r.status === "PRESENT") {
        st.presentDays += 1;
        totalPresent += 1;
      } else if (r.status === "ABSENT") {
        st.absentDays += 1;
        totalAbsent += 1;
      } else if (r.status === "LATE") {
        st.lateDays += 1;
        totalLate += 1;
      } else if (r.status === "HALF_DAY") {
        st.halfDays += 1;
        totalHalfDay += 1;
      } else if (r.status === "EXCUSED_LEAVE") {
        st.excusedDays += 1;
      }
    }

    const students = Object.values(studentMap).map((st) => {
      const effectivePresent = st.presentDays + st.lateDays + st.halfDays * 0.5;
      const percentage =
        st.totalDays > 0 ? Number(((effectivePresent / st.totalDays) * 100).toFixed(2)) : 100;
      return {
        ...st,
        attendancePercentage: percentage,
      };
    });

    const overallPercentage =
      totalAttendanceEntries > 0
        ? Number((((totalPresent + totalLate + totalHalfDay * 0.5) / totalAttendanceEntries) * 100).toFixed(2))
        : 100;

    return {
      summary: {
        totalRecordsEvaluated: totalAttendanceEntries,
        uniqueStudents: students.length,
        totalPresent,
        totalAbsent,
        totalLate,
        totalHalfDay,
        averageAttendancePercentage: overallPercentage,
      },
      students,
    };
  }

  // =========================================================================
  // 5. FEE DUES & COLLECTIONS REPORT (Reuses FeesService Methods)
  // =========================================================================

  async getFeesSummaryReport(schoolId: string, gradeLevel?: string) {
    await this.assertModuleEnabled(schoolId, "reports");
    await this.assertModuleEnabled(schoolId, "accounts_fees");

    const [collectionSummary, duesData] = await Promise.all([
      this.feesService.getCollectionSummary(schoolId),
      this.feesService.getDuesReport(schoolId, {
        gradeLevel: gradeLevel || "all",
        limit: 100,
      }),
    ]);

    const formattedDues = duesData.records.map((r) => ({
      studentFeePlanId: r.id,
      studentId: r.student.id,
      studentName: r.student.fullName,
      admissionNumber: r.student.admissionNumber,
      gradeLevel: r.student.gradeLevel,
      section: r.student.section,
      feePlanName: r.feePlan.name,
      academicYear: r.academicYear,
      grossAmount: Number(r.grossAmount),
      concessionAmount: Number(r.concessionAmount),
      netAmount: Number(r.netAmount),
      paidAmount: Number(r.paidAmount),
      balanceAmount: Number(r.balanceAmount),
      status: r.status,
    }));

    return {
      overview: collectionSummary,
      duesCount: duesData.total,
      duesRecords: formattedDues,
      plans: formattedDues,
      records: formattedDues,
    };
  }

  // =========================================================================
  // 6. PUBLISHED EXAM RESULTS REPORT (Reuses Exams Calculations & Marks)
  // =========================================================================

  async getPublishedExamResultsReport(
    schoolId: string,
    academicYear?: string,
    term?: string
  ) {
    await this.assertModuleEnabled(schoolId, "reports");
    await this.assertModuleEnabled(schoolId, "examinations");

    const where: Prisma.ExamWhereInput = {
      schoolId,
      status: "PUBLISHED",
      ...(academicYear && { academicYear }),
      ...(term && { term }),
    };

    const publishedExams = await this.prisma.exam.findMany({
      where,
      include: {
        classSection: true,
        papers: {
          include: { subject: true },
        },
        marks: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                admissionNumber: true,
                rollNumber: true,
                gradeLevel: true,
              },
            },
            subject: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    const results = publishedExams.map((exam) => {
      // Group marks by student
      const studentMarksMap: Record<
        string,
        {
          student: any;
          marks: any[];
          totalObtained: number;
          totalMax: number;
          hasFailed: boolean;
        }
      > = {};

      for (const m of exam.marks) {
        if (!studentMarksMap[m.studentId]) {
          studentMarksMap[m.studentId] = {
            student: m.student,
            marks: [],
            totalObtained: 0,
            totalMax: 0,
            hasFailed: false,
          };
        }

        const entry = studentMarksMap[m.studentId];
        const paper = exam.papers.find((p) => p.subjectId === m.subjectId);
        const maxMarks = paper?.maxMarks || 100;

        entry.marks.push({
          subject: m.subject.name,
          marksObtained: m.marksObtained,
          maxMarks,
          grade: m.grade,
          isPassed: m.isPassed,
        });

        entry.totalObtained += m.marksObtained;
        entry.totalMax += maxMarks;
        if (!m.isPassed) {
          entry.hasFailed = true;
        }
      }

      const evaluatedStudents = Object.values(studentMarksMap).map((item) => {
        const percentage =
          item.totalMax > 0
            ? Number(((item.totalObtained / item.totalMax) * 100).toFixed(2))
            : 0;

        return {
          studentId: item.student.id,
          studentName: item.student.fullName,
          admissionNumber: item.student.admissionNumber,
          rollNumber: item.student.rollNumber,
          totalObtained: item.totalObtained,
          totalMax: item.totalMax,
          percentage,
          isPassed: !item.hasFailed,
          subjectCount: item.marks.length,
        };
      });

      const totalStudents = evaluatedStudents.length;
      const passedCount = evaluatedStudents.filter((s) => s.isPassed).length;
      const failedCount = totalStudents - passedCount;
      const averagePercentage =
        totalStudents > 0
          ? Number(
              (
                evaluatedStudents.reduce((acc, s) => acc + s.percentage, 0) /
                totalStudents
              ).toFixed(2)
            )
          : 0;

      return {
        examId: exam.id,
        examName: exam.name,
        academicYear: exam.academicYear,
        term: exam.term,
        className: exam.classSection.className,
        section: exam.classSection.section,
        publishedAt: exam.publishedAt,
        totalPapers: exam.papers.length,
        statistics: {
          totalStudentsEvaluated: totalStudents,
          passedStudents: passedCount,
          failedStudents: failedCount,
          passPercentage:
            totalStudents > 0
              ? Number(((passedCount / totalStudents) * 100).toFixed(2))
              : 0,
          averagePercentage,
        },
        studentResults: evaluatedStudents,
      };
    });

    return {
      publishedExamsCount: results.length,
      exams: results,
      results,
    };
  }
}
