import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { MarkStudentAttendanceDto } from "./dto/mark-student-attendance.dto";
import { MarkStaffAttendanceDto } from "./dto/mark-staff-attendance.dto";
import { CreateHolidayDto } from "./dto/create-holiday.dto";
import { UserRole } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  fullName?: string;
}

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  // =========================================================================
  // 1. STUDENT DAILY ATTENDANCE (Bulk Roll Call, Upsert, Idempotent)
  // =========================================================================

  async markStudentAttendance(
    schoolId: string,
    markedById: string,
    authRole: UserRole,
    dto: MarkStudentAttendanceDto
  ) {
    if (!dto.records || dto.records.length === 0) {
      throw new BadRequestException("Attendance records array cannot be empty.");
    }

    const attendanceDate = new Date(dto.date);
    if (isNaN(attendanceDate.getTime())) {
      throw new BadRequestException("Invalid date format. Expected YYYY-MM-DD.");
    }

    // 1. Teacher Authorization Check (Rule 8: Teachers can mark only assigned/authorized classes)
    if (authRole === UserRole.TEACHER && dto.classSectionId) {
      const classSection = await this.prisma.classSection.findFirst({
        where: { id: dto.classSectionId, schoolId },
        include: {
          timetableSlots: { where: { teacherId: markedById } },
        },
      });

      if (!classSection) {
        throw new NotFoundException("Class section not found in your school.");
      }

      const isClassTeacher = classSection.classTeacherId === markedById;
      const teachesSubjectInClass = classSection.timetableSlots.length > 0;

      if (!isClassTeacher && !teachesSubjectInClass) {
        throw new ForbiddenException(
          "Authorization denied: You are not assigned as the class teacher or subject teacher for this class."
        );
      }
    }

    // 2. Perform Atomic Upsert Transaction (Zero Duplicate Records)
    const results = await this.prisma.$transaction(async (tx) => {
      const upserted = [];
      let presentCount = 0;
      let absentCount = 0;

      for (const rec of dto.records) {
        // Validate student belongs to school
        const student = await tx.student.findFirst({
          where: { id: rec.studentId, schoolId },
          select: { id: true, fullName: true, admissionNumber: true },
        });

        if (!student) {
          throw new NotFoundException(
            `Student record '${rec.studentId}' not found in your school.`
          );
        }

        if (rec.status === "PRESENT" || rec.status === "LATE") {
          presentCount++;
        } else if (rec.status === "ABSENT") {
          absentCount++;
        }

        const record = await tx.attendance.upsert({
          where: {
            schoolId_studentId_date: {
              schoolId,
              studentId: rec.studentId,
              date: attendanceDate,
            },
          },
          update: {
            status: rec.status,
            remarks: rec.remarks?.trim() || null,
            classSectionId: dto.classSectionId || null,
            markedById,
          },
          create: {
            schoolId,
            studentId: rec.studentId,
            classSectionId: dto.classSectionId || null,
            date: attendanceDate,
            status: rec.status,
            remarks: rec.remarks?.trim() || null,
            markedById,
          },
        });

        upserted.push(record);
      }

      await this.auditService.log({
        action: "STUDENT_ATTENDANCE_MARKED",
        entity: "Attendance",
        entityId: dto.classSectionId || "BULK",
        userId: markedById,
        schoolId,
        details: {
          date: dto.date,
          classSectionId: dto.classSectionId,
          totalStudents: upserted.length,
          presentCount,
          absentCount,
        },
      });

      return {
        date: dto.date,
        totalRecorded: upserted.length,
        presentCount,
        absentCount,
        records: upserted,
      };
    });

    return results;
  }

  async getClassDailyAttendance(
    schoolId: string,
    classSectionId: string,
    dateString: string
  ) {
    const attendanceDate = new Date(dateString);
    if (isNaN(attendanceDate.getTime())) {
      throw new BadRequestException("Invalid date format. Expected YYYY-MM-DD.");
    }

    const classSection = await this.prisma.classSection.findFirst({
      where: { id: classSectionId, schoolId },
      include: {
        classTeacher: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!classSection) {
      throw new NotFoundException("Class section not found in your school.");
    }

    // Fetch enrolled students
    let students = await this.prisma.student.findMany({
      where: {
        schoolId,
        OR: [
          { classSectionId },
          {
            gradeLevel: classSection.className,
            section: classSection.section,
          },
        ],
        status: "ACTIVE",
      },
      select: {
        id: true,
        fullName: true,
        admissionNumber: true,
        rollNumber: true,
        gender: true,
      },
      orderBy: { rollNumber: "asc" },
    });

    // If no students assigned directly, match by gradeLevel
    if (students.length === 0) {
      students = await this.prisma.student.findMany({
        where: {
          schoolId,
          gradeLevel: classSection.className,
          status: "ACTIVE",
        },
        select: {
          id: true,
          fullName: true,
          admissionNumber: true,
          rollNumber: true,
          gender: true,
        },
        orderBy: { rollNumber: "asc" },
      });
    }

    // Fetch existing attendance logs for this day
    const existingLogs = await this.prisma.attendance.findMany({
      where: {
        schoolId,
        studentId: { in: students.map((s) => s.id) },
        date: attendanceDate,
      },
    });

    const logsMap = new Map<string, (typeof existingLogs)[0]>();
    existingLogs.forEach((l) => logsMap.set(l.studentId, l));

    const roster = students.map((st) => {
      const log = logsMap.get(st.id);
      return {
        studentId: st.id,
        fullName: st.fullName,
        admissionNumber: st.admissionNumber,
        rollNumber: st.rollNumber || "N/A",
        gender: st.gender,
        status: log ? log.status : "PRESENT", // Default all present for fast roll call
        remarks: log ? log.remarks : "",
        isAlreadyMarked: !!log,
      };
    });

    const presentCount = roster.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
    const absentCount = roster.filter((r) => r.status === "ABSENT").length;

    return {
      classSection,
      date: dateString,
      isMarkedToday: existingLogs.length > 0,
      totalStudents: students.length,
      presentCount,
      absentCount,
      roster,
    };
  }

  // =========================================================================
  // 2. STUDENT MONTHLY ATTENDANCE REGISTER & PERCENTAGE
  // =========================================================================

  async getStudentMonthlyAttendance(
    studentId: string,
    month: number, // 1 to 12
    year: number,
    authUser: AuthenticatedUser
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        school: true,
        parents: true,
      },
    });

    if (!student) throw new NotFoundException("Student record not found.");

    // Security & Authorization
    if (authUser.role === UserRole.STUDENT && student.studentUserId !== authUser.id) {
      throw new ForbiddenException("Access denied: You can view only your own attendance.");
    }

    if (authUser.role === UserRole.PARENT) {
      const isLinked = student.parents.some((p) => p.parentId === authUser.id);
      if (!isLinked) {
        throw new ForbiddenException(
          "Access denied: You are permitted to view attendance only for your linked children."
        );
      }
    }

    if (
      (authUser.role === UserRole.TEACHER ||
        authUser.role === UserRole.SCHOOL_ADMIN ||
        authUser.role === UserRole.ACCOUNTANT) &&
      student.schoolId !== authUser.schoolId
    ) {
      throw new NotFoundException("Student not found in your school.");
    }

    // Start & End of Month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [attendances, holidays] = await Promise.all([
      this.prisma.attendance.findMany({
        where: {
          studentId,
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: "asc" },
      }),
      this.prisma.schoolHoliday.findMany({
        where: {
          schoolId: student.schoolId,
          OR: [
            { startDate: { lte: endDate }, endDate: { gte: startDate } },
          ],
        },
      }),
    ]);

    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let leaveDays = 0;

    attendances.forEach((a) => {
      if (a.status === "PRESENT") presentDays += 1;
      else if (a.status === "LATE") {
        lateDays += 1;
        presentDays += 1; // Late still counts towards attendance
      } else if (a.status === "HALF_DAY") {
        halfDays += 1;
        presentDays += 0.5;
      } else if (a.status === "ABSENT") absentDays += 1;
      else if (a.status === "EXCUSED_LEAVE") leaveDays += 1;
    });

    const totalDaysRecorded = attendances.length;
    const effectivePresent = presentDays;
    const percentage =
      totalDaysRecorded > 0
        ? Math.min(100, Math.round((effectivePresent / totalDaysRecorded) * 1000) / 10)
        : 100.0;

    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        gradeLevel: student.gradeLevel,
        section: student.section,
      },
      month,
      year,
      summary: {
        totalDaysRecorded,
        effectivePresent,
        presentDays,
        absentDays,
        lateDays,
        halfDays,
        leaveDays,
        attendancePercentage: percentage,
      },
      attendances,
      holidays,
    };
  }

  // =========================================================================
  // 3. PARENT VIEW: ALL LINKED CHILDREN ATTENDANCE SUMMARY
  // =========================================================================

  async getParentChildrenAttendanceSummary(parentUserId: string) {
    const parent = await this.prisma.user.findUnique({
      where: { id: parentUserId },
      include: {
        parentLinks: {
          include: {
            student: {
              include: { school: true },
            },
          },
        },
      },
    });

    if (!parent) throw new NotFoundException("Parent user profile not found.");

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const summaries = await Promise.all(
      parent.parentLinks.map(async (link) => {
        const student = link.student;
        const stats = await this.getStudentMonthlyAttendance(
          student.id,
          currentMonth,
          currentYear,
          {
            id: parent.id,
            email: parent.email,
            role: UserRole.PARENT,
            schoolId: student.schoolId,
          }
        );

        return {
          studentId: student.id,
          fullName: student.fullName,
          admissionNumber: student.admissionNumber,
          gradeLevel: student.gradeLevel,
          section: student.section,
          schoolName: student.school.name,
          currentMonth,
          currentYear,
          stats: stats.summary,
        };
      })
    );

    return summaries;
  }

  // =========================================================================
  // 4. TEACHER / STAFF ATTENDANCE
  // =========================================================================

  async markStaffAttendance(
    schoolId: string,
    markedById: string,
    dto: MarkStaffAttendanceDto
  ) {
    const staffUser = await this.prisma.user.findFirst({
      where: { id: dto.userId, schoolId },
    });

    if (!staffUser) {
      throw new NotFoundException("Staff member not found in your school.");
    }

    const attendanceDate = new Date(dto.date);
    if (isNaN(attendanceDate.getTime())) {
      throw new BadRequestException("Invalid date format. Expected YYYY-MM-DD.");
    }

    const record = await this.prisma.staffAttendance.upsert({
      where: {
        schoolId_userId_date: {
          schoolId,
          userId: dto.userId,
          date: attendanceDate,
        },
      },
      update: {
        status: dto.status,
        checkIn: dto.checkIn || null,
        checkOut: dto.checkOut || null,
        remarks: dto.remarks?.trim() || null,
        markedById,
      },
      create: {
        schoolId,
        userId: dto.userId,
        date: attendanceDate,
        status: dto.status,
        checkIn: dto.checkIn || null,
        checkOut: dto.checkOut || null,
        remarks: dto.remarks?.trim() || null,
        markedById,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });

    await this.auditService.log({
      action: "STAFF_ATTENDANCE_MARKED",
      entity: "StaffAttendance",
      entityId: record.id,
      userId: markedById,
      schoolId,
      details: {
        staffName: staffUser.fullName,
        date: dto.date,
        status: dto.status,
        checkIn: dto.checkIn,
      },
    });

    return record;
  }

  async getStaffDailyAttendance(schoolId: string, dateString: string) {
    const attendanceDate = new Date(dateString);
    if (isNaN(attendanceDate.getTime())) {
      throw new BadRequestException("Invalid date format. Expected YYYY-MM-DD.");
    }

    const staffMembers = await this.prisma.user.findMany({
      where: {
        schoolId,
        role: { in: [UserRole.TEACHER, UserRole.STAFF, UserRole.ACCOUNTANT] },
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        designation: true,
        department: true,
        employeeId: true,
      },
      orderBy: { fullName: "asc" },
    });

    const logs = await this.prisma.staffAttendance.findMany({
      where: { schoolId, date: attendanceDate },
    });

    const logsMap = new Map<string, (typeof logs)[0]>();
    logs.forEach((l) => logsMap.set(l.userId, l));

    const roster = staffMembers.map((m) => {
      const log = logsMap.get(m.id);
      return {
        userId: m.id,
        fullName: m.fullName,
        role: m.role,
        designation: m.designation,
        department: m.department,
        employeeId: m.employeeId,
        status: log ? log.status : "PRESENT",
        checkIn: log ? log.checkIn : "",
        checkOut: log ? log.checkOut : "",
        remarks: log ? log.remarks : "",
        isRecorded: !!log,
      };
    });

    return {
      date: dateString,
      totalStaff: staffMembers.length,
      roster,
    };
  }

  // =========================================================================
  // 5. SCHOOL HOLIDAYS CALENDAR
  // =========================================================================

  async createHoliday(schoolId: string, dto: CreateHolidayDto, userId: string) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException("Invalid holiday date range.");
    }

    if (start > end) {
      throw new BadRequestException("Holiday start date cannot be after end date.");
    }

    const holiday = await this.prisma.schoolHoliday.create({
      data: {
        schoolId,
        title: dto.title.trim(),
        startDate: start,
        endDate: end,
        description: dto.description?.trim() || null,
        academicYear: dto.academicYear?.trim() || null,
      },
    });

    await this.auditService.log({
      action: "SCHOOL_HOLIDAY_CREATED",
      entity: "SchoolHoliday",
      entityId: holiday.id,
      userId,
      schoolId,
      details: { title: holiday.title, start: dto.startDate, end: dto.endDate },
    });

    return holiday;
  }

  async listHolidays(schoolId: string, academicYear?: string) {
    const where: any = { schoolId };
    if (academicYear) where.academicYear = academicYear;

    return this.prisma.schoolHoliday.findMany({
      where,
      orderBy: { startDate: "asc" },
    });
  }

  async deleteHoliday(schoolId: string, id: string, userId: string) {
    const holiday = await this.prisma.schoolHoliday.findFirst({
      where: { id, schoolId },
    });
    if (!holiday) throw new NotFoundException("Holiday not found.");

    await this.prisma.schoolHoliday.delete({ where: { id } });

    await this.auditService.log({
      action: "SCHOOL_HOLIDAY_DELETED",
      entity: "SchoolHoliday",
      entityId: id,
      userId,
      schoolId,
      details: { title: holiday.title },
    });

    return { success: true, message: "Holiday removed successfully." };
  }
}
