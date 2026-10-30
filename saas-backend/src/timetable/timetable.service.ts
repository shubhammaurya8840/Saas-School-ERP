import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateClassSectionDto } from "./dto/create-class-section.dto";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { SaveTimetableSlotDto } from "./dto/save-timetable-slot.dto";
import { BulkSaveTimetableDto } from "./dto/bulk-save-timetable.dto";
import { UserRole } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  fullName?: string;
}

@Injectable()
export class TimetableService {
  private readonly logger = new Logger(TimetableService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  // =========================================================================
  // 1. CLASS SECTIONS MANAGEMENT
  // =========================================================================

  async createClassSection(schoolId: string, dto: CreateClassSectionDto, userId: string) {
    const existing = await this.prisma.classSection.findUnique({
      where: {
        schoolId_className_section_academicYear: {
          schoolId,
          className: dto.className.trim(),
          section: dto.section.trim().toUpperCase(),
          academicYear: dto.academicYear.trim(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Class section '${dto.className} - ${dto.section}' already exists for academic year ${dto.academicYear}.`
      );
    }

    if (dto.classTeacherId) {
      const teacher = await this.prisma.user.findFirst({
        where: { id: dto.classTeacherId, schoolId },
      });
      if (!teacher) {
        throw new NotFoundException("Assigned class teacher not found in this school.");
      }
    }

    const classSection = await this.prisma.classSection.create({
      data: {
        schoolId,
        className: dto.className.trim(),
        section: dto.section.trim().toUpperCase(),
        room: dto.room?.trim() || null,
        academicYear: dto.academicYear.trim(),
        classTeacherId: dto.classTeacherId || null,
      },
      include: {
        classTeacher: {
          select: { id: true, fullName: true, email: true, employeeId: true },
        },
      },
    });

    await this.auditService.log({
      action: "CLASS_SECTION_CREATED",
      entity: "ClassSection",
      entityId: classSection.id,
      userId,
      schoolId,
      details: {
        className: classSection.className,
        section: classSection.section,
        academicYear: classSection.academicYear,
        room: classSection.room,
      },
    });

    return classSection;
  }

  async listClassSections(
    schoolId: string,
    params?: { academicYear?: string; className?: string }
  ) {
    const where: any = { schoolId };
    if (params?.academicYear) where.academicYear = params.academicYear;
    if (params?.className && params.className !== "all") where.className = params.className;

    return this.prisma.classSection.findMany({
      where,
      include: {
        classTeacher: {
          select: { id: true, fullName: true, email: true, employeeId: true },
        },
        _count: {
          select: {
            students: true,
            timetableSlots: true,
          },
        },
      },
      orderBy: [{ className: "asc" }, { section: "asc" }],
    });
  }

  async getClassSection(schoolId: string, id: string) {
    const classSection = await this.prisma.classSection.findFirst({
      where: { id, schoolId },
      include: {
        classTeacher: {
          select: { id: true, fullName: true, email: true, employeeId: true },
        },
        students: {
          select: {
            id: true,
            fullName: true,
            admissionNumber: true,
            rollNumber: true,
            gender: true,
          },
          orderBy: { rollNumber: "asc" },
        },
        timetableSlots: {
          include: {
            subject: true,
            teacher: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
        },
      },
    });

    if (!classSection) {
      throw new NotFoundException("Class section not found.");
    }

    return classSection;
  }

  async deleteClassSection(schoolId: string, id: string, userId: string) {
    const classSection = await this.prisma.classSection.findFirst({
      where: { id, schoolId },
    });
    if (!classSection) {
      throw new NotFoundException("Class section not found.");
    }

    await this.prisma.classSection.delete({ where: { id } });

    await this.auditService.log({
      action: "CLASS_SECTION_DELETED",
      entity: "ClassSection",
      entityId: id,
      userId,
      schoolId,
      details: {
        className: classSection.className,
        section: classSection.section,
      },
    });

    return { success: true, message: "Class section deleted successfully." };
  }

  // =========================================================================
  // 2. SUBJECTS MANAGEMENT
  // =========================================================================

  async createSubject(schoolId: string, dto: CreateSubjectDto, userId: string) {
    const existing = await this.prisma.subject.findUnique({
      where: {
        schoolId_code: {
          schoolId,
          code: dto.code.trim().toUpperCase(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Subject code '${dto.code}' already exists in your school.`);
    }

    const subject = await this.prisma.subject.create({
      data: {
        schoolId,
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        applicableGrade: dto.applicableGrade?.trim() || null,
        description: dto.description?.trim() || null,
      },
    });

    await this.auditService.log({
      action: "SUBJECT_CREATED",
      entity: "Subject",
      entityId: subject.id,
      userId,
      schoolId,
      details: { name: subject.name, code: subject.code, grade: subject.applicableGrade },
    });

    return subject;
  }

  async listSubjects(schoolId: string, params?: { grade?: string }) {
    const where: any = { schoolId };
    if (params?.grade && params.grade !== "all") {
      where.OR = [{ applicableGrade: params.grade }, { applicableGrade: null }];
    }

    return this.prisma.subject.findMany({
      where,
      orderBy: { name: "asc" },
    });
  }

  async deleteSubject(schoolId: string, id: string, userId: string) {
    const subject = await this.prisma.subject.findFirst({ where: { id, schoolId } });
    if (!subject) throw new NotFoundException("Subject not found.");

    await this.prisma.subject.delete({ where: { id } });

    await this.auditService.log({
      action: "SUBJECT_DELETED",
      entity: "Subject",
      entityId: id,
      userId,
      schoolId,
      details: { name: subject.name, code: subject.code },
    });

    return { success: true, message: "Subject deleted successfully." };
  }

  // =========================================================================
  // 3. TIMETABLE SLOTS & SCHEDULING CONFLICT DETECTION
  // =========================================================================

  async saveSlot(schoolId: string, dto: SaveTimetableSlotDto, userId: string) {
    // 1. Verify Class Section belongs to School
    const classSection = await this.prisma.classSection.findFirst({
      where: { id: dto.classSectionId, schoolId },
    });
    if (!classSection) {
      throw new NotFoundException("Class section not found in your school.");
    }

    // 2. Verify Subject belongs to School
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, schoolId },
    });
    if (!subject) {
      throw new NotFoundException("Subject not found in your school.");
    }

    // 3. Verify Teacher belongs to School if assigned
    if (dto.teacherId) {
      const teacher = await this.prisma.user.findFirst({
        where: { id: dto.teacherId, schoolId },
      });
      if (!teacher) {
        throw new NotFoundException("Assigned teacher not found in your school.");
      }

      // Rule 6: TEACHER CONFLICT DETECTION
      // Teacher cannot be scheduled in two different classes at the same day & period
      const teacherClash = await this.prisma.timetableSlot.findFirst({
        where: {
          schoolId,
          teacherId: dto.teacherId,
          dayOfWeek: dto.dayOfWeek,
          periodNumber: dto.periodNumber,
          classSectionId: { not: dto.classSectionId },
        },
        include: {
          classSection: true,
          subject: true,
          teacher: { select: { fullName: true } },
        },
      });

      if (teacherClash) {
        throw new ConflictException(
          `Scheduling Conflict: Teacher '${teacherClash.teacher?.fullName || "Assigned Teacher"}' is already scheduled for '${teacherClash.subject.name}' in '${teacherClash.classSection.className} - ${teacherClash.classSection.section}' during Period ${dto.periodNumber} on ${dto.dayOfWeek}.`
        );
      }
    }

    // 4. Rule 6: CLASSROOM / ROOM CONFLICT DETECTION
    // Room cannot be double-booked by two different classes at the same day & period
    const roomName = dto.room?.trim() || classSection.room?.trim() || null;
    if (roomName) {
      const roomClash = await this.prisma.timetableSlot.findFirst({
        where: {
          schoolId,
          room: { equals: roomName, mode: "insensitive" },
          dayOfWeek: dto.dayOfWeek,
          periodNumber: dto.periodNumber,
          classSectionId: { not: dto.classSectionId },
        },
        include: {
          classSection: true,
          subject: true,
        },
      });

      if (roomClash) {
        throw new ConflictException(
          `Classroom Conflict: Room '${roomName}' is already booked for '${roomClash.classSection.className} - ${roomClash.classSection.section}' during Period ${dto.periodNumber} on ${dto.dayOfWeek}.`
        );
      }
    }

    // 5. Upsert Slot (Safe, idempotent)
    const slot = await this.prisma.timetableSlot.upsert({
      where: {
        classSectionId_dayOfWeek_periodNumber: {
          classSectionId: dto.classSectionId,
          dayOfWeek: dto.dayOfWeek,
          periodNumber: dto.periodNumber,
        },
      },
      update: {
        startTime: dto.startTime.trim(),
        endTime: dto.endTime.trim(),
        room: roomName,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId || null,
      },
      create: {
        schoolId,
        classSectionId: dto.classSectionId,
        dayOfWeek: dto.dayOfWeek,
        periodNumber: dto.periodNumber,
        startTime: dto.startTime.trim(),
        endTime: dto.endTime.trim(),
        room: roomName,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId || null,
      },
      include: {
        subject: true,
        teacher: { select: { id: true, fullName: true, email: true } },
        classSection: true,
      },
    });

    await this.auditService.log({
      action: "TIMETABLE_SLOT_SAVED",
      entity: "TimetableSlot",
      entityId: slot.id,
      userId,
      schoolId,
      details: {
        class: `${classSection.className}-${classSection.section}`,
        day: dto.dayOfWeek,
        period: dto.periodNumber,
        subject: subject.name,
      },
    });

    return slot;
  }

  async bulkSaveSlots(schoolId: string, dto: BulkSaveTimetableDto, userId: string) {
    const savedSlots = [];
    for (const slotDto of dto.slots) {
      const saved = await this.saveSlot(schoolId, slotDto, userId);
      savedSlots.push(saved);
    }
    return {
      success: true,
      count: savedSlots.length,
      slots: savedSlots,
    };
  }

  async deleteSlot(schoolId: string, slotId: string, userId: string) {
    const slot = await this.prisma.timetableSlot.findFirst({
      where: { id: slotId, schoolId },
    });
    if (!slot) throw new NotFoundException("Timetable slot not found.");

    await this.prisma.timetableSlot.delete({ where: { id: slotId } });

    await this.auditService.log({
      action: "TIMETABLE_SLOT_DELETED",
      entity: "TimetableSlot",
      entityId: slotId,
      userId,
      schoolId,
      details: { day: slot.dayOfWeek, period: slot.periodNumber },
    });

    return { success: true, message: "Timetable slot cleared." };
  }

  // =========================================================================
  // 4. TIMETABLE VIEWS (Class, Teacher, Student, Parent)
  // =========================================================================

  async getClassTimetable(schoolId: string, classSectionId: string) {
    const classSection = await this.prisma.classSection.findFirst({
      where: { id: classSectionId, schoolId },
      include: {
        classTeacher: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!classSection) throw new NotFoundException("Class section not found.");

    const slots = await this.prisma.timetableSlot.findMany({
      where: { classSectionId, schoolId },
      include: {
        subject: true,
        teacher: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
    });

    return {
      classSection,
      slots,
    };
  }

  async getTeacherTimetable(schoolId: string, teacherId: string) {
    const teacher = await this.prisma.user.findFirst({
      where: { id: teacherId, schoolId },
      select: { id: true, fullName: true, email: true, role: true },
    });
    if (!teacher) throw new NotFoundException("Teacher not found.");

    const slots = await this.prisma.timetableSlot.findMany({
      where: { teacherId, schoolId },
      include: {
        subject: true,
        classSection: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
    });

    return {
      teacher,
      slots,
    };
  }

  async getStudentTimetable(studentId: string, authUser: AuthenticatedUser) {
    // 1. Fetch Student with school and parent linkage
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        school: true,
        parents: true,
      },
    });
    if (!student) throw new NotFoundException("Student not found.");

    // 2. Authorization check
    if (authUser.role === UserRole.STUDENT && student.studentUserId !== authUser.id) {
      throw new ForbiddenException("Access denied: You can view only your own timetable.");
    }

    if (authUser.role === UserRole.PARENT) {
      const isLinked = student.parents.some((p) => p.parentId === authUser.id);
      if (!isLinked) {
        throw new ForbiddenException(
          "Access denied: You can view timetable only for your linked children."
        );
      }
    }

    if (
      (authUser.role === UserRole.TEACHER || authUser.role === UserRole.SCHOOL_ADMIN) &&
      student.schoolId !== authUser.schoolId
    ) {
      throw new NotFoundException("Student not found in your school.");
    }

    // 3. Find matching class section
    let classSection = null;
    if (student.classSectionId) {
      classSection = await this.prisma.classSection.findUnique({
        where: { id: student.classSectionId },
        include: { classTeacher: { select: { id: true, fullName: true, email: true } } },
      });
    }

    if (!classSection) {
      classSection = await this.prisma.classSection.findFirst({
        where: {
          schoolId: student.schoolId,
          className: student.gradeLevel,
          section: student.section || "A",
        },
        include: { classTeacher: { select: { id: true, fullName: true, email: true } } },
      });
    }

    const slots = classSection
      ? await this.prisma.timetableSlot.findMany({
          where: { classSectionId: classSection.id, schoolId: student.schoolId },
          include: {
            subject: true,
            teacher: { select: { id: true, fullName: true, email: true } },
          },
          orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }],
        })
      : [];

    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        gradeLevel: student.gradeLevel,
        section: student.section,
        admissionNumber: student.admissionNumber,
      },
      classSection,
      slots,
    };
  }
}
