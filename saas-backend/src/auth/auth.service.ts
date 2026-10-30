import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { LoginDto } from "./dto/login.dto";
import { RedeemInvitationDto } from "./dto/redeem-invitation.dto";
import { UserRole } from "@prisma/client";

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService
  ) {}

  async onModuleInit() {
    await this.seedInitialSuperAdmin();
  }

  /**
   * Seed default platform SuperAdmin user if no SuperAdmin exists in database
   */
  async seedInitialSuperAdmin() {
    try {
      const existingSuperAdmin = await this.prisma.user.findFirst({
        where: { role: UserRole.SUPER_ADMIN },
      });

      if (!existingSuperAdmin) {
        const email =
          process.env.INITIAL_SUPERADMIN_EMAIL || "alex.sterling@edusaas.io";
        const password =
          process.env.INITIAL_SUPERADMIN_PASSWORD || "SuperAdmin@2026";
        const fullName =
          process.env.INITIAL_SUPERADMIN_NAME || "Alex Sterling";

        const passwordHash = await bcrypt.hash(password, 12);

        const superAdmin = await this.prisma.user.create({
          data: {
            email: email.toLowerCase(),
            passwordHash,
            fullName,
            role: UserRole.SUPER_ADMIN,
            designation: "Platform Principal Architect",
            isActive: true,
          },
        });

        this.logger.log(
          `🛡️ Initial SuperAdmin created: ${superAdmin.email} (ID: ${superAdmin.id})`
        );
        await this.auditService.log({
          action: "SYSTEM_INITIALIZED",
          entity: "User",
          entityId: superAdmin.id,
          details: { email: superAdmin.email, role: superAdmin.role },
        });
      }
    } catch (err) {
      this.logger.warn(`Could not seed initial SuperAdmin: ${err.message}`);
    }
  }

  /**
   * Universal Login for SuperAdmin, SchoolAdmin, Accountant, Teacher, Parent, Student, Librarian
   */
  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string) {
    const email = loginDto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            schoolCode: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid email address or password.");
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        "Your account has been suspended or deactivated. Please contact support."
      );
    }

    // Check if account has not yet set a password via invitation token
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        "Account is pending initial password setup. Please click the invitation link sent to your email."
      );
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email address or password.");
    }

    // Generate JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || "default_jwt_secret_key_change_me",
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });

    // Record audit log
    await this.auditService.log({
      action: "USER_LOGIN",
      entity: "User",
      entityId: user.id,
      userId: user.id,
      schoolId: user.schoolId || undefined,
      ipAddress,
      userAgent,
      details: { role: user.role },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        designation: user.designation,
        schoolId: user.schoolId,
        school: user.school,
      },
    };
  }

  /**
   * Verify an administrator setup invitation token
   */
  async verifyInvitation(token: string) {
    if (!token) {
      throw new BadRequestException("Invitation token parameter is required.");
    }

    const user = await this.prisma.user.findUnique({
      where: { invitationToken: token },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            schoolCode: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(
        "Invitation link is invalid, already used, or does not exist."
      );
    }

    if (user.invitationExpiresAt && user.invitationExpiresAt < new Date()) {
      throw new BadRequestException(
        "Invitation link has expired (72h limit). Please request a new invitation."
      );
    }

    return {
      valid: true,
      email: user.email,
      fullName: user.fullName,
      designation: user.designation,
      school: user.school,
    };
  }

  /**
   * Redeem invitation token and set permanent password (single-use flow)
   */
  async redeemInvitation(dto: RedeemInvitationDto, ipAddress?: string) {
    const { token, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { invitationToken: token },
      include: { school: true },
    });

    if (!user) {
      throw new NotFoundException(
        "Invitation link is invalid or has already been redeemed."
      );
    }

    if (user.invitationExpiresAt && user.invitationExpiresAt < new Date()) {
      throw new BadRequestException("Invitation link has expired.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Atomically save password, clear token and expiry to prevent reuse
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        invitationToken: null,
        invitationExpiresAt: null,
        isActive: true,
      },
    });

    await this.auditService.log({
      action: "INVITATION_REDEEMED",
      entity: "User",
      entityId: user.id,
      userId: user.id,
      schoolId: user.schoolId || undefined,
      ipAddress,
      details: { role: user.role, email: user.email },
    });

    return {
      success: true,
      message:
        "Password set successfully. Your school administrator workspace is now active.",
      email: updatedUser.email,
    };
  }

  /**
   * Get authenticated user profile with active permissions
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        designation: true,
        isActive: true,
        createdAt: true,
        parentLinks: {
          include: {
            student: {
              select: {
                id: true,
                admissionNumber: true,
                fullName: true,
                gradeLevel: true,
                section: true,
                rollNumber: true,
                status: true,
                hasStudentPortalAccess: true,
              },
            },
          },
        },
        studentProfile: {
          select: {
            id: true,
            admissionNumber: true,
            fullName: true,
            gradeLevel: true,
            section: true,
            rollNumber: true,
            status: true,
            hasStudentPortalAccess: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            schoolCode: true,
            slug: true,
            status: true,
            plan: true,
            board: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User profile not found.");
    }

    return user;
  }
}
