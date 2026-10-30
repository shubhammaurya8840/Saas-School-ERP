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
} from "@nestjs/common";
import { FeesService } from "./fees.service";
import { CreateFeeHeadDto } from "./dto/create-fee-head.dto";
import { CreateFeePlanDto } from "./dto/create-fee-plan.dto";
import { AssignFeePlanDto } from "./dto/assign-fee-plan.dto";
import { RecordPaymentDto } from "./dto/record-payment.dto";
import { RefundPaymentDto } from "./dto/refund-payment.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";

@Controller("fees")
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  // =========================================================================
  // 1. FEE HEADS (School Admin & Accountant)
  // =========================================================================

  @Post("heads")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  async createFeeHead(
    @Body() dto: CreateFeeHeadDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    if (!user.schoolId) {
      throw new ForbiddenException("Tenant context required.");
    }
    return this.feesService.createFeeHead(user.schoolId, dto, user.id);
  }

  @Get("heads")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  async findAllFeeHeads(@CurrentUser() user: AuthenticatedUser) {
    if (!user.schoolId) {
      throw new ForbiddenException("Tenant context required.");
    }
    return this.feesService.findAllFeeHeads(user.schoolId);
  }

  @Delete("heads/:id")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  async deleteFeeHead(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    if (!user.schoolId) {
      throw new ForbiddenException("Tenant context required.");
    }
    return this.feesService.deleteFeeHead(user.schoolId, id, user.id);
  }

  // =========================================================================
  // 2. FEE PLANS (School Admin & Accountant)
  // =========================================================================

  @Post("plans")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  async createFeePlan(
    @Body() dto: CreateFeePlanDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    if (!user.schoolId) {
      throw new ForbiddenException("Tenant context required.");
    }
    return this.feesService.createFeePlan(user.schoolId, dto, user.id);
  }

  @Get("plans")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  async findAllFeePlans(
    @Query("academicYear") academicYear: string,
    @Query("grade") grade: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    if (!user.schoolId) {
      throw new ForbiddenException("Tenant context required.");
    }
    return this.feesService.findAllFeePlans(user.schoolId, academicYear, grade);
  }

  @Get("plans/:id")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  async getFeePlan(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    if (!user.schoolId) {
      throw new ForbiddenException("Tenant context required.");
    }
    return this.feesService.getFeePlan(user.schoolId, id);
  }

  // =========================================================================
  // 3. ASSIGN FEE PLAN TO STUDENT (School Admin & Accountant)
  // =========================================================================

  @Post("assign")
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.ACCOUNTANT)
  async assignFeePlan(
    @Body() dto: AssignFeePlanDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    if (!user.schoolId) {
      throw new ForbiddenException("Tenant context required.");
    }
    return this.feesService.assignFeePlan(user.schoolId, dto, user.id);
  }

  // =========================================================================
  // 4. MANUAL PAYMENT RECORDING (Accountant & School Admin)
  // =========================================================================

  @Post("payments")
  @Roles(UserRole.ACCOUNTANT, UserRole.SCHOOL_ADMIN)
  async recordPayment(
    @Body() dto: RecordPaymentDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    if (!user.schoolId) {
      throw new ForbiddenException("Tenant context required.");
    }
    return this.feesService.recordPayment(user.schoolId, dto, user.id);
  }

  // =========================================================================
  // 5. AUDITED REFUND / PAYMENT REVERSAL (Accountant & School Admin)
  // =========================================================================

  @Post("payments/:id/refund")
  @Roles(UserRole.ACCOUNTANT, UserRole.SCHOOL_ADMIN)
  async refundPayment(
    @Param("id") id: string,
    @Body() dto: RefundPaymentDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    if (!user.schoolId) {
      throw new ForbiddenException("Tenant context required.");
    }
    return this.feesService.refundPayment(user.schoolId, id, dto, user.id);
  }

  // =========================================================================
  // 6. PAYMENTS DIRECTORY (Accountant & School Admin)
  // =========================================================================

  @Get("payments")
  @Roles(UserRole.ACCOUNTANT, UserRole.SCHOOL_ADMIN)
  async getPaymentsList(
    @Query("search") search: string,
    @Query("paymentMethod") paymentMethod: string,
    @Query("status") status: string,
    @Query("limit") limit: string,
    @Query("offset") offset: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    if (!user.schoolId) {
      throw new ForbiddenException("Tenant context required.");
    }
    return this.feesService.getPaymentsList(user.schoolId, {
      search,
      paymentMethod,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  // =========================================================================
  // 7. PRINTABLE RECEIPT (Accountant, Admin, Parent, Student)
  // =========================================================================

  @Get("receipts/:identifier")
  @Roles(
    UserRole.ACCOUNTANT,
    UserRole.SCHOOL_ADMIN,
    UserRole.PARENT,
    UserRole.STUDENT
  )
  async getPrintableReceipt(
    @Param("identifier") identifier: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    if (!user.schoolId && user.role !== UserRole.PARENT) {
      throw new ForbiddenException("Tenant context required.");
    }
    const schoolId = user.schoolId || "";
    return this.feesService.getPrintableReceipt(schoolId, identifier, user);
  }

  // =========================================================================
  // 8. STUDENT FEE LEDGER (Accountant, Admin, Parent, Student)
  // =========================================================================

  @Get("students/:studentId/ledger")
  @Roles(
    UserRole.ACCOUNTANT,
    UserRole.SCHOOL_ADMIN,
    UserRole.PARENT,
    UserRole.STUDENT
  )
  async getStudentLedger(
    @Param("studentId") studentId: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.feesService.getStudentLedger(studentId, user);
  }

  // =========================================================================
  // 9. PARENT VIEW: LINKED CHILDREN FEE OVERVIEW (Parents Only)
  // =========================================================================

  @Get("parent/children")
  @Roles(UserRole.PARENT)
  async getParentChildrenFees(@CurrentUser() user: AuthenticatedUser) {
    return this.feesService.getParentChildrenFees(user.id);
  }

  // =========================================================================
  // 10. FINANCIAL SUMMARIES & DUES REPORTS (Accountant & School Admin)
  // =========================================================================

  @Get("summary")
  @Roles(UserRole.ACCOUNTANT, UserRole.SCHOOL_ADMIN)
  async getCollectionSummary(@CurrentUser() user: AuthenticatedUser) {
    if (!user.schoolId) {
      throw new ForbiddenException("Tenant context required.");
    }
    return this.feesService.getCollectionSummary(user.schoolId);
  }

  @Get("dues")
  @Roles(UserRole.ACCOUNTANT, UserRole.SCHOOL_ADMIN)
  async getDuesReport(
    @Query("gradeLevel") gradeLevel: string,
    @Query("status") status: string,
    @Query("search") search: string,
    @Query("limit") limit: string,
    @Query("offset") offset: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    if (!user.schoolId) {
      throw new ForbiddenException("Tenant context required.");
    }
    return this.feesService.getDuesReport(user.schoolId, {
      gradeLevel,
      status,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
  }

  // =========================================================================
  // 11. SUPER ADMIN AGGREGATE STATS (Platform Level Only)
  // =========================================================================

  @Get("super-admin/aggregate")
  @Roles(UserRole.SUPER_ADMIN)
  async getSuperAdminAggregateStats() {
    return this.feesService.getSuperAdminAggregateStats();
  }
}
