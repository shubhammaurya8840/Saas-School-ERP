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
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserRole, Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";

export interface AuthenticatedUserPayload {
  id: string;
  email: string;
  role: UserRole;
  schoolId?: string | null;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  /**
   * Helper: Generate unique employee ID for school
   */
  private async generateUniqueEmployeeId(schoolId: string, role: UserRole): Promise<string> {
    const prefix = role === UserRole.TEACHER ? "TCH" : role === UserRole.ACCOUNTANT ? "ACC" : role === UserRole.LIBRARIAN ? "LIB" : "EMP";
    const count = await this.prisma.user.count({
      where: {
        schoolId,
        role: { in: [UserRole.TEACHER, UserRole.STAFF, UserRole.ACCOUNTANT, UserRole.LIBRARIAN] },
      },
    });

    const sequence = (count + 1).toString().padStart(4, "0");
    const generated = `${prefix}-${sequence}`;

    // Verify uniqueness
    const existing = await this.prisma.user.findFirst({
      where: { schoolId, employeeId: generated },
    });

    if (existing) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      return `${prefix}-${rand}`;
    }

    return generated;
  }

  /**
   * Create a new school user (Teachers, Staff, Accountants)
   * Only School Admin can create users for their own school
   */
  async create(
    caller: AuthenticatedUserPayload,
    dto: CreateUserDto,
    ipAddress?: string
  ) {
    if (caller.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        "Super Admin cannot directly create school users. School Admins manage their own staff."
      );
    }

    if (!caller.schoolId) {
      throw new ForbiddenException("Caller does not belong to a valid school tenant.");
    }

    if (dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Cannot create a SUPER_ADMIN user.");
    }

    const schoolId = caller.schoolId;

    // 1. Quota Check
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException("School tenant not found.");
    }

    const staffRoles: UserRole[] = [UserRole.TEACHER, UserRole.STAFF, UserRole.ACCOUNTANT, UserRole.LIBRARIAN];
    if (staffRoles.includes(dto.role)) {
      const currentStaffCount = await this.prisma.user.count({
        where: { schoolId, role: { in: staffRoles } },
      });

      if (currentStaffCount >= school.maxStaff) {
        throw new BadRequestException(
          `School faculty quota reached (${school.maxStaff} staff members allowed). Please upgrade tier.`
        );
      }
    }

    // 2. Email uniqueness check
    const normalizedEmail = dto.email.toLowerCase().trim();
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingEmail) {
      throw new ConflictException(`User with email '${dto.email}' already exists.`);
    }

    // 3. Employee ID handling
    let finalEmployeeId = dto.employeeId?.trim();
    if (finalEmployeeId) {
      const existingEmpId = await this.prisma.user.findFirst({
        where: { schoolId, employeeId: finalEmployeeId },
      });
      if (existingEmpId) {
        throw new ConflictException(
          `Employee ID '${finalEmployeeId}' is already assigned to another staff member in this school.`
        );
      }
    } else {
      finalEmployeeId = await this.generateUniqueEmployeeId(schoolId, dto.role);
    }

    // 4. Password / Invitation handling
    let passwordHash: string | null = null;
    let invitationToken: string | null = null;
    let invitationExpiresAt: Date | null = null;

    if (dto.password && dto.password.trim()) {
      passwordHash = await bcrypt.hash(dto.password.trim(), 12);
    } else {
      invitationToken = crypto.randomBytes(32).toString("hex");
      invitationExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
    }

    // 5. Database write
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: dto.fullName.trim(),
        role: dto.role,
        phone: dto.phone?.trim() || null,
        designation: dto.designation?.trim() || null,
        department: dto.department?.trim() || null,
        employeeId: finalEmployeeId,
        passwordHash,
        invitationToken,
        invitationExpiresAt,
        schoolId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        designation: true,
        department: true,
        employeeId: true,
        isActive: true,
        schoolId: true,
        createdAt: true,
      },
    });

    // 6. Audit Trail
    await this.auditService.log({
      action: "STAFF_USER_CREATED",
      entity: "User",
      entityId: user.id,
      userId: caller.id,
      schoolId,
      ipAddress,
      details: {
        role: user.role,
        employeeId: user.employeeId,
        email: user.email,
      },
    });

    const invitationUrl = invitationToken
      ? `https://${school.slug}.edusaas.io/setup-password?token=${invitationToken}`
      : undefined;

    return {
      user,
      invitation: invitationToken
        ? {
            token: invitationToken,
            expiresAt: invitationExpiresAt?.toISOString(),
            invitationUrl,
          }
        : undefined,
    };
  }

  /**
   * List users within the caller's school
   */
  async findAll(
    caller: AuthenticatedUserPayload,
    query?: {
      role?: UserRole;
      search?: string;
      department?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    if (caller.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        "Super Admin cannot access private school user directories. Tenant isolation strictly enforced."
      );
    }

    if (!caller.schoolId) {
      throw new ForbiddenException("Invalid tenant context.");
    }

    const { role, search, department, limit = 100, offset = 0 } = query || {};

    const where: Prisma.UserWhereInput = {
      schoolId: caller.schoolId,
    };

    if (role) {
      where.role = role;
    }

    if (department && department.trim() && department !== "all") {
      where.department = { equals: department.trim(), mode: "insensitive" };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { employeeId: { contains: q, mode: "insensitive" } },
        { designation: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          designation: true,
          department: true,
          employeeId: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      total,
      users,
    };
  }

  /**
   * Get single user by ID within caller's school
   */
  async findOne(caller: AuthenticatedUserPayload, id: string) {
    if (caller.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        "Super Admin cannot access individual school user profiles."
      );
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id,
        schoolId: caller.schoolId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        designation: true,
        department: true,
        employeeId: true,
        isActive: true,
        createdAt: true,
        school: {
          select: {
            id: true,
            schoolCode: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found or access denied.");
    }

    return user;
  }

  /**
   * Update user within caller's school
   */
  async update(
    caller: AuthenticatedUserPayload,
    id: string,
    dto: UpdateUserDto,
    ipAddress?: string
  ) {
    if (caller.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Super Admin cannot modify school users.");
    }

    const existing = await this.prisma.user.findFirst({
      where: { id, schoolId: caller.schoolId },
    });

    if (!existing) {
      throw new NotFoundException("User not found or access denied.");
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        fullName: dto.fullName?.trim() || undefined,
        phone: dto.phone?.trim() || undefined,
        designation: dto.designation?.trim() || undefined,
        department: dto.department?.trim() || undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        designation: true,
        department: true,
        employeeId: true,
        isActive: true,
        updatedAt: true,
      },
    });

    await this.auditService.log({
      action: "STAFF_USER_UPDATED",
      entity: "User",
      entityId: id,
      userId: caller.id,
      schoolId: caller.schoolId,
      ipAddress,
      details: { updatedFields: Object.keys(dto) },
    });

    return updated;
  }

  /**
   * Deactivate or delete user within caller's school
   */
  async delete(caller: AuthenticatedUserPayload, id: string, ipAddress?: string) {
    if (caller.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Super Admin cannot delete school users.");
    }

    if (caller.id === id) {
      throw new BadRequestException("You cannot delete your own administrator account.");
    }

    const existing = await this.prisma.user.findFirst({
      where: { id, schoolId: caller.schoolId },
    });

    if (!existing) {
      throw new NotFoundException("User not found or access denied.");
    }

    await this.prisma.user.delete({
      where: { id },
    });

    await this.auditService.log({
      action: "STAFF_USER_DELETED",
      entity: "User",
      entityId: id,
      userId: caller.id,
      schoolId: caller.schoolId,
      ipAddress,
      details: { email: existing.email, role: existing.role },
    });

    return { success: true, message: "User deleted successfully." };
  }
}
