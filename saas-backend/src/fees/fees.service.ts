import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateFeeHeadDto } from "./dto/create-fee-head.dto";
import { CreateFeePlanDto } from "./dto/create-fee-plan.dto";
import { AssignFeePlanDto } from "./dto/assign-fee-plan.dto";
import { RecordPaymentDto } from "./dto/record-payment.dto";
import { RefundPaymentDto } from "./dto/refund-payment.dto";
import { AuthenticatedUser } from "../common/decorators/current-user.decorator";
import { UserRole } from "@prisma/client";
import { Prisma } from "@prisma/client";

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  // =========================================================================
  // 1. FEE HEADS (Categories)
  // =========================================================================

  async createFeeHead(schoolId: string, dto: CreateFeeHeadDto, userId: string) {
    const existing = await this.prisma.feeHead.findFirst({
      where: {
        schoolId,
        OR: [
          { code: dto.code.trim().toUpperCase() },
          { name: dto.name.trim() },
        ],
      },
    });

    if (existing) {
      throw new ConflictException(
        `A fee head with code '${dto.code}' or name '${dto.name}' already exists in this school.`
      );
    }

    const feeHead = await this.prisma.feeHead.create({
      data: {
        schoolId,
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        description: dto.description?.trim(),
        isRecurring: dto.isRecurring ?? true,
      },
    });

    await this.auditService.log({
      action: "FEE_HEAD_CREATED",
      entity: "FeeHead",
      entityId: feeHead.id,
      userId,
      schoolId,
      details: { name: feeHead.name, code: feeHead.code },
    });

    return feeHead;
  }

  async findAllFeeHeads(schoolId: string) {
    return this.prisma.feeHead.findMany({
      where: { schoolId },
      orderBy: { name: "asc" },
    });
  }

  async deleteFeeHead(schoolId: string, id: string, userId: string) {
    const head = await this.prisma.feeHead.findFirst({
      where: { id, schoolId },
      include: { planItems: true },
    });

    if (!head) {
      throw new NotFoundException("Fee head not found.");
    }

    if (head.planItems.length > 0) {
      throw new BadRequestException(
        "Cannot delete fee head that is associated with active fee plans."
      );
    }

    await this.prisma.feeHead.delete({ where: { id } });

    await this.auditService.log({
      action: "FEE_HEAD_DELETED",
      entity: "FeeHead",
      entityId: id,
      userId,
      schoolId,
      details: { name: head.name, code: head.code },
    });

    return { success: true, message: "Fee head removed successfully." };
  }

  // =========================================================================
  // 2. FEE PLANS (Structures & Installments)
  // =========================================================================

  async createFeePlan(schoolId: string, dto: CreateFeePlanDto, userId: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Fee plan must include at least one fee head item.");
    }

    // Verify all fee heads belong to this school
    const headIds = dto.items.map((i) => i.feeHeadId);
    const existingHeads = await this.prisma.feeHead.findMany({
      where: { id: { in: headIds }, schoolId },
    });

    if (existingHeads.length !== headIds.length) {
      throw new BadRequestException(
        "One or more fee heads do not exist or do not belong to this school."
      );
    }

    // Calculate total amount precisely
    const totalAmount = dto.items.reduce((sum, item) => sum + Number(item.amount), 0);

    // If installments provided, check that total installment amount equals plan total
    if (dto.installments && dto.installments.length > 0) {
      const installmentTotal = dto.installments.reduce(
        (sum, inst) => sum + Number(inst.amount),
        0
      );
      if (Math.abs(installmentTotal - totalAmount) > 0.05) {
        throw new BadRequestException(
          `Installment total (₹${installmentTotal}) must match plan total amount (₹${totalAmount}).`
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.feePlan.create({
        data: {
          schoolId,
          name: dto.name.trim(),
          academicYear: dto.academicYear.trim(),
          applicableGrade: dto.applicableGrade?.trim() || null,
          totalAmount: new Prisma.Decimal(totalAmount),
          description: dto.description?.trim(),
          items: {
            create: dto.items.map((item) => ({
              feeHeadId: item.feeHeadId,
              amount: new Prisma.Decimal(item.amount),
            })),
          },
          installments: dto.installments
            ? {
                create: dto.installments.map((inst) => ({
                  title: inst.title.trim(),
                  dueDate: new Date(inst.dueDate),
                  percentage: inst.percentage ? new Prisma.Decimal(inst.percentage) : null,
                  amount: new Prisma.Decimal(inst.amount),
                  lateFeeFine: inst.lateFeeFine ? new Prisma.Decimal(inst.lateFeeFine) : new Prisma.Decimal(0),
                })),
              }
            : undefined,
        },
        include: {
          items: { include: { feeHead: true } },
          installments: true,
        },
      });

      await this.auditService.log({
        action: "FEE_PLAN_CREATED",
        entity: "FeePlan",
        entityId: plan.id,
        userId,
        schoolId,
        details: {
          name: plan.name,
          totalAmount: Number(plan.totalAmount),
          applicableGrade: plan.applicableGrade,
        },
      });

      return plan;
    });
  }

  async findAllFeePlans(schoolId: string, academicYear?: string, grade?: string) {
    const where: Prisma.FeePlanWhereInput = { schoolId };
    if (academicYear) where.academicYear = academicYear;
    if (grade && grade !== "all") where.applicableGrade = grade;

    return this.prisma.feePlan.findMany({
      where,
      include: {
        items: { include: { feeHead: true } },
        installments: { orderBy: { dueDate: "asc" } },
        _count: { select: { studentAssignments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getFeePlan(schoolId: string, id: string) {
    const plan = await this.prisma.feePlan.findFirst({
      where: { id, schoolId },
      include: {
        items: { include: { feeHead: true } },
        installments: { orderBy: { dueDate: "asc" } },
        _count: { select: { studentAssignments: true } },
      },
    });

    if (!plan) {
      throw new NotFoundException("Fee plan not found.");
    }

    return plan;
  }

  // =========================================================================
  // 3. ASSIGN FEE PLAN TO STUDENT (Concessions, Scholarships, Balance)
  // =========================================================================

  async assignFeePlan(schoolId: string, dto: AssignFeePlanDto, userId: string) {
    // 1. Verify student exists in this tenant
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId },
    });
    if (!student) {
      throw new NotFoundException("Student record not found in this school.");
    }

    // 2. Verify fee plan exists in this tenant
    const feePlan = await this.prisma.feePlan.findFirst({
      where: { id: dto.feePlanId, schoolId },
      include: { installments: { orderBy: { dueDate: "asc" } } },
    });
    if (!feePlan) {
      throw new NotFoundException("Fee plan not found in this school.");
    }

    const academicYear = dto.academicYear || feePlan.academicYear;

    // 3. Prevent duplicate assignment for same academic year
    const existingAssignment = await this.prisma.studentFeePlan.findUnique({
      where: {
        studentId_academicYear: {
          studentId: dto.studentId,
          academicYear,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictException(
        `Student already has an active fee plan assigned for academic year ${academicYear}.`
      );
    }

    // 4. Calculate Gross, Concession, Net
    const gross = Number(feePlan.totalAmount);
    const concession = dto.concessionAmount ? Number(dto.concessionAmount) : 0;

    if (concession > gross) {
      throw new BadRequestException(
        `Concession amount (₹${concession}) cannot exceed gross fee amount (₹${gross}).`
      );
    }

    const net = gross - concession;
    const concessionRatio = gross > 0 ? (gross - concession) / gross : 1;

    return this.prisma.$transaction(async (tx) => {
      // Create student fee plan
      const studentPlan = await tx.studentFeePlan.create({
        data: {
          studentId: dto.studentId,
          feePlanId: dto.feePlanId,
          schoolId,
          academicYear,
          grossAmount: new Prisma.Decimal(gross),
          concessionType: dto.concessionType?.trim() || null,
          concessionAmount: new Prisma.Decimal(concession),
          netAmount: new Prisma.Decimal(net),
          paidAmount: new Prisma.Decimal(0),
          balanceAmount: new Prisma.Decimal(net),
          status: net === 0 ? "PAID" : "PENDING",
        },
      });

      // Generate student installment schedule
      if (dto.customInstallments && dto.customInstallments.length > 0) {
        await tx.studentFeeInstallment.createMany({
          data: dto.customInstallments.map((ci) => ({
            studentFeePlanId: studentPlan.id,
            title: ci.title,
            dueDate: new Date(ci.dueDate),
            amount: new Prisma.Decimal(ci.amount),
            paidAmount: new Prisma.Decimal(0),
            status: "PENDING",
          })),
        });
      } else if (feePlan.installments && feePlan.installments.length > 0) {
        await tx.studentFeeInstallment.createMany({
          data: feePlan.installments.map((inst) => {
            // Scale installment amount with concession ratio
            const installmentAmount = Math.round(Number(inst.amount) * concessionRatio * 100) / 100;
            return {
              studentFeePlanId: studentPlan.id,
              planInstallmentId: inst.id,
              title: inst.title,
              dueDate: inst.dueDate,
              amount: new Prisma.Decimal(installmentAmount),
              paidAmount: new Prisma.Decimal(0),
              status: "PENDING",
            };
          }),
        });
      }

      await this.auditService.log({
        action: "FEE_PLAN_ASSIGNED",
        entity: "StudentFeePlan",
        entityId: studentPlan.id,
        userId,
        schoolId,
        details: {
          studentId: student.id,
          admissionNumber: student.admissionNumber,
          feePlanName: feePlan.name,
          grossAmount: gross,
          concessionAmount: concession,
          concessionType: dto.concessionType,
          netAmount: net,
        },
      });

      return tx.studentFeePlan.findUnique({
        where: { id: studentPlan.id },
        include: {
          feePlan: { include: { items: { include: { feeHead: true } } } },
          student: true,
          installments: { orderBy: { dueDate: "asc" } },
        },
      });
    });
  }

  // =========================================================================
  // 4. MANUAL PAYMENT RECORDING (Cash, UPI, Cheque, Bank Transfer)
  // =========================================================================

  async recordPayment(schoolId: string, dto: RecordPaymentDto, userId: string) {
    // 1. Idempotency Check (Prevents accidental double payment submission)
    if (dto.idempotencyKey) {
      const existingPayment = await this.prisma.feePayment.findUnique({
        where: { idempotencyKey: dto.idempotencyKey },
        include: {
          student: true,
          studentFeePlan: { include: { feePlan: true } },
        },
      });
      if (existingPayment) {
        this.logger.warn(
          `Idempotent duplicate payment suppressed for key: ${dto.idempotencyKey}`
        );
        return {
          duplicatePrevented: true,
          payment: existingPayment,
          receiptNumber: existingPayment.receiptNumber,
          message: "Payment was already recorded with this request key.",
        };
      }
    }

    // 2. Fetch Student Fee Plan with Tenant Isolation
    const studentFeePlan = await this.prisma.studentFeePlan.findFirst({
      where: { id: dto.studentFeePlanId, schoolId },
      include: {
        student: true,
        school: true,
        installments: { orderBy: { dueDate: "asc" } },
      },
    });

    if (!studentFeePlan) {
      throw new NotFoundException("Student fee plan not found in this school.");
    }

    const currentBalance = Number(studentFeePlan.balanceAmount);
    const paymentAmount = Number(dto.amount);

    if (paymentAmount <= 0) {
      throw new BadRequestException("Payment amount must be greater than zero.");
    }

    if (paymentAmount > currentBalance + 0.01) {
      throw new BadRequestException(
        `Payment amount (₹${paymentAmount}) exceeds current outstanding balance (₹${currentBalance}).`
      );
    }

    // 3. Generate sequential unique receipt number
    const receiptNumber = await this.generateUniqueReceiptNumber(
      studentFeePlan.school.schoolCode
    );

    // 4. Execute atomic transaction
    return this.prisma.$transaction(async (tx) => {
      // Create payment entry
      const payment = await tx.feePayment.create({
        data: {
          schoolId,
          studentId: studentFeePlan.studentId,
          studentFeePlanId: studentFeePlan.id,
          receiptNumber,
          amount: new Prisma.Decimal(paymentAmount),
          paymentMethod: dto.paymentMethod,
          transactionReference: dto.transactionReference?.trim() || null,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          idempotencyKey: dto.idempotencyKey?.trim() || null,
          remarks: dto.remarks?.trim() || null,
          collectedById: userId,
          status: "SUCCESS",
        },
      });

      // Update StudentFeePlan paid and balance amounts
      const newPaid = Number(studentFeePlan.paidAmount) + paymentAmount;
      const newBalance = Math.max(0, Number(studentFeePlan.netAmount) - newPaid);
      const newStatus = newBalance <= 0.01 ? "PAID" : "PARTIALLY_PAID";

      const updatedPlan = await tx.studentFeePlan.update({
        where: { id: studentFeePlan.id },
        data: {
          paidAmount: new Prisma.Decimal(newPaid),
          balanceAmount: new Prisma.Decimal(newBalance),
          status: newStatus,
        },
      });

      // Waterfall installment allocation
      let remainingPayment = paymentAmount;
      for (const inst of studentFeePlan.installments) {
        if (remainingPayment <= 0) break;

        const instTotal = Number(inst.amount);
        const instPaid = Number(inst.paidAmount);
        const instDue = instTotal - instPaid;

        if (instDue > 0) {
          const alloc = Math.min(remainingPayment, instDue);
          const newInstPaid = instPaid + alloc;
          const newInstStatus = newInstPaid >= instTotal - 0.01 ? "PAID" : "PARTIALLY_PAID";

          await tx.studentFeeInstallment.update({
            where: { id: inst.id },
            data: {
              paidAmount: new Prisma.Decimal(newInstPaid),
              status: newInstStatus,
            },
          });

          remainingPayment -= alloc;
        }
      }

      await this.auditService.log({
        action: "FEE_PAYMENT_RECORDED",
        entity: "FeePayment",
        entityId: payment.id,
        userId,
        schoolId,
        details: {
          receiptNumber,
          studentId: studentFeePlan.studentId,
          admissionNumber: studentFeePlan.student.admissionNumber,
          amount: paymentAmount,
          method: dto.paymentMethod,
          ref: dto.transactionReference,
          previousBalance: currentBalance,
          newBalance,
        },
      });

      this.logger.log(
        `💵 Fee Payment recorded: ₹${paymentAmount} [Receipt: ${receiptNumber}] for Student: ${studentFeePlan.student.fullName}`
      );

      return {
        payment,
        receiptNumber,
        updatedPlan,
        student: studentFeePlan.student,
      };
    });
  }

  // =========================================================================
  // 5. AUDITED REFUND / PAYMENT REVERSAL (Never Silently Deletes)
  // =========================================================================

  async refundPayment(schoolId: string, paymentId: string, dto: RefundPaymentDto, userId: string) {
    const payment = await this.prisma.feePayment.findFirst({
      where: { id: paymentId, schoolId },
      include: {
        studentFeePlan: true,
        student: true,
      },
    });

    if (!payment) {
      throw new NotFoundException("Payment record not found.");
    }

    if (payment.status === "REFUNDED" || payment.status === "REVERSED") {
      throw new BadRequestException("This payment has already been refunded or reversed.");
    }

    const originalAmount = Number(payment.amount);
    const refundAmount = dto.refundAmount ? Number(dto.refundAmount) : originalAmount;

    if (refundAmount <= 0 || refundAmount > originalAmount) {
      throw new BadRequestException(
        `Refund amount must be between ₹0.01 and the original payment amount of ₹${originalAmount}.`
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Mark payment as REFUNDED with audit fields
      const updatedPayment = await tx.feePayment.update({
        where: { id: payment.id },
        data: {
          status: "REFUNDED",
          refundAmount: new Prisma.Decimal(refundAmount),
          refundReason: dto.refundReason.trim(),
          refundedAt: new Date(),
          refundedById: userId,
        },
      });

      // 2. Revert StudentFeePlan paid and balance amounts
      const newPaid = Math.max(0, Number(payment.studentFeePlan.paidAmount) - refundAmount);
      const newBalance = Number(payment.studentFeePlan.netAmount) - newPaid;
      const newStatus = newPaid <= 0 ? "PENDING" : "PARTIALLY_PAID";

      const updatedPlan = await tx.studentFeePlan.update({
        where: { id: payment.studentFeePlanId },
        data: {
          paidAmount: new Prisma.Decimal(newPaid),
          balanceAmount: new Prisma.Decimal(newBalance),
          status: newStatus,
        },
      });

      // 3. Log audit trail
      await this.auditService.log({
        action: "FEE_PAYMENT_REFUNDED",
        entity: "FeePayment",
        entityId: payment.id,
        userId,
        schoolId,
        details: {
          receiptNumber: payment.receiptNumber,
          refundAmount,
          reason: dto.refundReason,
          studentId: payment.studentId,
        },
      });

      return {
        success: true,
        message: `Payment ${payment.receiptNumber} successfully refunded/reversed.`,
        payment: updatedPayment,
        updatedPlan,
      };
    });
  }

  // =========================================================================
  // 6. STUDENT-WISE FEE LEDGER (With Parent & Student Access Authorization)
  // =========================================================================

  async getStudentLedger(studentId: string, authUser: AuthenticatedUser) {
    // 1. Super Admin is strictly forbidden from viewing individual student fee records
    if (authUser.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        "Super Admin may view aggregate statistics only and cannot access individual student fee ledgers."
      );
    }

    // 2. Fetch student
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        school: true,
        parents: { include: { parent: true } },
      },
    });

    if (!student) {
      throw new NotFoundException("Student record not found.");
    }

    // 3. Tenant Isolation check for School Admin and Accountant
    if (
      (authUser.role === UserRole.SCHOOL_ADMIN || authUser.role === UserRole.ACCOUNTANT) &&
      student.schoolId !== authUser.schoolId
    ) {
      throw new NotFoundException("Student fee record not found in your school.");
    }

    // 4. Parent Authorization Check: Must be linked in ParentStudent junction
    if (authUser.role === UserRole.PARENT) {
      const isLinked = student.parents.some((p) => p.parentId === authUser.id);
      if (!isLinked) {
        throw new ForbiddenException(
          "Access denied: You are only permitted to view fee ledgers for your own linked children."
        );
      }
    }

    // 5. Student Authorization Check: Must be the student user account
    if (authUser.role === UserRole.STUDENT && student.studentUserId !== authUser.id) {
      throw new ForbiddenException("Access denied: You can only view your own student ledger.");
    }

    // 6. Fetch student fee plans, installments, and payment history
    const feePlans = await this.prisma.studentFeePlan.findMany({
      where: { studentId },
      include: {
        feePlan: {
          include: {
            items: { include: { feeHead: true } },
          },
        },
        installments: { orderBy: { dueDate: "asc" } },
        payments: { orderBy: { paymentDate: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        gradeLevel: student.gradeLevel,
        section: student.section,
        rollNumber: student.rollNumber,
        schoolName: student.school.name,
        schoolCode: student.school.schoolCode,
      },
      feePlans,
    };
  }

  // =========================================================================
  // 7. PARENT VIEW: LINKED CHILDREN FEE OVERVIEW
  // =========================================================================

  async getParentChildrenFees(parentUserId: string) {
    const parent = await this.prisma.user.findUnique({
      where: { id: parentUserId },
      include: {
        parentLinks: {
          include: {
            student: {
              include: {
                school: true,
                feePlans: {
                  include: {
                    feePlan: { include: { items: { include: { feeHead: true } } } },
                    installments: { orderBy: { dueDate: "asc" } },
                    payments: { orderBy: { paymentDate: "desc" } },
                  },
                  orderBy: { createdAt: "desc" },
                },
              },
            },
          },
        },
      },
    });

    if (!parent) {
      throw new NotFoundException("Parent user profile not found.");
    }

    return parent.parentLinks.map((link) => {
      const student = link.student;
      const activePlan = student.feePlans[0] || null;

      return {
        studentId: student.id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        gradeLevel: student.gradeLevel,
        section: student.section,
        relationship: link.relationship,
        schoolName: student.school.name,
        activeFeePlan: activePlan
          ? {
              id: activePlan.id,
              name: activePlan.feePlan.name,
              academicYear: activePlan.academicYear,
              grossAmount: Number(activePlan.grossAmount),
              concessionAmount: Number(activePlan.concessionAmount),
              concessionType: activePlan.concessionType,
              netAmount: Number(activePlan.netAmount),
              paidAmount: Number(activePlan.paidAmount),
              balanceAmount: Number(activePlan.balanceAmount),
              status: activePlan.status,
              installments: activePlan.installments,
              payments: activePlan.payments,
            }
          : null,
      };
    });
  }

  // =========================================================================
  // 8. REPORTS & COLLECTION SUMMARIES (Accountant & School Admin)
  // =========================================================================

  async getCollectionSummary(schoolId: string) {
    const [totalBilledResult, payments, studentPlans] = await Promise.all([
      this.prisma.studentFeePlan.aggregate({
        where: { schoolId },
        _sum: {
          grossAmount: true,
          concessionAmount: true,
          netAmount: true,
          paidAmount: true,
          balanceAmount: true,
        },
        _count: { id: true },
      }),
      this.prisma.feePayment.findMany({
        where: { schoolId, status: "SUCCESS" },
        select: { amount: true, paymentMethod: true, paymentDate: true },
      }),
      this.prisma.studentFeePlan.findMany({
        where: { schoolId },
        select: { status: true },
      }),
    ]);

    // Payment method breakdown
    const methodBreakdown: Record<string, number> = {
      CASH: 0,
      UPI: 0,
      BANK_TRANSFER: 0,
      CHEQUE: 0,
      DEMAND_DRAFT: 0,
      CARD: 0,
    };

    let totalCollected = 0;
    for (const p of payments) {
      const amt = Number(p.amount);
      totalCollected += amt;
      methodBreakdown[p.paymentMethod] = (methodBreakdown[p.paymentMethod] || 0) + amt;
    }

    const statusCounts = {
      PAID: 0,
      PARTIALLY_PAID: 0,
      PENDING: 0,
      OVERDUE: 0,
    };

    for (const sp of studentPlans) {
      if (statusCounts[sp.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[sp.status as keyof typeof statusCounts]++;
      }
    }

    return {
      totalPlansAssigned: totalBilledResult._count.id || 0,
      totalGrossBilled: Number(totalBilledResult._sum.grossAmount || 0),
      totalConcessionsGranted: Number(totalBilledResult._sum.concessionAmount || 0),
      totalNetBilled: Number(totalBilledResult._sum.netAmount || 0),
      totalCollected,
      totalOutstandingDues: Number(totalBilledResult._sum.balanceAmount || 0),
      methodBreakdown,
      statusCounts,
    };
  }

  async getDuesReport(
    schoolId: string,
    params?: {
      gradeLevel?: string;
      status?: string;
      search?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: Prisma.StudentFeePlanWhereInput = {
      schoolId,
    };

    if (params?.status && params.status !== "all") {
      where.status = params.status;
    }

    const studentFilter: Prisma.StudentWhereInput = {};
    if (params?.gradeLevel && params.gradeLevel !== "all") {
      studentFilter.gradeLevel = params.gradeLevel;
    }

    if (params?.search) {
      const q = params.search.trim();
      studentFilter.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { admissionNumber: { contains: q, mode: "insensitive" } },
      ];
    }

    if (Object.keys(studentFilter).length > 0) {
      where.student = studentFilter;
    }

    const [total, records] = await Promise.all([
      this.prisma.studentFeePlan.count({ where }),
      this.prisma.studentFeePlan.findMany({
        where,
        include: {
          student: true,
          feePlan: true,
          installments: { orderBy: { dueDate: "asc" } },
        },
        orderBy: { balanceAmount: "desc" },
        take: params?.limit || 50,
        skip: params?.offset || 0,
      }),
    ]);

    return { total, records };
  }

  async getPaymentsList(
    schoolId: string,
    params?: {
      search?: string;
      paymentMethod?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: Prisma.FeePaymentWhereInput = { schoolId };

    if (params?.paymentMethod && params.paymentMethod !== "all") {
      where.paymentMethod = params.paymentMethod;
    }

    if (params?.status && params.status !== "all") {
      where.status = params.status;
    }

    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { receiptNumber: { contains: q, mode: "insensitive" } },
        { transactionReference: { contains: q, mode: "insensitive" } },
        { student: { fullName: { contains: q, mode: "insensitive" } } },
        { student: { admissionNumber: { contains: q, mode: "insensitive" } } },
      ];
    }

    const [total, payments] = await Promise.all([
      this.prisma.feePayment.count({ where }),
      this.prisma.feePayment.findMany({
        where,
        include: {
          student: true,
          studentFeePlan: { include: { feePlan: true } },
        },
        orderBy: { paymentDate: "desc" },
        take: params?.limit || 50,
        skip: params?.offset || 0,
      }),
    ]);

    return { total, payments };
  }

  async getPrintableReceipt(schoolId: string, identifier: string, authUser: AuthenticatedUser) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const where: Prisma.FeePaymentWhereInput = isUuid
      ? { id: identifier }
      : { receiptNumber: identifier };

    if (schoolId) {
      where.schoolId = schoolId;
    }

    const payment = await this.prisma.feePayment.findFirst({
      where,
      include: {
        school: true,
        student: {
          include: {
            parents: { include: { parent: true } },
          },
        },
        studentFeePlan: {
          include: {
            feePlan: {
              include: {
                items: { include: { feeHead: true } },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException("Payment receipt not found.");
    }

    // Authorization check for parents
    if (authUser.role === UserRole.PARENT) {
      const isLinked = payment.student.parents.some((p) => p.parentId === authUser.id);
      if (!isLinked) {
        throw new ForbiddenException("You are not authorized to view this receipt.");
      }
    }

    return {
      receiptNumber: payment.receiptNumber,
      paymentDate: payment.paymentDate,
      amount: Number(payment.amount),
      paymentMethod: payment.paymentMethod,
      transactionReference: payment.transactionReference,
      status: payment.status,
      remarks: payment.remarks,
      school: {
        name: payment.school.name,
        code: payment.school.schoolCode,
        city: payment.school.city,
        state: payment.school.state,
        board: payment.school.board,
      },
      student: {
        fullName: payment.student.fullName,
        admissionNumber: payment.student.admissionNumber,
        gradeLevel: payment.student.gradeLevel,
        section: payment.student.section,
        rollNumber: payment.student.rollNumber,
      },
      parent: payment.student.parents[0]
        ? {
            fullName: payment.student.parents[0].parent.fullName,
            phone: payment.student.parents[0].parent.phone,
            relationship: payment.student.parents[0].relationship,
          }
        : null,
      feePlan: {
        name: payment.studentFeePlan.feePlan.name,
        academicYear: payment.studentFeePlan.academicYear,
        grossAmount: Number(payment.studentFeePlan.grossAmount),
        concessionAmount: Number(payment.studentFeePlan.concessionAmount),
        netAmount: Number(payment.studentFeePlan.netAmount),
        totalPaidToDate: Number(payment.studentFeePlan.paidAmount),
        remainingBalance: Number(payment.studentFeePlan.balanceAmount),
      },
    };
  }

  // =========================================================================
  // 9. SUPER ADMIN AGGREGATE STATS (Zero Student-Level Ledgers)
  // =========================================================================

  async getSuperAdminAggregateStats() {
    const [schoolsCount, feePlansCount, paymentsAggregate, collectionsAggregate] =
      await Promise.all([
        this.prisma.school.count({ where: { status: "ACTIVE" } }),
        this.prisma.feePlan.count(),
        this.prisma.feePayment.count({ where: { status: "SUCCESS" } }),
        this.prisma.feePayment.aggregate({
          where: { status: "SUCCESS" },
          _sum: { amount: true },
        }),
      ]);

    return {
      activeSchools: schoolsCount,
      totalFeePlansConfigured: feePlansCount,
      totalSuccessfulPayments: paymentsAggregate,
      totalVolumeCollected: Number(collectionsAggregate._sum.amount || 0),
    };
  }

  // =========================================================================
  // HELPER: Sequential Receipt Number Generator
  // =========================================================================

  private async generateUniqueReceiptNumber(schoolCode: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.feePayment.count({
      where: {
        school: { schoolCode },
      },
    });

    const sequence = String(count + 1).padStart(4, "0");
    const receiptNumber = `${schoolCode}-RCP-${year}-${sequence}`;

    // Verify uniqueness
    const exists = await this.prisma.feePayment.findFirst({
      where: { receiptNumber },
    });

    if (exists) {
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      return `${schoolCode}-RCP-${year}-${randSuffix}`;
    }

    return receiptNumber;
  }
}
