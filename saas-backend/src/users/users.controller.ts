import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { UsersService, AuthenticatedUserPayload } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";
import { Request } from "express";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Create school user (Teachers, Staff, Accountants)
   * School Admin only
   */
  @Post()
  @Roles(UserRole.SCHOOL_ADMIN)
  async create(
    @CurrentUser() caller: AuthenticatedUserPayload,
    @Body() dto: CreateUserDto,
    @Req() req: Request
  ) {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    return this.usersService.create(caller, dto, ipAddress);
  }

  /**
   * List users in caller's school
   */
  @Get()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT, UserRole.TEACHER, UserRole.LIBRARIAN)
  async findAll(
    @CurrentUser() caller: AuthenticatedUserPayload,
    @Query("role") role?: UserRole,
    @Query("search") search?: string,
    @Query("department") department?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.usersService.findAll(caller, {
      role,
      search,
      department,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  /**
   * Get single user details
   */
  @Get(":id")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT, UserRole.TEACHER, UserRole.LIBRARIAN)
  async findOne(
    @CurrentUser() caller: AuthenticatedUserPayload,
    @Param("id") id: string
  ) {
    return this.usersService.findOne(caller, id);
  }

  /**
   * Update user details
   */
  @Patch(":id")
  @Roles(UserRole.SCHOOL_ADMIN)
  async update(
    @CurrentUser() caller: AuthenticatedUserPayload,
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @Req() req: Request
  ) {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    return this.usersService.update(caller, id, dto, ipAddress);
  }

  /**
   * Delete or deactivate user
   */
  @Delete(":id")
  @Roles(UserRole.SCHOOL_ADMIN)
  async delete(
    @CurrentUser() caller: AuthenticatedUserPayload,
    @Param("id") id: string,
    @Req() req: Request
  ) {
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    return this.usersService.delete(caller, id, ipAddress);
  }
}
