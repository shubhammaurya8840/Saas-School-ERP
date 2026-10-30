import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  BadRequestException,
} from "@nestjs/common";
import { Request } from "express";
import { LibraryService } from "./library.service";
import { CreateBookDto } from "./dto/create-book.dto";
import { UpdateBookDto } from "./dto/update-book.dto";
import { IssueBookDto } from "./dto/issue-book.dto";
import { ReturnBookDto } from "./dto/return-book.dto";
import { RenewBookDto } from "./dto/renew-book.dto";
import { UpdateLibrarySettingsDto } from "./dto/library-settings.dto";
import { AdjustFineDto } from "./dto/adjust-fine.dto";
import { QueryBooksDto, QueryIssuesDto } from "./dto/query-library.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Controller("library")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LibraryController {
  constructor(
    private readonly libraryService: LibraryService,
    private readonly prisma: PrismaService
  ) {}

  // =========================================================================
  // 1. DASHBOARD & SETTINGS
  // =========================================================================

  @Get("stats")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  async getStats(@CurrentUser("schoolId") schoolId: string) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    return this.libraryService.getStats(schoolId);
  }

  @Get("settings")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  async getSettings(@CurrentUser("schoolId") schoolId: string) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    return this.libraryService.getSettings(schoolId);
  }

  @Patch("settings")
  @Put("settings")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  async updateSettings(
    @CurrentUser("schoolId") schoolId: string,
    @Body() dto: UpdateLibrarySettingsDto,
    @CurrentUser() user: any,
    @Req() req: Request
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    return this.libraryService.updateSettings(schoolId, dto, user, ipAddress);
  }

  // =========================================================================
  // 2. BOOK CATALOGUE
  // =========================================================================

  @Get("books")
  async getBooks(
    @CurrentUser("schoolId") schoolId: string,
    @Query() query: QueryBooksDto
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    return this.libraryService.getBooks(schoolId, query);
  }

  @Get("books/:id")
  async getBookById(
    @CurrentUser("schoolId") schoolId: string,
    @Param("id") id: string
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    return this.libraryService.getBookById(schoolId, id);
  }

  @Post("books")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  @HttpCode(HttpStatus.CREATED)
  async createBook(
    @CurrentUser("schoolId") schoolId: string,
    @Body() dto: CreateBookDto,
    @CurrentUser() user: any,
    @Req() req: Request
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    return this.libraryService.createBook(schoolId, dto, user, ipAddress);
  }

  @Patch("books/:id")
  @Put("books/:id")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  async updateBook(
    @CurrentUser("schoolId") schoolId: string,
    @Param("id") id: string,
    @Body() dto: UpdateBookDto,
    @CurrentUser() user: any,
    @Req() req: Request
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    return this.libraryService.updateBook(schoolId, id, dto, user, ipAddress);
  }

  @Delete("books/:id")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  async deleteBook(
    @CurrentUser("schoolId") schoolId: string,
    @Param("id") id: string,
    @CurrentUser() user: any,
    @Req() req: Request
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    return this.libraryService.deleteBook(schoolId, id, user, ipAddress);
  }

  // =========================================================================
  // 3. CIRCULATION DESK: ISSUE, RETURN, RENEW
  // =========================================================================

  @Post("issues")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  @HttpCode(HttpStatus.CREATED)
  async issueBook(
    @CurrentUser("schoolId") schoolId: string,
    @Body() dto: IssueBookDto,
    @CurrentUser() user: any,
    @Req() req: Request
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    return this.libraryService.issueBook(schoolId, dto, user, ipAddress);
  }

  @Post("issue")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  @HttpCode(HttpStatus.CREATED)
  async issueBookAlias(
    @CurrentUser("schoolId") schoolId: string,
    @Body() dto: IssueBookDto,
    @CurrentUser() user: any,
    @Req() req: Request
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    return this.libraryService.issueBook(schoolId, dto, user, ipAddress);
  }

  @Post("issues/:id/return")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  @HttpCode(HttpStatus.OK)
  async returnBook(
    @CurrentUser("schoolId") schoolId: string,
    @Param("id") id: string,
    @Body() dto: ReturnBookDto,
    @CurrentUser() user: any,
    @Req() req: Request
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    return this.libraryService.returnBook(schoolId, id, dto, user, ipAddress);
  }

  @Post("issues/:id/renew")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  @HttpCode(HttpStatus.OK)
  async renewBook(
    @CurrentUser("schoolId") schoolId: string,
    @Param("id") id: string,
    @Body() dto: RenewBookDto,
    @CurrentUser() user: any,
    @Req() req: Request
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    return this.libraryService.renewBook(schoolId, id, dto, user, ipAddress);
  }

  // =========================================================================
  // 4. AUDITED FEE-LEDGER ADJUSTMENT (Rule 4: Explicit, Audited Workflow)
  // =========================================================================

  @Post("issues/:id/adjust-to-fee")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.OK)
  async adjustFineToFee(
    @CurrentUser("schoolId") schoolId: string,
    @Param("id") id: string,
    @Body() dto: AdjustFineDto,
    @CurrentUser() user: any,
    @Req() req: Request
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    const ipAddress =
      (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
    return this.libraryService.adjustFineToFee(schoolId, id, dto, user, ipAddress);
  }

  // =========================================================================
  // 5. CIRCULATION LISTS & OVERDUE
  // =========================================================================

  @Get("issues")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  async getIssues(
    @CurrentUser("schoolId") schoolId: string,
    @Query() query: QueryIssuesDto
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    return this.libraryService.getIssues(schoolId, query);
  }

  @Get("overdue")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  async getOverdueIssues(@CurrentUser("schoolId") schoolId: string) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    return this.libraryService.getOverdueIssues(schoolId);
  }

  @Get("issues/overdue")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.LIBRARIAN)
  async getIssuesOverdueAlias(@CurrentUser("schoolId") schoolId: string) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    return this.libraryService.getOverdueIssues(schoolId);
  }

  // =========================================================================
  // 6. STUDENT & PARENT RESTRICTED VIEWS
  // =========================================================================

  @Get("student-loans")
  @Roles(
    UserRole.STUDENT,
    UserRole.SCHOOL_ADMIN,
    UserRole.LIBRARIAN,
    UserRole.TEACHER
  )
  async getStudentLoans(
    @CurrentUser("schoolId") schoolId: string,
    @CurrentUser() user: any,
    @Query("studentId") studentIdParam?: string
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");

    let targetStudentId = studentIdParam;

    if (user.role === UserRole.STUDENT) {
      const student = await this.prisma.student.findFirst({
        where: { studentUserId: user.id, schoolId },
      });
      if (!student) {
        throw new BadRequestException("No student profile linked to this account.");
      }
      targetStudentId = student.id;
    }

    if (!targetStudentId) {
      throw new BadRequestException("Student ID parameter is required.");
    }

    return this.libraryService.getStudentLoans(schoolId, targetStudentId);
  }

  @Get("student/my-loans")
  @Roles(
    UserRole.STUDENT,
    UserRole.SCHOOL_ADMIN,
    UserRole.LIBRARIAN,
    UserRole.TEACHER
  )
  async getStudentMyLoans(
    @CurrentUser("schoolId") schoolId: string,
    @CurrentUser() user: any,
    @Query("studentId") studentIdParam?: string
  ) {
    return this.getStudentLoans(schoolId, user, studentIdParam);
  }

  @Get("parent-loans")
  @Roles(UserRole.PARENT, UserRole.SCHOOL_ADMIN)
  async getParentLoans(
    @CurrentUser("schoolId") schoolId: string,
    @CurrentUser() user: any
  ) {
    if (!schoolId) throw new BadRequestException("School tenant ID is required.");
    return this.libraryService.getParentStudentLoans(schoolId, user.id);
  }

  @Get("parent/loans")
  @Roles(UserRole.PARENT, UserRole.SCHOOL_ADMIN)
  async getParentLoansAlias(
    @CurrentUser("schoolId") schoolId: string,
    @CurrentUser() user: any
  ) {
    return this.getParentLoans(schoolId, user);
  }
}
