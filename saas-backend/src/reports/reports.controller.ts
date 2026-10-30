import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

@Controller("reports")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // =========================================================================
  // 1. LIBRARY INVENTORY REPORT
  // =========================================================================

  @Get("library/inventory")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  async getLibraryInventory(
    @CurrentUser("schoolId") schoolId: string,
    @Query("category") category?: string
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    return this.reportsService.getLibraryInventoryReport(schoolId, category);
  }

  // =========================================================================
  // 2. LIBRARY ISSUED BOOKS REPORT
  // =========================================================================

  @Get("library/issued")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  async getLibraryIssued(
    @CurrentUser("schoolId") schoolId: string,
    @Query("status") status?: string
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    return this.reportsService.getLibraryIssuedReport(schoolId, status);
  }

  // =========================================================================
  // 3. LIBRARY OVERDUE RETURNS REPORT
  // =========================================================================

  @Get("library/overdue")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  async getLibraryOverdue(@CurrentUser("schoolId") schoolId: string) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    return this.reportsService.getLibraryOverdueReport(schoolId);
  }

  // =========================================================================
  // 4. STUDENT ATTENDANCE SUMMARY REPORT
  // =========================================================================

  @Get("attendance/summary")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getAttendanceSummary(
    @CurrentUser("schoolId") schoolId: string,
    @Query("classSectionId") classSectionId?: string,
    @Query("gradeLevel") gradeLevel?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    return this.reportsService.getAttendanceSummaryReport(schoolId, {
      classSectionId,
      gradeLevel,
      startDate,
      endDate,
    });
  }

  // =========================================================================
  // 5. FEE DUES & COLLECTIONS REPORT
  // =========================================================================

  @Get("fees/summary")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  async getFeesSummary(
    @CurrentUser("schoolId") schoolId: string,
    @Query("gradeLevel") gradeLevel?: string
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    return this.reportsService.getFeesSummaryReport(schoolId, gradeLevel);
  }

  // =========================================================================
  // 6. PUBLISHED EXAM RESULTS REPORT
  // =========================================================================

  @Get("exams/results")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
  async getExamResults(
    @CurrentUser("schoolId") schoolId: string,
    @Query("academicYear") academicYear?: string,
    @Query("term") term?: string
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    return this.reportsService.getPublishedExamResultsReport(schoolId, academicYear, term);
  }
}
