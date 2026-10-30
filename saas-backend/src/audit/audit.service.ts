import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Prisma } from "@prisma/client";

export interface CreateAuditLogParams {
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
  schoolId?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(
    params: CreateAuditLogParams,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = tx || this.prisma;
    try {
      await client.auditLog.create({
        data: {
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          details: params.details || {},
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          userId: params.userId,
          schoolId: params.schoolId,
        },
      });
      this.logger.log(
        `Audit: [${params.action}] on ${params.entity}:${params.entityId || "N/A"}`
      );
    } catch (err) {
      this.logger.error(`Failed to record audit log: ${err.message}`);
    }
  }

  async getRecentLogs(limit = 50, schoolId?: string) {
    return this.prisma.auditLog.findMany({
      where: schoolId ? { schoolId } : undefined,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        school: {
          select: {
            id: true,
            name: true,
            schoolCode: true,
          },
        },
      },
    });
  }
}
