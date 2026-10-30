import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { CreateExamPaperDto } from './dto/create-exam-paper.dto';
import { EnterMarksDto } from './dto/enter-marks.dto';
import { CreateGradingRuleDto } from './dto/create-grading-rule.dto';

export interface CalculatedGrade {
  grade: string;
  gradePoint: number;
  description: string;
  isPassing: boolean;
}

@Injectable()
export class ExamsService {
  private readonly logger = new Logger(ExamsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // =========================================================================
  // 1. EXAM MANAGEMENT (Create, Papers, List, Details)
  // =========================================================================

  async createExam(schoolId: string, dto: CreateExamDto, user: any) {
    // 1. Verify classSection belongs to school
    const classSection = await this.prisma.classSection.findFirst({
      where: { id: dto.classSectionId, schoolId },
    });
    if (!classSection) {
      throw new NotFoundException('Class Section not found in this school');
    }

    // 2. Prepare Papers to schedule
    const papersToCreate: Array<{
      subjectId: string;
      examDate: Date;
      startTime?: string;
      endTime?: string;
      maxMarks: number;
      passingMarks: number;
      room?: string;
    }> = [];

    if (Array.isArray(dto.papers) && dto.papers.length > 0) {
      const seenSubjects = new Set<string>();
      for (const p of dto.papers) {
        if (seenSubjects.has(p.subjectId)) {
          throw new ConflictException(
            'Duplicate subject specified in examination papers',
          );
        }
        seenSubjects.add(p.subjectId);

        const subject = await this.prisma.subject.findFirst({
          where: { id: p.subjectId, schoolId },
        });
        if (!subject) {
          throw new NotFoundException(
            `Subject ${p.subjectId} not found in this school`,
          );
        }

        const maxMarks = p.maxMarks ?? 100;
        const passingMarks = p.passingMarks ?? 35;
        if (passingMarks > maxMarks) {
          throw new BadRequestException(
            `Passing marks (${passingMarks}) cannot exceed maximum marks (${maxMarks})`,
          );
        }

        papersToCreate.push({
          subjectId: p.subjectId,
          examDate: new Date(p.examDate),
          startTime: p.startTime,
          endTime: p.endTime,
          maxMarks,
          passingMarks,
          room: p.room || classSection.room || undefined,
        });
      }
    } else if (dto.subjectId && dto.examDate) {
      const subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, schoolId },
      });
      if (!subject) {
        throw new NotFoundException('Subject not found in this school');
      }

      const maxMarks = dto.maxMarks ?? 100;
      const passingMarks = dto.passingMarks ?? 35;
      if (passingMarks > maxMarks) {
        throw new BadRequestException(
          `Passing marks (${passingMarks}) cannot exceed maximum marks (${maxMarks})`,
        );
      }

      papersToCreate.push({
        subjectId: dto.subjectId,
        examDate: new Date(dto.examDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        maxMarks,
        passingMarks,
        room: dto.room || classSection.room || undefined,
      });
    }

    // 3. Create Exam and Papers atomically
    return this.prisma.$transaction(async (tx) => {
      const exam = await tx.exam.create({
        data: {
          schoolId,
          name: dto.name,
          academicYear: dto.academicYear,
          term: dto.term || 'TERM_1',
          classSectionId: dto.classSectionId,
          description: dto.description,
          status: 'DRAFT',
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        },
      });

      for (const p of papersToCreate) {
        await tx.examPaper.create({
          data: {
            schoolId,
            examId: exam.id,
            classSectionId: dto.classSectionId,
            subjectId: p.subjectId,
            examDate: p.examDate,
            startTime: p.startTime,
            endTime: p.endTime,
            maxMarks: p.maxMarks,
            passingMarks: p.passingMarks,
            room: p.room,
          },
        });
      }

      await this.audit.log(
        {
          action: 'EXAM_CREATED',
          entity: 'Exam',
          entityId: exam.id,
          details: {
            name: exam.name,
            classSection: `${classSection.className}-${classSection.section}`,
            papersCount: papersToCreate.length,
            academicYear: exam.academicYear,
          },
          userId: user.id,
          schoolId,
        },
        tx,
      );

      return tx.exam.findUnique({
        where: { id: exam.id },
        include: {
          classSection: true,
          papers: {
            include: { subject: true },
            orderBy: { examDate: 'asc' },
          },
        },
      });
    });
  }

  async addExamPaper(schoolId: string, examId: string, dto: CreateExamPaperDto) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId },
    });
    if (!exam) {
      throw new NotFoundException('Exam not found in this school');
    }

    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, schoolId },
    });
    if (!subject) {
      throw new NotFoundException('Subject not found in this school');
    }

    // Check duplicate subject in this exam
    const existingPaper = await this.prisma.examPaper.findFirst({
      where: { examId, subjectId: dto.subjectId },
    });
    if (existingPaper) {
      throw new ConflictException(
        `Subject '${subject.name}' is already scheduled for this exam`,
      );
    }

    const maxMarks = dto.maxMarks ?? 100;
    const passingMarks = dto.passingMarks ?? 35;
    if (passingMarks > maxMarks) {
      throw new BadRequestException('Passing marks cannot exceed maximum marks');
    }

    return this.prisma.examPaper.create({
      data: {
        schoolId,
        examId,
        classSectionId: exam.classSectionId,
        subjectId: dto.subjectId,
        examDate: new Date(dto.examDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        maxMarks,
        passingMarks,
        room: dto.room,
      },
      include: {
        subject: true,
      },
    });
  }

  async listExams(
    schoolId: string,
    query: { academicYear?: string; classSectionId?: string; status?: string },
    user: any,
  ) {
    const where: any = { schoolId };

    if (query.academicYear) where.academicYear = query.academicYear;
    if (query.classSectionId) where.classSectionId = query.classSectionId;

    // Rule 5: Students and Parents can view PUBLISHED results only
    if (user.role === 'STUDENT' || user.role === 'PARENT') {
      where.status = 'PUBLISHED';
    } else if (query.status) {
      where.status = query.status;
    }

    // If student, filter to student's class
    if (user.role === 'STUDENT') {
      const student = await this.prisma.student.findFirst({
        where: { studentUserId: user.id, schoolId },
      });
      if (student?.classSectionId) {
        where.classSectionId = student.classSectionId;
      }
    }

    const exams = await this.prisma.exam.findMany({
      where,
      include: {
        classSection: {
          select: { id: true, className: true, section: true, room: true },
        },
        papers: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
          },
          orderBy: { examDate: 'asc' },
        },
        _count: {
          select: { marks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return exams;
  }

  async getExamById(schoolId: string, examId: string, user: any) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId },
      include: {
        classSection: {
          include: {
            students: {
              where: { status: 'ACTIVE' },
              select: {
                id: true,
                fullName: true,
                admissionNumber: true,
                rollNumber: true,
              },
              orderBy: { fullName: 'asc' },
            },
          },
        },
        papers: {
          include: {
            subject: true,
          },
          orderBy: { examDate: 'asc' },
        },
        publishedBy: {
          select: { fullName: true, email: true },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found in this school');
    }

    // Rule 5: Students and Parents can view PUBLISHED results only
    if (
      (user.role === 'STUDENT' || user.role === 'PARENT') &&
      exam.status !== 'PUBLISHED'
    ) {
      throw new ForbiddenException(
        'Examination results have not been published yet',
      );
    }

    return exam;
  }

  // =========================================================================
  // 2. CONFIGURABLE GRADING RULES
  // =========================================================================

  async getGradingRules(schoolId: string, academicYear?: string) {
    const rules = await this.prisma.gradingRule.findMany({
      where: {
        schoolId,
        ...(academicYear ? { academicYear } : {}),
      },
      orderBy: { minPercentage: 'desc' },
    });

    const defaultRules = [
      {
        grade: 'A+',
        minPercentage: 90,
        maxPercentage: 100,
        gradePoint: 10,
        description: 'Outstanding',
        isPassing: true,
      },
      {
        grade: 'A',
        minPercentage: 80,
        maxPercentage: 89.99,
        gradePoint: 9,
        description: 'Excellent',
        isPassing: true,
      },
      {
        grade: 'B',
        minPercentage: 70,
        maxPercentage: 79.99,
        gradePoint: 8,
        description: 'Very Good',
        isPassing: true,
      },
      {
        grade: 'C',
        minPercentage: 60,
        maxPercentage: 69.99,
        gradePoint: 7,
        description: 'Good',
        isPassing: true,
      },
      {
        grade: 'D',
        minPercentage: 50,
        maxPercentage: 59.99,
        gradePoint: 6,
        description: 'Satisfactory',
        isPassing: true,
      },
      {
        grade: 'E',
        minPercentage: 35,
        maxPercentage: 49.99,
        gradePoint: 5,
        description: 'Pass',
        isPassing: true,
      },
      {
        grade: 'F',
        minPercentage: 0,
        maxPercentage: 34.99,
        gradePoint: 0,
        description: 'Needs Improvement / Fail',
        isPassing: false,
      },
    ];

    if (rules.length > 0) {
      // Custom rules take priority; unconfigured tiers fall back to defaults
      const combined = [
        ...rules,
        ...defaultRules.filter((d) => !rules.some((r) => r.grade === d.grade)),
      ];
      return combined.sort((a, b) => b.minPercentage - a.minPercentage);
    }

    return defaultRules;
  }

  async createGradingRule(schoolId: string, dto: CreateGradingRuleDto) {
    if (dto.minPercentage >= dto.maxPercentage) {
      throw new BadRequestException(
        'minPercentage must be strictly less than maxPercentage',
      );
    }

    return this.prisma.gradingRule.upsert({
      where: {
        schoolId_grade_academicYear: {
          schoolId,
          grade: dto.grade,
          academicYear: dto.academicYear || 'DEFAULT',
        },
      },
      update: {
        name: dto.name,
        minPercentage: dto.minPercentage,
        maxPercentage: dto.maxPercentage,
        gradePoint: dto.gradePoint,
        description: dto.description,
        isPassing: dto.isPassing ?? true,
      },
      create: {
        schoolId,
        name: dto.name,
        minPercentage: dto.minPercentage,
        maxPercentage: dto.maxPercentage,
        grade: dto.grade,
        gradePoint: dto.gradePoint,
        description: dto.description,
        isPassing: dto.isPassing ?? true,
        academicYear: dto.academicYear || 'DEFAULT',
      },
    });
  }

  calculateGrade(
    percentage: number,
    rules: Array<{
      grade: string;
      minPercentage: number;
      maxPercentage: number;
      gradePoint?: number | null;
      description?: string | null;
      isPassing?: boolean;
    }>,
  ): CalculatedGrade {
    const matched = rules.find(
      (r) => percentage >= r.minPercentage && percentage <= r.maxPercentage,
    );

    if (matched) {
      return {
        grade: matched.grade,
        gradePoint: matched.gradePoint ?? 0,
        description: matched.description || '',
        isPassing: matched.isPassing ?? percentage >= 35,
      };
    }

    if (percentage >= 35) {
      return { grade: 'E', gradePoint: 5, description: 'Pass', isPassing: true };
    }
    return {
      grade: 'F',
      gradePoint: 0,
      description: 'Needs Improvement',
      isPassing: false,
    };
  }

  // =========================================================================
  // 3. MARKS ENTRY, VALIDATION, SAFE UPSERT & PERMISSIONS
  // =========================================================================

  async enterMarks(
    schoolId: string,
    examId: string,
    dto: EnterMarksDto,
    user: any,
  ) {
    // 1. Verify exam exists in school
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId },
      include: {
        papers: true,
        classSection: true,
      },
    });
    if (!exam) {
      throw new NotFoundException('Exam not found in this school');
    }

    // 2. Identify target paper
    let targetPaper: any = null;
    if (dto.examPaperId) {
      targetPaper = exam.papers.find((p) => p.id === dto.examPaperId);
    } else if (dto.subjectId) {
      targetPaper = exam.papers.find((p) => p.subjectId === dto.subjectId);
    } else if (exam.papers.length === 1) {
      targetPaper = exam.papers[0];
    }

    if (!targetPaper) {
      throw new NotFoundException(
        'Target examination paper not found for the given subject or paper ID',
      );
    }

    // 3. Rule 2: Teacher Authorization Check
    // Teacher can enter marks ONLY for their assigned subjects/classes
    if (user.role === 'TEACHER') {
      const isClassTeacher = exam.classSection.classTeacherId === user.id;

      const isSubjectTeacherInTimetable =
        await this.prisma.timetableSlot.findFirst({
          where: {
            schoolId,
            classSectionId: exam.classSectionId,
            subjectId: targetPaper.subjectId,
            teacherId: user.id,
          },
        });

      if (!isClassTeacher && !isSubjectTeacherInTimetable) {
        throw new ForbiddenException(
          'You are not authorized to enter marks for this subject and class',
        );
      }
    }

    // 4. Rule 3: Validate Marks (Not negative, cannot exceed maxMarks)
    for (const m of dto.marks) {
      if (m.marksObtained < 0) {
        throw new BadRequestException(
          `Marks obtained cannot be negative (Student: ${m.studentId})`,
        );
      }
      if (m.marksObtained > targetPaper.maxMarks) {
        throw new BadRequestException(
          `Marks obtained (${m.marksObtained}) cannot exceed maximum marks (${targetPaper.maxMarks}) for student ${m.studentId}`,
        );
      }
    }

    // 5. Fetch grading rules for accurate grade calculation
    const rules = await this.getGradingRules(schoolId, exam.academicYear);

    // 6. Safe Atomic Upsert (Prevents duplicate student marks for same exam/subject)
    return this.prisma.$transaction(async (tx) => {
      const recordedMarks: any[] = [];

      for (const m of dto.marks) {
        // Validate student belongs to school
        const student = await tx.student.findFirst({
          where: { id: m.studentId, schoolId },
        });
        if (!student) {
          throw new NotFoundException(
            `Student ${m.studentId} not found in this school`,
          );
        }

        const percentage = Number(
          ((m.marksObtained / targetPaper.maxMarks) * 100).toFixed(2),
        );
        const gradeInfo = this.calculateGrade(percentage, rules);
        const isPassed =
          m.marksObtained >= targetPaper.passingMarks && gradeInfo.isPassing;

        const markRecord = await tx.examMark.upsert({
          where: {
            examPaperId_studentId: {
              examPaperId: targetPaper.id,
              studentId: m.studentId,
            },
          },
          update: {
            marksObtained: m.marksObtained,
            percentage,
            grade: gradeInfo.grade,
            isPassed,
            remarks: m.remarks,
            enteredById: user.id,
          },
          create: {
            schoolId,
            examId,
            examPaperId: targetPaper.id,
            subjectId: targetPaper.subjectId,
            studentId: m.studentId,
            marksObtained: m.marksObtained,
            percentage,
            grade: gradeInfo.grade,
            isPassed,
            remarks: m.remarks,
            enteredById: user.id,
          },
        });

        recordedMarks.push(markRecord);
      }

      // Rule 8: Audit Log for marks changes
      await this.audit.log(
        {
          action: 'MARKS_RECORDED',
          entity: 'ExamMark',
          entityId: exam.id,
          details: {
            examName: exam.name,
            paperId: targetPaper.id,
            subjectId: targetPaper.subjectId,
            totalEntries: dto.marks.length,
            enteredBy: user.email,
          },
          userId: user.id,
          schoolId,
        },
        tx,
      );

      return {
        success: true,
        examId: exam.id,
        paperId: targetPaper.id,
        count: recordedMarks.length,
        marks: recordedMarks,
      };
    });
  }

  // =========================================================================
  // 4. RESULT STATUS & PUBLICATION RULES (Draft, Reviewed, Published)
  // =========================================================================

  async updateExamStatus(
    schoolId: string,
    examId: string,
    status: 'DRAFT' | 'REVIEWED' | 'PUBLISHED',
    user: any,
  ) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId },
      include: {
        classSection: true,
        papers: true,
      },
    });
    if (!exam) {
      throw new NotFoundException('Exam not found in this school');
    }

    // Rule 5: Only authorized users (School Admin / Super Admin) can publish results
    if (status === 'PUBLISHED') {
      if (user.role !== 'SCHOOL_ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException(
          'Only School Administrators are authorized to publish official examination results',
        );
      }
    }

    const updated = await this.prisma.exam.update({
      where: { id: examId },
      data: {
        status,
        ...(status === 'PUBLISHED'
          ? { publishedAt: new Date(), publishedById: user.id }
          : {}),
      },
    });

    // Rule 8: Audit Log for publication & status change
    await this.audit.log({
      action:
        status === 'PUBLISHED' ? 'EXAM_RESULTS_PUBLISHED' : 'EXAM_STATUS_UPDATED',
      entity: 'Exam',
      entityId: examId,
      details: {
        examName: exam.name,
        previousStatus: exam.status,
        newStatus: status,
        updatedBy: user.email,
      },
      userId: user.id,
      schoolId,
    });

    return updated;
  }

  // =========================================================================
  // 5. MARKS SHEET BY EXAM & PAPER
  // =========================================================================

  async getExamMarksSheet(
    schoolId: string,
    examId: string,
    paperId?: string,
    user?: any,
  ) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId },
      include: {
        classSection: {
          include: {
            students: {
              where: { status: 'ACTIVE' },
              select: {
                id: true,
                fullName: true,
                admissionNumber: true,
                rollNumber: true,
              },
              orderBy: { fullName: 'asc' },
            },
          },
        },
        papers: {
          include: { subject: true },
          orderBy: { examDate: 'asc' },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found in this school');
    }

    // Rule 5 check for students & parents
    if (
      user &&
      (user.role === 'STUDENT' || user.role === 'PARENT') &&
      exam.status !== 'PUBLISHED'
    ) {
      throw new ForbiddenException(
        'Examination results have not been published yet',
      );
    }

    const marks = await this.prisma.examMark.findMany({
      where: {
        schoolId,
        examId,
        ...(paperId ? { examPaperId: paperId } : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            admissionNumber: true,
            rollNumber: true,
          },
        },
        subject: { select: { id: true, name: true, code: true } },
      },
    });

    return {
      exam,
      students: exam.classSection.students,
      marks,
    };
  }

  // =========================================================================
  // 6. PRINTABLE REPORT CARDS WITH ATTENDANCE & SUMMARY
  // =========================================================================

  async getReportCard(
    schoolId: string,
    examId: string,
    studentId: string,
    user: any,
  ) {
    // 1. Verify Exam in School
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, schoolId },
      include: {
        classSection: true,
        papers: {
          include: { subject: true },
          orderBy: { examDate: 'asc' },
        },
      },
    });
    if (!exam) {
      throw new NotFoundException('Exam not found in this school');
    }

    // 2. Rule 5: Students and Parents can view PUBLISHED results only
    if (
      (user.role === 'STUDENT' || user.role === 'PARENT') &&
      exam.status !== 'PUBLISHED'
    ) {
      throw new ForbiddenException(
        'Report cards are not yet published for this examination',
      );
    }

    // 3. Rule 8: Enforce Linked-Child and Student Authorization
    if (user.role === 'STUDENT') {
      const ownStudent = await this.prisma.student.findFirst({
        where: { studentUserId: user.id, schoolId },
      });
      if (!ownStudent) {
        throw new ForbiddenException('Student profile not found for current user');
      }
      if (studentId === 'me') {
        studentId = ownStudent.id;
      } else if (ownStudent.id !== studentId) {
        throw new ForbiddenException(
          'Students can view only their own authorized report card',
        );
      }
    } else if (user.role === 'PARENT') {
      const isLinked = await this.prisma.parentStudent.findUnique({
        where: {
          parentId_studentId: {
            parentId: user.id,
            studentId,
          },
        },
      });
      if (!isLinked) {
        throw new ForbiddenException(
          'You are not authorized to view report cards for this student',
        );
      }
    }

    // 4. Fetch Student Details
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        classSection: true,
      },
    });
    if (!student) {
      throw new NotFoundException('Student not found in this school');
    }

    // 5. Fetch School Details
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        legalName: true,
        schoolCode: true,
        board: true,
        city: true,
        state: true,
        country: true,
        timezone: true,
      },
    });

    // 6. Fetch Student Marks for all papers of this exam
    const marks = await this.prisma.examMark.findMany({
      where: {
        schoolId,
        examId,
        studentId,
      },
      include: {
        subject: true,
        examPaper: true,
      },
    });

    const marksBySubjectId = new Map(marks.map((m) => [m.subjectId, m]));

    // 7. Calculate Subject-Wise Breakdown and Totals
    let totalMaxMarks = 0;
    let totalMarksObtained = 0;
    let allPassed = true;
    let subjectsPassed = 0;
    let subjectsFailed = 0;

    const subjectBreakdown = exam.papers.map((paper) => {
      const mark = marksBySubjectId.get(paper.subjectId);
      const obtained = mark?.marksObtained ?? 0;
      const isPresent = mark !== undefined;
      const percentage = isPresent
        ? Number(((obtained / paper.maxMarks) * 100).toFixed(2))
        : 0;
      const isPassed = isPresent && obtained >= paper.passingMarks;

      totalMaxMarks += paper.maxMarks;
      totalMarksObtained += obtained;

      if (isPassed) {
        subjectsPassed++;
      } else {
        subjectsFailed++;
        allPassed = false;
      }

      return {
        subjectId: paper.subjectId,
        subjectName: paper.subject.name,
        subjectCode: paper.subject.code,
        examDate: paper.examDate,
        maxMarks: paper.maxMarks,
        passingMarks: paper.passingMarks,
        marksObtained: obtained,
        percentage,
        grade: mark?.grade || (isPassed ? 'E' : 'F'),
        isPassed,
        remarks: mark?.remarks || '',
      };
    });

    const overallPercentage =
      totalMaxMarks > 0
        ? Number(((totalMarksObtained / totalMaxMarks) * 100).toFixed(2))
        : 0;

    const gradingRules = await this.getGradingRules(
      schoolId,
      exam.academicYear,
    );
    const overallGradeInfo = this.calculateGrade(
      overallPercentage,
      gradingRules,
    );

    const overallResult =
      allPassed && overallPercentage >= 35 ? 'PASS' : 'FAIL';

    // 8. Fetch Attendance Summary for this student
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        schoolId,
        studentId,
      },
    });

    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let excusedLeaves = 0;

    for (const att of attendanceRecords) {
      if (att.status === 'PRESENT') presentDays += 1;
      else if (att.status === 'LATE') {
        lateDays += 1;
        presentDays += 1;
      } else if (att.status === 'HALF_DAY') {
        halfDays += 1;
        presentDays += 0.5;
      } else if (att.status === 'EXCUSED_LEAVE') excusedLeaves += 1;
      else if (att.status === 'ABSENT') absentDays += 1;
    }

    const totalWorkingDays = attendanceRecords.length;
    const attendancePercentage =
      totalWorkingDays > 0
        ? Number(((presentDays / totalWorkingDays) * 100).toFixed(1))
        : null;

    return {
      school,
      student: {
        id: student.id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        gradeLevel: student.gradeLevel,
        section: student.section,
        className:
          student.classSection?.className || student.gradeLevel || '',
        classSectionName: student.classSection
          ? `${student.classSection.className}-${student.classSection.section}`
          : `${student.gradeLevel} ${student.section || ''}`.trim(),
        dateOfBirth: student.dateOfBirth,
        academicYear: student.academicYear || exam.academicYear,
      },
      exam: {
        id: exam.id,
        name: exam.name,
        academicYear: exam.academicYear,
        term: exam.term,
        status: exam.status,
        publishedAt: exam.publishedAt,
      },
      subjects: subjectBreakdown,
      totals: {
        totalMaxMarks,
        totalMarksObtained,
        overallPercentage,
        overallGrade: overallGradeInfo.grade,
        overallGradePoint: overallGradeInfo.gradePoint,
        overallDescription: overallGradeInfo.description,
        overallResult,
        subjectsPassed,
        subjectsFailed,
        totalSubjects: exam.papers.length,
      },
      attendanceSummary: {
        totalWorkingDays,
        presentDays,
        absentDays,
        lateDays,
        halfDays,
        excusedLeaves,
        attendancePercentage,
      },
      generatedAt: new Date(),
    };
  }

  async getParentChildrenReportCards(schoolId: string, user: any) {
    // 1. Get linked children
    const links = await this.prisma.parentStudent.findMany({
      where: { parentId: user.id },
      include: {
        student: {
          include: {
            classSection: true,
          },
        },
      },
    });

    const results: any[] = [];

    for (const link of links) {
      const student = link.student;
      // Get all published exams for student's class
      const exams = await this.prisma.exam.findMany({
        where: {
          schoolId,
          classSectionId: student.classSectionId || undefined,
          status: 'PUBLISHED',
        },
        include: {
          papers: {
            include: { subject: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const studentExams: any[] = [];
      for (const exam of exams) {
        try {
          const reportCard = await this.getReportCard(
            schoolId,
            exam.id,
            student.id,
            user,
          );
          studentExams.push(reportCard);
        } catch {
          // Skip if error generating
        }
      }

      results.push({
        student: {
          id: student.id,
          fullName: student.fullName,
          admissionNumber: student.admissionNumber,
          gradeLevel: student.gradeLevel,
          section: student.section,
          classSectionName: student.classSection
            ? `${student.classSection.className}-${student.classSection.section}`
            : student.gradeLevel,
        },
        reportCards: studentExams,
      });
    }

    return results;
  }
}
