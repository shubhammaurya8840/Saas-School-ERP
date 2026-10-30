import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsIn,
  IsArray,
  ValidateNested,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";

export const STUDENT_ATTENDANCE_STATUSES = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "EXCUSED_LEAVE",
] as const;

export type StudentAttendanceStatus = (typeof STUDENT_ATTENDANCE_STATUSES)[number];

export class StudentAttendanceItemDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(STUDENT_ATTENDANCE_STATUSES as unknown as string[])
  status: StudentAttendanceStatus;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  remarks?: string;
}

export class MarkStudentAttendanceDto {
  @IsString()
  @IsNotEmpty()
  date: string; // YYYY-MM-DD

  @IsUUID()
  @IsOptional()
  classSectionId?: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceItemDto)
  records: StudentAttendanceItemDto[];
}
