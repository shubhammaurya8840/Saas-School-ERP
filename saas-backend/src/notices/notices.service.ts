import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { QueryNoticesDto } from './dto/query-notices.dto';
import { NoticeStatus, NoticePriority, NoticeTargetAudience, UserRole } from '@prisma/client';

@Injectable()
export class NoticesService {
  private readonly logger = new Logger(NoticesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // =========================================================================
  // HELPER: MODULE ENTITLEMENT & AUTHORIZATION
  // =========================================================================

  private async assertNoticesModuleEnabled(schoolId: string) {
    const mod = await this.prisma.schoolModule.findUnique({
      where: { schoolId_moduleKey: { schoolId, moduleKey: 'notices' } },
    });
    if (mod && !mod.isEnabled) {
      throw new ForbiddenException('Notices module is disabled for this school');
    }
  }

  private async assertCanManageNotices(user: any, schoolId: string) {
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SCHOOL_ADMIN) {
      return;
    }

    // Explicitly check staff permission in database
    const dbUser = await this.prisma.user.findFirst({
      where: { id: user.id, schoolId },
      select: { id: true, role: true, canManageNotices: true, isActive: true },
    });

    if (!dbUser || !dbUser.isActive || !dbUser.canManageNotices) {
      throw new ForbiddenException(
        'You are not authorized to create, edit or publish notices for this school',
      );
    }
  }

  // =========================================================================
  // 1. CREATE NOTICE
  // =========================================================================

  async createNotice(schoolId: string, dto: CreateNoticeDto, user: any) {
    await this.assertNoticesModuleEnabled(schoolId);
    await this.assertCanManageNotices(user, schoolId);

    // Rule 3 & 7: Validate classSection belongs to the same school
    let classSection = null;
    if (dto.classSectionId) {
      classSection = await this.prisma.classSection.findFirst({
        where: { id: dto.classSectionId, schoolId },
      });
      if (!classSection) {
        throw new NotFoundException('Class Section not found in this school');
      }
    }

    // Rule 7: Check module entitlement if targeting students
    if (
      dto.targetAudience === NoticeTargetAudience.STUDENTS ||
      dto.targetRoles?.includes(UserRole.STUDENT)
    ) {
      const studentMod = await this.prisma.schoolModule.findUnique({
        where: { schoolId_moduleKey: { schoolId, moduleKey: 'student_portal' } },
      });
      if (studentMod && !studentMod.isEnabled) {
        throw new ForbiddenException(
          'Cannot target students because Student Portal module is disabled for this school',
        );
      }
    }

    const isPublished = dto.status === NoticeStatus.PUBLISHED;
    const now = new Date();

    const notice = await this.prisma.notice.create({
      data: {
        schoolId,
        title: dto.title.trim(),
        message: dto.message,
        priority: dto.priority || NoticePriority.NORMAL,
        status: dto.status || NoticeStatus.DRAFT,
        targetAudience: dto.targetAudience || NoticeTargetAudience.ALL,
        targetRoles: dto.targetRoles || [],
        classSectionId: dto.classSectionId,
        targetGrade: dto.targetGrade || classSection?.className,
        publishDate: dto.publishDate ? new Date(dto.publishDate) : now,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        publishedAt: isPublished ? now : null,
        publishedById: isPublished ? user.id : null,
        authorId: user.id,
        attachments: dto.attachments || null,
      },
      include: {
        author: { select: { id: true, fullName: true, role: true, designation: true } },
        classSection: { select: { id: true, className: true, section: true } },
      },
    });

    // Rule 8: Audit Log
    await this.audit.log({
      action: 'NOTICE_CREATED',
      entity: 'Notice',
      entityId: notice.id,
      details: {
        title: notice.title,
        priority: notice.priority,
        targetAudience: notice.targetAudience,
        status: notice.status,
        classSectionId: notice.classSectionId,
      },
      userId: user.id,
      schoolId,
    });

    return notice;
  }

  // =========================================================================
  // 2. UPDATE NOTICE
  // =========================================================================

  async updateNotice(schoolId: string, noticeId: string, dto: UpdateNoticeDto, user: any) {
    await this.assertNoticesModuleEnabled(schoolId);
    await this.assertCanManageNotices(user, schoolId);

    const notice = await this.prisma.notice.findFirst({
      where: { id: noticeId, schoolId },
    });
    if (!notice) {
      throw new NotFoundException('Notice not found in this school');
    }

    if (dto.classSectionId) {
      const cs = await this.prisma.classSection.findFirst({
        where: { id: dto.classSectionId, schoolId },
      });
      if (!cs) {
        throw new NotFoundException('Class Section not found in this school');
      }
    }

    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.message !== undefined) data.message = dto.message;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.targetAudience !== undefined) data.targetAudience = dto.targetAudience;
    if (dto.targetRoles !== undefined) data.targetRoles = dto.targetRoles;
    if (dto.classSectionId !== undefined) data.classSectionId = dto.classSectionId;
    if (dto.targetGrade !== undefined) data.targetGrade = dto.targetGrade;
    if (dto.publishDate !== undefined) data.publishDate = new Date(dto.publishDate);
    if (dto.expiryDate !== undefined) data.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    if (dto.attachments !== undefined) data.attachments = dto.attachments;

    if (dto.status !== undefined) {
      data.status = dto.status;
      if (dto.status === NoticeStatus.PUBLISHED && !notice.publishedAt) {
        data.publishedAt = new Date();
        data.publishedById = user.id;
      }
    }

    const updated = await this.prisma.notice.update({
      where: { id: noticeId },
      data,
      include: {
        author: { select: { id: true, fullName: true, role: true, designation: true } },
        classSection: { select: { id: true, className: true, section: true } },
      },
    });

    // Rule 8: Audit Log
    await this.audit.log({
      action: 'NOTICE_UPDATED',
      entity: 'Notice',
      entityId: notice.id,
      details: {
        title: updated.title,
        status: updated.status,
        changes: Object.keys(data),
      },
      userId: user.id,
      schoolId,
    });

    return updated;
  }

  // =========================================================================
  // 3. PUBLISH NOTICE
  // =========================================================================

  async publishNotice(schoolId: string, noticeId: string, user: any) {
    await this.assertNoticesModuleEnabled(schoolId);
    await this.assertCanManageNotices(user, schoolId);

    const notice = await this.prisma.notice.findFirst({
      where: { id: noticeId, schoolId },
    });
    if (!notice) {
      throw new NotFoundException('Notice not found in this school');
    }

    const now = new Date();
    const published = await this.prisma.notice.update({
      where: { id: noticeId },
      data: {
        status: NoticeStatus.PUBLISHED,
        publishedAt: now,
        publishedById: user.id,
      },
      include: {
        author: { select: { id: true, fullName: true, role: true, designation: true } },
        publishedBy: { select: { id: true, fullName: true, role: true } },
        classSection: { select: { id: true, className: true, section: true } },
      },
    });

    // Rule 8: Audit Log
    await this.audit.log({
      action: 'NOTICE_PUBLISHED',
      entity: 'Notice',
      entityId: notice.id,
      details: {
        title: published.title,
        targetAudience: published.targetAudience,
        publishedAt: now,
      },
      userId: user.id,
      schoolId,
    });

    return published;
  }

  // =========================================================================
  // 4. LIST NOTICES (Recipient Filtering, Expiry & Read Status)
  // =========================================================================

  async listNotices(schoolId: string, query: QueryNoticesDto, user: any) {
    await this.assertNoticesModuleEnabled(schoolId);

    const now = new Date();

    // 1. If SCHOOL_ADMIN or SUPER_ADMIN, return full notice list
    if (user.role === UserRole.SCHOOL_ADMIN || user.role === UserRole.SUPER_ADMIN) {
      const where: any = { schoolId };
      if (query.status) where.status = query.status;
      if (query.priority) where.priority = query.priority;
      if (query.targetAudience) where.targetAudience = query.targetAudience;
      if (query.search) {
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { message: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      const notices = await this.prisma.notice.findMany({
        where,
        include: {
          author: { select: { id: true, fullName: true, role: true } },
          classSection: { select: { id: true, className: true, section: true } },
          reads: {
            where: { userId: user.id },
            select: { readAt: true },
          },
          _count: {
            select: { reads: true },
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });

      return notices.map((n) => {
        const isExpired = n.expiryDate && n.expiryDate < now;
        return {
          ...n,
          isExpired,
          computedStatus: isExpired ? NoticeStatus.EXPIRED : n.status,
          isRead: n.reads.length > 0,
          readAt: n.reads[0]?.readAt || null,
          readCount: n._count.reads,
        };
      });
    }

    // 2. Student Portal Module Entitlement Check
    if (user.role === UserRole.STUDENT) {
      const studentMod = await this.prisma.schoolModule.findUnique({
        where: { schoolId_moduleKey: { schoolId, moduleKey: 'student_portal' } },
      });
      if (studentMod && !studentMod.isEnabled) {
        throw new ForbiddenException('Student portal module is disabled for this school');
      }
    }

    // 3. For Teachers, Students, Parents: Only PUBLISHED and non-expired notices
    const baseWhere: any = {
      schoolId,
      status: NoticeStatus.PUBLISHED,
      publishDate: { lte: now },
      OR: [
        { expiryDate: null },
        { expiryDate: { gte: now } },
      ],
    };

    // Recipient Targeting Logic
    if (user.role === UserRole.TEACHER || user.role === UserRole.STAFF || user.role === UserRole.ACCOUNTANT) {
      // Find classes teacher is assigned to
      const slots = await this.prisma.timetableSlot.findMany({
        where: { schoolId, teacherId: user.id },
        select: { classSectionId: true },
      });
      const classTeacherSections = await this.prisma.classSection.findMany({
        where: { schoolId, classTeacherId: user.id },
        select: { id: true },
      });
      const teacherClassSectionIds = Array.from(
        new Set([
          ...slots.map((s) => s.classSectionId),
          ...classTeacherSections.map((c) => c.id),
        ]),
      );

      baseWhere.AND = [
        {
          OR: [
            // General Staff/Teacher Notice
            {
              targetAudience: {
                in: [
                  NoticeTargetAudience.ALL,
                  NoticeTargetAudience.STAFF_ONLY,
                  NoticeTargetAudience.TEACHERS,
                ],
              },
              classSectionId: null,
            },
            // Section-specific notice where teacher teaches
            ...(teacherClassSectionIds.length > 0
              ? [{ classSectionId: { in: teacherClassSectionIds } }]
              : []),
          ],
        },
      ];
    } else if (user.role === UserRole.STUDENT) {
      const student = await this.prisma.student.findFirst({
        where: { studentUserId: user.id, schoolId },
      });
      if (!student) {
        return [];
      }

      let studentSectionId = student.classSectionId;
      if (!studentSectionId && student.gradeLevel && student.section) {
        const cs = await this.prisma.classSection.findFirst({
          where: {
            schoolId,
            className: student.gradeLevel,
            section: student.section,
          },
          select: { id: true },
        });
        if (cs) studentSectionId = cs.id;
      }

      baseWhere.AND = [
        {
          OR: [
            // General Student Notice (not restricted to a specific section or grade)
            {
              targetAudience: { in: [NoticeTargetAudience.ALL, NoticeTargetAudience.STUDENTS] },
              classSectionId: null,
              targetGrade: null,
            },
            // Grade-wide notice for student's grade (without specific section restriction)
            ...(student.gradeLevel
              ? [
                  {
                    targetGrade: student.gradeLevel,
                    classSectionId: null,
                  },
                ]
              : []),
            // Specific Section notice for student's classSection
            ...(studentSectionId ? [{ classSectionId: studentSectionId }] : []),
          ],
        },
      ];
    } else if (user.role === UserRole.PARENT) {
      const links = await this.prisma.parentStudent.findMany({
        where: { parentId: user.id },
        include: { student: true },
      });
      const childClassSectionIds = links
        .map((l) => l.student.classSectionId)
        .filter(Boolean) as string[];
      for (const link of links) {
        if (!link.student.classSectionId && link.student.gradeLevel && link.student.section) {
          const cs = await this.prisma.classSection.findFirst({
            where: {
              schoolId,
              className: link.student.gradeLevel,
              section: link.student.section,
            },
            select: { id: true },
          });
          if (cs && !childClassSectionIds.includes(cs.id)) {
            childClassSectionIds.push(cs.id);
          }
        }
      }
      const childGrades = links
        .map((l) => l.student.gradeLevel)
        .filter(Boolean) as string[];

      baseWhere.AND = [
        {
          OR: [
            // General Parent Notice
            {
              targetAudience: { in: [NoticeTargetAudience.ALL, NoticeTargetAudience.PARENTS] },
              classSectionId: null,
              targetGrade: null,
            },
            // Grade-wide notice for any linked child
            ...(childGrades.length > 0
              ? [
                  {
                    targetGrade: { in: childGrades },
                    classSectionId: null,
                  },
                ]
              : []),
            // Specific Section notice for any linked child
            ...(childClassSectionIds.length > 0
              ? [{ classSectionId: { in: childClassSectionIds } }]
              : []),
          ],
        },
      ];
    }

    const notices = await this.prisma.notice.findMany({
      where: baseWhere,
      include: {
        author: { select: { id: true, fullName: true, role: true, designation: true } },
        classSection: { select: { id: true, className: true, section: true } },
        reads: {
          where: { userId: user.id },
          select: { readAt: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { publishDate: 'desc' }],
    });

    return notices.map((n) => ({
      ...n,
      isRead: n.reads.length > 0,
      readAt: n.reads[0]?.readAt || null,
    }));
  }

  // =========================================================================
  // 5. GET SINGLE NOTICE & AUTO MARK READ
  // =========================================================================

  async getNoticeById(schoolId: string, noticeId: string, user: any) {
    await this.assertNoticesModuleEnabled(schoolId);

    const notice = await this.prisma.notice.findFirst({
      where: { id: noticeId, schoolId },
      include: {
        author: { select: { id: true, fullName: true, role: true, designation: true } },
        publishedBy: { select: { id: true, fullName: true, role: true } },
        classSection: { select: { id: true, className: true, section: true } },
        reads: {
          where: { userId: user.id },
          select: { readAt: true },
        },
        _count: {
          select: { reads: true },
        },
      },
    });

    if (!notice) {
      throw new NotFoundException('Notice not found in this school');
    }

    // Role-based visibility and targeting validation
    if (user.role === UserRole.STUDENT) {
      if (notice.status !== NoticeStatus.PUBLISHED) {
        throw new ForbiddenException('This notice has not been published yet');
      }

      const student = await this.prisma.student.findFirst({
        where: { studentUserId: user.id, schoolId },
      });

      if (!student) {
        throw new ForbiddenException('Student profile not found');
      }

      let studentSectionId = student.classSectionId;
      if (!studentSectionId && student.gradeLevel && student.section) {
        const cs = await this.prisma.classSection.findFirst({
          where: {
            schoolId,
            className: student.gradeLevel,
            section: student.section,
          },
          select: { id: true },
        });
        if (cs) studentSectionId = cs.id;
      }

      const matchesGeneral =
        (notice.targetAudience === NoticeTargetAudience.ALL ||
          notice.targetAudience === NoticeTargetAudience.STUDENTS) &&
        !notice.classSectionId &&
        !notice.targetGrade;
      const matchesGrade =
        notice.targetGrade === student.gradeLevel && !notice.classSectionId;
      const matchesSection =
        notice.classSectionId && notice.classSectionId === studentSectionId;

      if (!matchesGeneral && !matchesGrade && !matchesSection) {
        throw new ForbiddenException('You do not have permission to view this notice');
      }
    } else if (user.role === UserRole.PARENT) {
      if (notice.status !== NoticeStatus.PUBLISHED) {
        throw new ForbiddenException('This notice has not been published yet');
      }

      const links = await this.prisma.parentStudent.findMany({
        where: { parentId: user.id },
        include: { student: true },
      });
      const childClassSectionIds = links
        .map((l) => l.student.classSectionId)
        .filter(Boolean) as string[];
      for (const link of links) {
        if (!link.student.classSectionId && link.student.gradeLevel && link.student.section) {
          const cs = await this.prisma.classSection.findFirst({
            where: {
              schoolId,
              className: link.student.gradeLevel,
              section: link.student.section,
            },
            select: { id: true },
          });
          if (cs && !childClassSectionIds.includes(cs.id)) {
            childClassSectionIds.push(cs.id);
          }
        }
      }
      const childGrades = links
        .map((l) => l.student.gradeLevel)
        .filter(Boolean) as string[];

      const matchesGeneral =
        (notice.targetAudience === NoticeTargetAudience.ALL ||
          notice.targetAudience === NoticeTargetAudience.PARENTS) &&
        !notice.classSectionId &&
        !notice.targetGrade;
      const matchesGrade =
        notice.targetGrade &&
        childGrades.includes(notice.targetGrade) &&
        !notice.classSectionId;
      const matchesSection =
        notice.classSectionId && childClassSectionIds.includes(notice.classSectionId);

      if (!matchesGeneral && !matchesGrade && !matchesSection) {
        throw new ForbiddenException('You do not have permission to view this notice');
      }
    }

    // Record Read Receipt automatically
    if (notice.reads.length === 0) {
      await this.prisma.noticeRead.upsert({
        where: {
          noticeId_userId: {
            noticeId,
            userId: user.id,
          },
        },
        update: { readAt: new Date() },
        create: {
          noticeId,
          userId: user.id,
          schoolId,
        },
      });
    }

    const isExpired = notice.expiryDate && notice.expiryDate < new Date();

    return {
      ...notice,
      isExpired,
      computedStatus: isExpired ? NoticeStatus.EXPIRED : notice.status,
      isRead: true,
      readAt: notice.reads[0]?.readAt || new Date(),
      readCount: notice._count.reads,
    };
  }

  // =========================================================================
  // 6. MARK AS READ (Manual endpoint)
  // =========================================================================

  async markAsRead(schoolId: string, noticeId: string, userId: string) {
    await this.assertNoticesModuleEnabled(schoolId);

    const notice = await this.prisma.notice.findFirst({
      where: { id: noticeId, schoolId },
    });
    if (!notice) {
      throw new NotFoundException('Notice not found in this school');
    }

    const read = await this.prisma.noticeRead.upsert({
      where: {
        noticeId_userId: {
          noticeId,
          userId,
        },
      },
      update: { readAt: new Date() },
      create: {
        noticeId,
        userId,
        schoolId,
      },
    });

    return {
      ...read,
      isRead: true,
    };
  }

  // =========================================================================
  // 7. GET UNREAD NOTICES COUNT
  // =========================================================================

  async getUnreadCount(schoolId: string, user: any) {
    const notices = await this.listNotices(schoolId, {}, user);
    const unreadCount = notices.filter((n: any) => !n.isRead).length;
    return { unreadCount };
  }

  // =========================================================================
  // 8. DELETE NOTICE
  // =========================================================================

  async deleteNotice(schoolId: string, noticeId: string, user: any) {
    await this.assertNoticesModuleEnabled(schoolId);
    await this.assertCanManageNotices(user, schoolId);

    const notice = await this.prisma.notice.findFirst({
      where: { id: noticeId, schoolId },
    });
    if (!notice) {
      throw new NotFoundException('Notice not found in this school');
    }

    await this.prisma.notice.delete({
      where: { id: noticeId },
    });

    // Rule 8: Audit Log
    await this.audit.log({
      action: 'NOTICE_DELETED',
      entity: 'Notice',
      entityId: notice.id,
      details: { title: notice.title },
      userId: user.id,
      schoolId,
    });

    return { success: true, message: 'Notice deleted successfully' };
  }

  // =========================================================================
  // 9. STAFF NOTICE PERMISSIONS MANAGEMENT (School Admin)
  // =========================================================================

  async setStaffNoticePermission(
    schoolId: string,
    targetUserId: string,
    canManageNotices: boolean,
    user: any,
  ) {
    if (user.role !== UserRole.SCHOOL_ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only School Administrators can grant or revoke notice management permissions',
      );
    }

    const targetUser = await this.prisma.user.findFirst({
      where: { id: targetUserId, schoolId },
    });
    if (!targetUser) {
      throw new NotFoundException('Staff member not found in this school');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { canManageNotices },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        designation: true,
        canManageNotices: true,
      },
    });

    // Rule 8: Audit Log
    await this.audit.log({
      action: 'NOTICE_PERMISSION_CHANGED',
      entity: 'User',
      entityId: targetUser.id,
      details: {
        staffName: targetUser.fullName,
        canManageNotices,
      },
      userId: user.id,
      schoolId,
    });

    return updated;
  }

  async listStaffWithPermissions(schoolId: string) {
    return this.prisma.user.findMany({
      where: {
        schoolId,
        role: { in: [UserRole.TEACHER, UserRole.STAFF, UserRole.ACCOUNTANT] },
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        designation: true,
        department: true,
        canManageNotices: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }
}
