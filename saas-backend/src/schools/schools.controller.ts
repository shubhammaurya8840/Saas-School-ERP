import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Request } from "express";
import { SchoolsService } from "./schools.service";
import { RegisterSchoolDto } from "./dto/register-school.dto";
import { ToggleModuleDto } from "./dto/toggle-module.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { SchoolStatus, UserRole } from "@prisma/client";

@Controller("schools")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async registerSchool(
    @Body() dto: RegisterSchoolDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];
    return this.schoolsService.registerSchool(dto, user.id, ip, userAgent);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  async findAll(
    @Query("search") search?: string,
    @Query("status") status?: string,
    @Query("plan") plan?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.schoolsService.findAll({
      search,
      status,
      plan,
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.schoolsService.findOne(id);
  }

  @Patch(":id/modules")
  @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
  async toggleModule(
    @Param("id") id: string,
    @Body() dto: ToggleModuleDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const isEnabled =
      dto.isEnabled !== undefined ? dto.isEnabled : dto.enabled ?? true;
    return this.schoolsService.toggleModule(id, dto.moduleKey, isEnabled, user.id);
  }

  @Patch(":id/status")
  @Roles(UserRole.SUPER_ADMIN)
  async updateStatus(
    @Param("id") id: string,
    @Body("status") status: SchoolStatus,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.schoolsService.updateStatus(id, status, user.id);
  }
}
