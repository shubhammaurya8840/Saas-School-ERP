import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";
import { TimetableService, AuthenticatedUser } from "./timetable.service";
import { CreateClassSectionDto } from "./dto/create-class-section.dto";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { SaveTimetableSlotDto } from "./dto/save-timetable-slot.dto";
import { BulkSaveTimetableDto } from "./dto/bulk-save-timetable.dto";

@Controller("timetable")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  // -------------------------------------------------------------------------
  // CLASS SECTIONS
  // -------------------------------------------------------------------------

  @Post("class-sections")
  @Roles(UserRole.SCHOOL_ADMIN)
  async createClassSection(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateClassSectionDto
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.timetableService.createClassSection(user.schoolId, dto, user.id);
  }

  @Get("class-sections")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER, UserRole.ACCOUNTANT)
  async listClassSections(
    @CurrentUser() user: AuthenticatedUser,
    @Query("academicYear") academicYear?: string,
    @Query("className") className?: string
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.timetableService.listClassSections(user.schoolId, { academicYear, className });
  }

  @Get("class-sections/:id")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getClassSection(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.timetableService.getClassSection(user.schoolId, id);
  }

  @Delete("class-sections/:id")
  @Roles(UserRole.SCHOOL_ADMIN)
  async deleteClassSection(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.timetableService.deleteClassSection(user.schoolId, id, user.id);
  }

  // -------------------------------------------------------------------------
  // SUBJECTS
  // -------------------------------------------------------------------------

  @Post("subjects")
  @Roles(UserRole.SCHOOL_ADMIN)
  async createSubject(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSubjectDto
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.timetableService.createSubject(user.schoolId, dto, user.id);
  }

  @Get("subjects")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async listSubjects(
    @CurrentUser() user: AuthenticatedUser,
    @Query("grade") grade?: string
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.timetableService.listSubjects(user.schoolId, { grade });
  }

  @Delete("subjects/:id")
  @Roles(UserRole.SCHOOL_ADMIN)
  async deleteSubject(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.timetableService.deleteSubject(user.schoolId, id, user.id);
  }

  // -------------------------------------------------------------------------
  // TIMETABLE SLOTS & SCHEDULING (With Conflict Prevention)
  // -------------------------------------------------------------------------

  @Post("slots")
  @Roles(UserRole.SCHOOL_ADMIN)
  async saveSlot(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SaveTimetableSlotDto
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.timetableService.saveSlot(user.schoolId, dto, user.id);
  }

  @Post("slots/bulk")
  @Roles(UserRole.SCHOOL_ADMIN)
  async bulkSaveSlots(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkSaveTimetableDto
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.timetableService.bulkSaveSlots(user.schoolId, dto, user.id);
  }

  @Delete("slots/:id")
  @Roles(UserRole.SCHOOL_ADMIN)
  async deleteSlot(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.timetableService.deleteSlot(user.schoolId, id, user.id);
  }

  // -------------------------------------------------------------------------
  // TIMETABLE VIEWS
  // -------------------------------------------------------------------------

  @Get("classes/:classSectionId")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getClassTimetable(
    @CurrentUser() user: AuthenticatedUser,
    @Param("classSectionId") classSectionId: string
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.timetableService.getClassTimetable(user.schoolId, classSectionId);
  }

  @Get("teachers/my-schedule")
  @Roles(UserRole.TEACHER)
  async getMySchedule(@CurrentUser() user: AuthenticatedUser) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.timetableService.getTeacherTimetable(user.schoolId, user.id);
  }

  @Get("teachers/:teacherId")
  @Roles(UserRole.SCHOOL_ADMIN)
  async getTeacherSchedule(
    @CurrentUser() user: AuthenticatedUser,
    @Param("teacherId") teacherId: string
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.timetableService.getTeacherTimetable(user.schoolId, teacherId);
  }

  @Get("students/:studentId")
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  async getStudentTimetable(
    @CurrentUser() user: AuthenticatedUser,
    @Param("studentId") studentId: string
  ) {
    return this.timetableService.getStudentTimetable(studentId, user);
  }
}
