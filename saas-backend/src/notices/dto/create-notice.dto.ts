import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  IsArray,
  IsIn,
} from 'class-validator';
import { NoticePriority, NoticeStatus, NoticeTargetAudience, UserRole } from '@prisma/client';

export class CreateNoticeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(NoticePriority)
  @IsOptional()
  priority?: NoticePriority = NoticePriority.NORMAL;

  @IsEnum(NoticeStatus)
  @IsOptional()
  status?: NoticeStatus = NoticeStatus.DRAFT;

  @IsEnum(NoticeTargetAudience)
  @IsOptional()
  targetAudience?: NoticeTargetAudience = NoticeTargetAudience.ALL;

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
