import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsArray,
} from 'class-validator';
import { NoticePriority, NoticeStatus, NoticeTargetAudience, UserRole } from '@prisma/client';

export class UpdateNoticeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsEnum(NoticePriority)
  @IsOptional()
  priority?: NoticePriority;

  @IsEnum(NoticeStatus)
  @IsOptional()
  status?: NoticeStatus;

  @IsEnum(NoticeTargetAudience)
  @IsOptional()
  targetAudience?: NoticeTargetAudience;

  @IsArray()
  @IsEnum(UserRole, { each: true })
  @IsOptional()
  targetRoles?: UserRole[];

  @IsUUID()
  @IsOptional()
  classSectionId?: string;

  @IsString()
  @IsOptional()
  targetGrade?: string;

  @IsDateString()
  @IsOptional()
  publishDate?: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsOptional()
  attachments?: any;
}
