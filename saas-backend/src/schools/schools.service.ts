import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { RegisterSchoolDto } from "./dto/register-school.dto";
import { SchoolStatus, SubscriptionPlan, UserRole, Prisma } from "@prisma/client";

export const DEFAULT_MODULE_KEYS = [
  { key: "school_admin", default: true },
  { key: "student_records", default: true },
  { key: "accounts_fees", default: true },
  { key: "teacher_portal", default: true },
  { key: "parent_portal", default: true },
  { key: "student_portal", default: true },
  { key: "attendance", default: true },
  { key: "examinations", default: true },
  { key: "timetable", default: true },
  { key: "notices", default: true },
  { key: "library", default: true },
  { key: "transport", default: false },
  { key: "payroll_hr", default: false },
  { key: "reports", default: true },
];

@Injectable()
export class SchoolsService {
  private readonly logger = new Logger(SchoolsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Generates a unique 4-digit code formatted as SCH-XXXX (e.g. SCH-1042)
   */
  private async generateUniqueSchoolCode(
    tx: Prisma.TransactionClient
  ): Promise<string> {
    for (let attempts = 0; attempts < 15; attempts++) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000);
      const code = `SCH-${randomDigits}`;

      const existing = await tx.school.findUnique({
        where: { schoolCode: code },
        select: { id: true },
      });

      if (!existing) {
        return code;
      }
    }

    // Fallback: use timestamp based code if random fails
    return `SCH-${Date.now().toString().slice(-4)}`;
  }

  /**
   * Atomic School Tenant Registration Transaction
   * - PRD Section 5: All-or-Nothing Guarantee
   * - Saves School, Module Entitlements, Admin Setup Invitation Token
   */
  async registerSchool(
    dto: RegisterSchoolDto,
    creatorUserId?: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const slug = dto.slug.trim().toLowerCase();
    const adminEmail = dto.adminEmail.trim().toLowerCase();

    // Check slug uniqueness
    const existingSlug = await this.prisma.school.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existingSlug) {
      throw new ConflictException(
        `Workspace slug '${slug}' is already taken. Please choose another identifier.`
      );
    }

    // Check admin email uniqueness
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    });
    if (existingEmail) {
      throw new ConflictException(
        `A user account with email '${adminEmail}' already exists in the system.`
      );
    }

    // Execute atomic commit
    return await this.prisma.$transaction(async (tx) => {
      // 1. Generate unique school code (SCH-XXXX)
      const schoolCode = await this.generateUniqueSchoolCode(tx);

      // 2. Create School record
      const school = await tx.school.create({
        data: {
          schoolCode,
          name: dto.name.trim(),
          legalName: dto.legalName?.trim() || null,
          slug,
          board: dto.board || "CBSE",
          academicYear: dto.academicYear?.trim() || null,
          city: dto.city.trim(),
          state: dto.state.trim(),
          country: dto.country || "India",
          timezone: dto.timezone || "Asia/Kolkata",
          currency: dto.currency || "INR",
          status: SchoolStatus.ACTIVE,
          plan: dto.plan || SubscriptionPlan.GROWTH,
          maxStudents: dto.maxStudents || 1000,
          maxStaff: dto.maxStaff || 100,
          storageLimitMb: dto.storageLimitMb || 5000,
          allowStudentUploads:
            dto.uploadSettings?.allowStudentUploads !== undefined
              ? dto.uploadSettings.allowStudentUploads
              : true,
          allowParentUploads:
            dto.uploadSettings?.allowParentUploads !== undefined
              ? dto.uploadSettings.allowParentUploads
              : true,
          allowStaffUploads:
            dto.uploadSettings?.allowStaffUploads !== undefined
              ? dto.uploadSettings.allowStaffUploads
              : true,
        },
      });

      // 3. Create Module records (Zero Data Loss Architecture)
      const moduleRecords = DEFAULT_MODULE_KEYS.map((m) => {
        const isEnabled =
          dto.modules && dto.modules[m.key] !== undefined
            ? Boolean(dto.modules[m.key])
            : m.default;

        return {
          schoolId: school.id,
          moduleKey: m.key,
          isEnabled,
        };
      });

      await tx.schoolModule.createMany({
        data: moduleRecords,
      });

      // 4. Generate Zero-Knowledge Single-Use Invitation Token (PRD Section 6)
      const invitationToken = crypto.randomBytes(32).toString("hex");
      const invitationExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours

      // 5. Create Primary Administrator user
      const adminUser = await tx.user.create({
        data: {
          email: adminEmail,
          fullName: dto.adminName.trim(),
          phone: dto.adminPhone?.trim() || null,
          role: UserRole.SCHOOL_ADMIN,
          designation: dto.adminDesignation?.trim() || "Principal / Director",
          schoolId: school.id,
          invitationToken,
          invitationExpiresAt,
          passwordHash: null, // Password must be set via invitation token
          isActive: true,
        },
      });

      // 6. Record Platform Audit Trail
      await this.auditService.log(
        {
          action: "SCHOOL_REGISTERED",
          entity: "School",
          entityId: school.id,
          userId: creatorUserId,
          schoolId: school.id,
          ipAddress,
          userAgent,
          details: {
            schoolCode: school.schoolCode,
            slug: school.slug,
            adminEmail: adminUser.email,
            plan: school.plan,
          },
        },
        tx
      );

      this.logger.log(
        `🏛️ School tenant provisioned: ${school.name} (${school.schoolCode}) -> slug: ${school.slug}`
      );

      const invitationUrl = `https://${school.slug}.edusaas.io/setup-password?token=${invitationToken}`;

      return {
        school: {
          id: school.id,
          schoolCode: school.schoolCode,
          name: school.name,
          slug: school.slug,
          board: school.board,
          city: school.city,
          state: school.state,
          plan: school.plan,
          status: school.status,
          createdAt: school.createdAt,
        },
        admin: {
          id: adminUser.id,
          fullName: adminUser.fullName,
          email: adminUser.email,
          designation: adminUser.designation,
        },
        invitation: {
          token: invitationToken,
          expiresAt: invitationExpiresAt.toISOString(),
          invitationUrl,
        },
      };
    });
  }

  /**
   * Authorized School Directory Listing
   * SuperAdmin sees all schools with aggregate metrics (no private student records)
   */
  async findAll(params?: {
    search?: string;
    status?: string;
    plan?: string;
    limit?: number;
    offset?: number;
  }) {
    const { search, status, plan, limit = 50, offset = 0 } = params || {};

    const where: Prisma.SchoolWhereInput = {};

    if (status && status !== "all") {
      where.status = status.toUpperCase() as SchoolStatus;
    }

    if (plan && plan !== "all") {
      where.plan = plan.toUpperCase() as SubscriptionPlan;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { schoolCode: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, schools] = await Promise.all([
      this.prisma.school.count({ where }),
      this.prisma.school.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        include: {
          users: {
            where: { role: UserRole.SCHOOL_ADMIN },
            take: 1,
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              designation: true,
            },
          },
          modules: {
            where: { isEnabled: true },
            select: { moduleKey: true },
          },
          _count: {
            select: { users: true },
          },
        },
      }),
    ]);

    // Aggregate statistics
    const [activeCount, trialCount, suspendedCount] = await Promise.all([
      this.prisma.school.count({ where: { status: SchoolStatus.ACTIVE } }),
      this.prisma.school.count({ where: { status: SchoolStatus.TRIAL } }),
      this.prisma.school.count({ where: { status: SchoolStatus.SUSPENDED } }),
    ]);

    const formattedSchools = schools.map((s) => ({
      id: s.id,
      schoolCode: s.schoolCode,
      name: s.name,
      legalName: s.legalName,
      slug: s.slug,
      board: s.board,
      academicYear: s.academicYear,
      city: s.city,
      state: s.state,
      country: s.country,
      status: s.status.toLowerCase(),
      plan: s.plan.toLowerCase(),
      quotas: {
        maxStudents: s.maxStudents,
        maxStaff: s.maxStaff,
        storageLimitMb: s.storageLimitMb,
      },
      uploadSettings: {
        allowStudentUploads: s.allowStudentUploads,
        allowParentUploads: s.allowParentUploads,
        allowStaffUploads: s.allowStaffUploads,
      },
      primaryAdmin: s.users[0]
        ? {
            id: s.users[0].id,
            name: s.users[0].fullName,
            email: s.users[0].email,
            phone: s.users[0].phone,
            designation: s.users[0].designation,
          }
        : null,
      activeModulesCount: s.modules.length,
      createdAt: s.createdAt.toISOString(),
    }));

    return {
      total,
      counts: {
        all: total,
        active: activeCount,
        trial: trialCount,
        suspended: suspendedCount,
      },
      schools: formattedSchools,
    };
  }

  /**
   * Get full details of a specific school
   */
  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        modules: true,
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            role: true,
            designation: true,
            isActive: true,
          },
        },
      },
    });

    if (!school) {
      throw new NotFoundException(`School tenant '${id}' not found.`);
    }

    return school;
  }

  /**
   * Toggle module entitlement for a school (Zero Data Loss)
   */
  async toggleModule(
    schoolId: string,
    moduleKey: string,
    isEnabled: boolean,
    userId?: string
  ) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException(`School '${schoolId}' not found.`);
    }

    const updatedModule = await this.prisma.schoolModule.upsert({
      where: {
        schoolId_moduleKey: { schoolId, moduleKey },
      },
      create: {
        schoolId,
        moduleKey,
        isEnabled,
      },
      update: {
        isEnabled,
      },
    });

    await this.auditService.log({
      action: isEnabled ? "MODULE_ENABLED" : "MODULE_DISABLED",
      entity: "SchoolModule",
      entityId: updatedModule.id,
      userId,
      schoolId,
      details: { moduleKey, isEnabled },
    });

    return updatedModule;
  }

  /**
   * Toggle school status (ACTIVE <-> SUSPENDED)
   */
  async updateStatus(schoolId: string, status: SchoolStatus, userId?: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException(`School '${schoolId}' not found.`);
    }

    const updated = await this.prisma.school.update({
      where: { id: schoolId },
      data: { status },
    });

    await this.auditService.log({
      action: "SCHOOL_STATUS_UPDATED",
      entity: "School",
      entityId: schoolId,
      userId,
      schoolId,
      details: { previousStatus: school.status, newStatus: status },
    });

    return updated;
  }
}
