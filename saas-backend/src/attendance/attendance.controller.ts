import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";
import { AttendanceService, AuthenticatedUser } from "./attendance.service";
import { MarkStudentAttendanceDto } from "./dto/mark-student-attendance.dto";
import { MarkStaffAttendanceDto } from "./dto/mark-staff-attendance.dto";
import { CreateHolidayDto } from "./dto/create-holiday.dto";

@Controller("attendance")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // -------------------------------------------------------------------------
  // STUDENT DAILY ROLL CALL
  // -------------------------------------------------------------------------

  @Post("students")
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  async markStudentAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MarkStudentAttendanceDto
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.attendanceService.markStudentAttendance(
      user.schoolId,
      user.id,
      user.role,
      dto
    );
  }

  @Get("students/class/:classSectionId")
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
  async getClassDailyAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Param("classSectionId") classSectionId: string,
    @Query("date") date?: string
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    const targetDate = date || new Date().toISOString().split("T")[0];
    return this.attendanceService.getClassDailyAttendance(
      user.schoolId,
      classSectionId,
      targetDate
    );
  }

  @Get("students/:studentId/monthly")
  @Roles(
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.TEACHER,
    UserRole.SCHOOL_ADMIN,
    UserRole.ACCOUNTANT
  )
  async getStudentMonthlyAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Param("studentId") studentId: string,
    @Query("month") monthStr?: string,
    @Query("year") yearStr?: string
  ) {
    const now = new Date();
    const month = monthStr ? parseInt(monthStr, 10) : now.getMonth() + 1;
    const year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();

    return this.attendanceService.getStudentMonthlyAttendance(
      studentId,
      month,
      year,
      user
    );
  }

  @Get("parent/children")
  @Roles(UserRole.PARENT)
  async getParentChildrenAttendanceSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.attendanceService.getParentChildrenAttendanceSummary(user.id);
  }

  // -------------------------------------------------------------------------
  // STAFF ATTENDANCE
  // -------------------------------------------------------------------------

  @Post("staff")
  @Roles(UserRole.SCHOOL_ADMIN)
  async markStaffAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MarkStaffAttendanceDto
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.attendanceService.markStaffAttendance(user.schoolId, user.id, dto);
  }

  @Get("staff")
  @Roles(UserRole.SCHOOL_ADMIN)
  async getStaffDailyAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Query("date") date?: string
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    const targetDate = date || new Date().toISOString().split("T")[0];
    return this.attendanceService.getStaffDailyAttendance(user.schoolId, targetDate);
  }

  // -------------------------------------------------------------------------
  // SCHOOL HOLIDAYS
  // -------------------------------------------------------------------------

  @Post("holidays")
  @Roles(UserRole.SCHOOL_ADMIN)
  async createHoliday(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHolidayDto
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.attendanceService.createHoliday(user.schoolId, dto, user.id);
  }

  @Get("holidays")
  async listHolidays(
    @CurrentUser() user: AuthenticatedUser,
    @Query("academicYear") academicYear?: string
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.attendanceService.listHolidays(user.schoolId, academicYear);
  }

  @Delete("holidays/:id")
  @Roles(UserRole.SCHOOL_ADMIN)
  async deleteHoliday(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string
  ) {
    if (!user.schoolId) throw new BadRequestException("User has no linked school.");
    return this.attendanceService.deleteHoliday(user.schoolId, id, user.id);
  }
}
