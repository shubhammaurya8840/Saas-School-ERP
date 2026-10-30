import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NoticesService } from './notices.service';
import { CreateNoticeDto } from './dto/create-notice.dto';
import { UpdateNoticeDto } from './dto/update-notice.dto';
import { QueryNoticesDto } from './dto/query-notices.dto';
import { ToggleStaffPermissionDto } from './dto/toggle-staff-permission.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('notices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  // 1. Create Notice (School Admin or explicitly authorized staff)
  @Post()
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STAFF,
    UserRole.ACCOUNTANT,
    UserRole.LIBRARIAN,
  )
  @HttpCode(HttpStatus.CREATED)
  async createNotice(
    @CurrentUser('schoolId') schoolId: string,
    @Body() dto: CreateNoticeDto,
    @CurrentUser() user: any,
  ) {
    return this.noticesService.createNotice(schoolId, dto, user);
  }

  // 2. List Notices (Role targeted and tenant isolated)
  @Get()
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STAFF,
    UserRole.ACCOUNTANT,
    UserRole.LIBRARIAN,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  async listNotices(
    @CurrentUser('schoolId') schoolId: string,
    @Query() query: QueryNoticesDto,
    @CurrentUser() user: any,
  ) {
    return this.noticesService.listNotices(schoolId, query, user);
  }

  // 3. Unread Count for current user
  @Get('unread-count')
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STAFF,
    UserRole.ACCOUNTANT,
    UserRole.LIBRARIAN,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  async getUnreadCount(
    @CurrentUser('schoolId') schoolId: string,
    @CurrentUser() user: any,
  ) {
    return this.noticesService.getUnreadCount(schoolId, user);
  }

  // 4. Staff Notice Management Permissions List (School Admin)
  @Get('staff/permissions')
  @Roles(UserRole.SCHOOL_ADMIN)
  async listStaffWithPermissions(@CurrentUser('schoolId') schoolId: string) {
    return this.noticesService.listStaffWithPermissions(schoolId);
  }

  // 5. Grant or Revoke Staff Notice Permission (School Admin)
  @Patch('staff/:userId/permission')
  @Roles(UserRole.SCHOOL_ADMIN)
  async setStaffNoticePermission(
    @CurrentUser('schoolId') schoolId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: ToggleStaffPermissionDto,
    @CurrentUser() user: any,
  ) {
    return this.noticesService.setStaffNoticePermission(
      schoolId,
      targetUserId,
      dto.canManageNotices,
      user,
    );
  }

  // 6. Get Single Notice Details & Auto Mark as Read
  @Get(':id')
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STAFF,
    UserRole.ACCOUNTANT,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  async getNoticeById(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') noticeId: string,
    @CurrentUser() user: any,
  ) {
    return this.noticesService.getNoticeById(schoolId, noticeId, user);
  }

  // 7. Update Notice
  @Patch(':id')
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STAFF,
    UserRole.ACCOUNTANT,
    UserRole.LIBRARIAN,
  )
  async updateNotice(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') noticeId: string,
    @Body() dto: UpdateNoticeDto,
    @CurrentUser() user: any,
  ) {
    return this.noticesService.updateNotice(schoolId, noticeId, dto, user);
  }

  // 8. Publish Notice
  @Post(':id/publish')
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STAFF,
    UserRole.ACCOUNTANT,
    UserRole.LIBRARIAN,
  )
  @HttpCode(HttpStatus.OK)
  async publishNotice(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') noticeId: string,
    @CurrentUser() user: any,
  ) {
    return this.noticesService.publishNotice(schoolId, noticeId, user);
  }

  // 9. Mark Notice as Read
  @Post(':id/read')
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STAFF,
    UserRole.ACCOUNTANT,
    UserRole.LIBRARIAN,
    UserRole.STUDENT,
    UserRole.PARENT,
  )
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') noticeId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.noticesService.markAsRead(schoolId, noticeId, userId);
  }

  // 10. Delete Notice
  @Delete(':id')
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STAFF,
  )
  async deleteNotice(
    @CurrentUser('schoolId') schoolId: string,
    @Param('id') noticeId: string,
    @CurrentUser() user: any,
  ) {
    return this.noticesService.deleteNotice(schoolId, noticeId, user);
  }
}
