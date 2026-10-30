import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { StudentsService } from "./students.service";
import { CreateStudentDto } from "./dto/create-student.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { AuthenticatedUserPayload } from "../users/users.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";
import { Request } from "express";

@Controller("students")
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  /**
   * Register a new student & link parent
   * Allowed for Accountant and School Admin
   */
  @Post()
  @Roles(UserRole.ACCOUNTANT, UserRole.SCHOOL_ADMIN)
  async create(
    @CurrentUser() caller: AuthenticatedUserPayload,
    @Body() dto: CreateStudentDto,
    @Req() req: Request
  ) {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    return this.studentsService.create(caller, dto, ipAddress);
  }

  /**
   * List students with filters
   * Allowed for Accountant, School Admin, Teacher, Librarian
   */
  @Get()
  @Roles(UserRole.ACCOUNTANT, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.LIBRARIAN)
  async findAll(
    @CurrentUser() caller: AuthenticatedUserPayload,
    @Query("gradeLevel") gradeLevel?: string,
    @Query("section") section?: string,
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.studentsService.findAll(caller, {
      gradeLevel,
      section,
      search,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * List parents with all their linked children (Multi-Child View)
   */
  @Get("parents")
  @Roles(UserRole.ACCOUNTANT, UserRole.SCHOOL_ADMIN)
  async findParents(
    @CurrentUser() caller: AuthenticatedUserPayload,
    @Query("search") search?: string
  ) {
    return this.studentsService.findParentsWithChildren(caller, { search });
  }

  /**
   * Get single student profile
   */
  @Get(":id")
  @Roles(UserRole.ACCOUNTANT, UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.LIBRARIAN)
  async findOne(
    @CurrentUser() caller: AuthenticatedUserPayload,
    @Param("id") id: string
  ) {
    return this.studentsService.findOne(caller, id);
  }

  /**
   * Update student details
   */
  @Patch(":id")
  @Roles(UserRole.ACCOUNTANT, UserRole.SCHOOL_ADMIN)
  async update(
    @CurrentUser() caller: AuthenticatedUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateStudentDto,
    @Req() req: Request
  ) {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    return this.studentsService.update(caller, id, dto, ipAddress);
  }
}
