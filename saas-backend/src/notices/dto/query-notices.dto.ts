import { IsOptional, IsString, IsEnum } from 'class-validator';
import { NoticePriority, NoticeStatus, NoticeTargetAudience } from '@prisma/client';

export class QueryNoticesDto {
  @IsOptional()
  @IsEnum(NoticeStatus)
  status?: NoticeStatus;

  @IsOptional()
  @IsEnum(NoticePriority)
  priority?: NoticePriority;

  @IsOptional()
  @IsEnum(NoticeTargetAudience)
  targetAudience?: NoticeTargetAudience;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  academicYear?: string;
}
