import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { AuthenticatedUserPayload } from "../users/users.service";
import { UserRole, Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Helper: Check if grade level is restricted to Parent Portal only
   * Rule 6: LKG through Class 4 use parent portal only. Class 5+ can have student portal access.
   */
  private isParentPortalOnlyGrade(gradeLevel: string): boolean {
    const normalized = gradeLevel.toUpperCase().trim();
    const parentOnlyGrades = [
      "LKG",
      "UKG",
      "NURSERY",
      "PRE-K",
      "KG",
      "CLASS 1",
      "GRADE 1",
      "CLASS 2",
      "GRADE 2",
      "CLASS 3",
      "GRADE 3",
      "CLASS 4",
      "GRADE 4",
      "1",
      "2",
      "3",
      "4",
    ];

    return parentOnlyGrades.includes(normalized);
  }

  /**
   * Helper: Generate unique admission number within school
   */
  private async generateUniqueAdmissionNumber(
    schoolId: string,
    academicYear?: string
  ): Promise<string> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { schoolCode: true },
    });

    const prefix = school?.schoolCode ? school.schoolCode.replace(/[^A-Za-z0-9]/g, "") : "SCH";
    const year = academicYear
      ? academicYear.slice(0, 4)
      : new Date().getFullYear().toString();

    const count = await this.prisma.student.count({
      where: { schoolId },
    });

    const sequence = (count + 1).toString().padStart(4, "0");
    const admissionNumber = `${prefix}-ADM-${year}-${sequence}`;

    const existing = await this.prisma.student.findFirst({
      where: { schoolId, admissionNumber },
    });

    if (existing) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}-ADM-${year}-${rand}`;
    }

    return admissionNumber;
  }

  /**
   * Register a new student and link their parents/guardians
   * Allowed for Accountant and School Admin
   */
  async create(
    caller: AuthenticatedUserPayload,
    dto: CreateStudentDto,
    ipAddress?: string
  ) {
    if (caller.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        "Super Admin cannot enroll students. School tenant isolation strictly enforced."
      );
    }

    if (!caller.schoolId) {
      throw new ForbiddenException("Invalid school tenant context.");
    }

    const schoolId = caller.schoolId;

    // 1. Rule 6 Validation: LKG-Class 4 parent portal only; Class 5+ student portal
    const isRestrictedToParent = this.isParentPortalOnlyGrade(dto.gradeLevel);
    if (isRestrictedToParent && dto.enableStudentPortalLogin) {
      throw new BadRequestException(
        "Students from LKG through Class 4 use the parent portal only. Student portal access is permitted from Class 5 onward."
      );
    }

    // 2. School Quota Check
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException("School tenant not found.");
    }

    const currentStudentCount = await this.prisma.student.count({
      where: { schoolId },
    });

    if (currentStudentCount >= school.maxStudents) {
      throw new BadRequestException(
        `School student enrollment quota reached (${school.maxStudents} students allowed). Please upgrade your subscription plan.`
      );
    }

    // 3. Admission number determination & uniqueness check
    let finalAdmissionNumber = dto.admissionNumber?.trim();
    if (finalAdmissionNumber) {
      const existingAdm = await this.prisma.student.findFirst({
        where: { schoolId, admissionNumber: finalAdmissionNumber },
      });
      if (existingAdm) {
        throw new ConflictException(
          `Admission number '${finalAdmissionNumber}' already exists in this school.`
        );
      }
    } else {
      finalAdmissionNumber = await this.generateUniqueAdmissionNumber(
        schoolId,
        dto.academicYear || school.academicYear || undefined
      );
    }

    // 4. Atomic Transaction: Parent creation/reuse + Student enrollment + Student User creation (if Class 5+) + ParentStudent junction
    return this.prisma.$transaction(async (tx) => {
      // 4A. Parent Account Handling (Rule 5: Allow one parent account to link to multiple children)
      const normalizedParentEmail = dto.parentEmail.toLowerCase().trim();
      let parentUser = await tx.user.findFirst({
        where: {
          email: normalizedParentEmail,
          schoolId,
          role: UserRole.PARENT,
        },
      });

      let parentInvitationToken: string | null = null;

      if (!parentUser) {
        // Check if email is used with another role in this school or platform
        const conflictingUser = await tx.user.findUnique({
          where: { email: normalizedParentEmail },
        });

        if (conflictingUser) {
          throw new ConflictException(
            `Email '${dto.parentEmail}' is already registered with role ${conflictingUser.role}.`
          );
        }

        parentInvitationToken = crypto.randomBytes(32).toString("hex");
        const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        parentUser = await tx.user.create({
          data: {
            email: normalizedParentEmail,
            fullName: dto.parentName.trim(),
            phone: dto.parentPhone?.trim() || null,
            role: UserRole.PARENT,
            schoolId,
            invitationToken: parentInvitationToken,
            invitationExpiresAt,
            isActive: true,
          },
        });
      }

      // 4B. Optional Student User Account (Class 5+ only)
      let studentUserId: string | null = null;
      let studentPasswordHash: string | null = null;

      if (!isRestrictedToParent && dto.enableStudentPortalLogin && dto.studentEmail) {
        const normalizedStudentEmail = dto.studentEmail.toLowerCase().trim();
        const existingStudentUser = await tx.user.findUnique({
          where: { email: normalizedStudentEmail },
        });

        if (existingStudentUser) {
          throw new ConflictException(
            `Student email '${dto.studentEmail}' is already registered.`
          );
        }

        if (dto.studentPassword && dto.studentPassword.trim()) {
          studentPasswordHash = await bcrypt.hash(dto.studentPassword.trim(), 12);
        }

        const studentUser = await tx.user.create({
          data: {
            email: normalizedStudentEmail,
            fullName: dto.fullName.trim(),
            role: UserRole.STUDENT,
            schoolId,
            passwordHash: studentPasswordHash,
            isActive: true,
          },
        });

        studentUserId = studentUser.id;
      }

      // 4C. Create Student Record
      const student = await tx.student.create({
        data: {
          admissionNumber: finalAdmissionNumber,
          fullName: dto.fullName.trim(),
          gradeLevel: dto.gradeLevel.trim(),
          section: dto.section?.trim() || "A",
          rollNumber: dto.rollNumber?.trim() || null,
          academicYear: dto.academicYear?.trim() || school.academicYear || "2026-2027",
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          gender: dto.gender?.trim() || null,
          address: dto.address?.trim() || null,
          status: "ACTIVE",
          hasStudentPortalAccess: Boolean(studentUserId),
          studentUserId,
          schoolId,
        },
      });

      // 4D. Link Parent to Student via ParentStudent Junction Table
      await tx.parentStudent.create({
        data: {
          parentId: parentUser.id,
          studentId: student.id,
          relationship: dto.parentRelationship?.toUpperCase().trim() || "GUARDIAN",
          isPrimary: true,
        },
      });

      // 4E. Platform Audit Trail
      await this.auditService.log(
        {
          action: "STUDENT_ENROLLED",
          entity: "Student",
          entityId: student.id,
          userId: caller.id,
          schoolId,
          ipAddress,
          details: {
            admissionNumber: student.admissionNumber,
            gradeLevel: student.gradeLevel,
            parentEmail: parentUser.email,
            studentUserId,
          },
        },
        tx
      );

      this.logger.log(
        `🎓 Student enrolled: ${student.fullName} (${student.admissionNumber}) in ${school.name}`
      );

      return {
        student: {
          id: student.id,
          admissionNumber: student.admissionNumber,
          fullName: student.fullName,
          gradeLevel: student.gradeLevel,
          section: student.section,
          rollNumber: student.rollNumber,
          academicYear: student.academicYear,
          hasStudentPortalAccess: student.hasStudentPortalAccess,
          status: student.status,
          createdAt: student.createdAt,
        },
        parent: {
          id: parentUser.id,
          fullName: parentUser.fullName,
          email: parentUser.email,
          phone: parentUser.phone,
          relationship: dto.parentRelationship || "GUARDIAN",
        },
        portalAccess: {
          parentPortal: true,
          studentPortal: student.hasStudentPortalAccess,
          studentEmail: dto.studentEmail || null,
        },
        parentInvitationUrl: parentInvitationToken
          ? `https://${school.slug}.edusaas.io/setup-password?token=${parentInvitationToken}`
          : undefined,
      };
    });
  }

  /**
   * List students with filters within caller's school
   */
  async findAll(
    caller: AuthenticatedUserPayload,
    query?: {
      gradeLevel?: string;
      section?: string;
      search?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    if (caller.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        "Super Admin cannot access individual student records. Tenant isolation strictly enforced."
      );
    }

    if (!caller.schoolId) {
      throw new ForbiddenException("Invalid school tenant context.");
    }

    const {
      gradeLevel,
      section,
      search,
      status,
      limit = 50,
      offset = 0,
    } = query || {};

    const where: Prisma.StudentWhereInput = {
      schoolId: caller.schoolId,
    };

    if (gradeLevel && gradeLevel !== "all") {
      where.gradeLevel = { equals: gradeLevel.trim(), mode: "insensitive" };
    }

    if (section && section !== "all") {
      where.section = { equals: section.trim(), mode: "insensitive" };
    }

    if (status && status !== "all") {
      where.status = status.toUpperCase();
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { admissionNumber: { contains: q, mode: "insensitive" } },
        { rollNumber: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, students] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          parents: {
            include: {
              parent: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
            },
          },
          studentUser: {
            select: {
              id: true,
              email: true,
              isActive: true,
            },
          },
        },
      }),
    ]);

    const formatted = students.map((s) => ({
      id: s.id,
      admissionNumber: s.admissionNumber,
      fullName: s.fullName,
      gradeLevel: s.gradeLevel,
      section: s.section,
      rollNumber: s.rollNumber,
      academicYear: s.academicYear,
      gender: s.gender,
      status: s.status,
      hasStudentPortalAccess: s.hasStudentPortalAccess,
      studentAccount: s.studentUser,
      primaryParent: s.parents[0]
        ? {
            id: s.parents[0].parent.id,
            name: s.parents[0].parent.fullName,
            email: s.parents[0].parent.email,
            phone: s.parents[0].parent.phone,
            relationship: s.parents[0].relationship,
          }
        : null,
      parentsCount: s.parents.length,
      createdAt: s.createdAt,
    }));

    return {
      total,
      students: formatted,
    };
  }

  /**
   * Get single student profile with complete linked parents and portal info
   */
  async findOne(caller: AuthenticatedUserPayload, id: string) {
    if (caller.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        "Super Admin cannot access individual student records."
      );
    }

    const student = await this.prisma.student.findFirst({
      where: {
        id,
        schoolId: caller.schoolId,
      },
      include: {
        parents: {
          include: {
            parent: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                isActive: true,
              },
            },
          },
        },
        studentUser: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            schoolCode: true,
            board: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException("Student not found or access denied.");
    }

    return student;
  }

  /**
   * Update student details
   */
  async update(
    caller: AuthenticatedUserPayload,
    id: string,
    dto: UpdateStudentDto,
    ipAddress?: string
  ) {
    if (caller.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Super Admin cannot modify student records.");
    }

    const existing = await this.prisma.student.findFirst({
      where: { id, schoolId: caller.schoolId },
    });

    if (!existing) {
      throw new NotFoundException("Student not found or access denied.");
    }

    if (dto.gradeLevel && this.isParentPortalOnlyGrade(dto.gradeLevel) && dto.hasStudentPortalAccess) {
      throw new BadRequestException(
        "Students in LKG through Class 4 cannot have student portal access."
      );
    }

    const updated = await this.prisma.student.update({
      where: { id },
      data: {
        fullName: dto.fullName?.trim() || undefined,
        gradeLevel: dto.gradeLevel?.trim() || undefined,
        section: dto.section?.trim() || undefined,
        rollNumber: dto.rollNumber?.trim() || undefined,
        academicYear: dto.academicYear?.trim() || undefined,
        address: dto.address?.trim() || undefined,
        status: dto.status?.toUpperCase().trim() || undefined,
        hasStudentPortalAccess:
          dto.hasStudentPortalAccess !== undefined
            ? dto.hasStudentPortalAccess
            : undefined,
      },
    });

    await this.auditService.log({
      action: "STUDENT_UPDATED",
      entity: "Student",
      entityId: id,
      userId: caller.id,
      schoolId: caller.schoolId,
      ipAddress,
      details: { updatedFields: Object.keys(dto) },
    });

    return updated;
  }

  /**
   * List parents in caller's school and their linked children (Multi-Child View)
   */
  async findParentsWithChildren(
    caller: AuthenticatedUserPayload,
    query?: { search?: string }
  ) {
    if (caller.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Super Admin cannot view parent directories.");
    }

    const where: Prisma.UserWhereInput = {
      schoolId: caller.schoolId,
      role: UserRole.PARENT,
    };

    if (query?.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
      ];
    }

    const parents = await this.prisma.user.findMany({
      where,
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        parentLinks: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                admissionNumber: true,
                gradeLevel: true,
                section: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return parents.map((p) => ({
      id: p.id,
      name: p.fullName,
      email: p.email,
      phone: p.phone,
      childrenCount: p.parentLinks.length,
      children: p.parentLinks.map((l) => ({
        ...l.student,
        relationship: l.relationship,
        isPrimary: l.isPrimary,
      })),
    }));
  }
}
