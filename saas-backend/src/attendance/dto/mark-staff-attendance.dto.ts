import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsIn,
  MaxLength,
} from "class-validator";

export const STAFF_ATTENDANCE_STATUSES = [
  "PRESENT",
  "ABSENT",
  "ON_LEAVE",
  "HALF_DAY",
] as const;

export type StaffAttendanceStatus = (typeof STAFF_ATTENDANCE_STATUSES)[number];

export class MarkStaffAttendanceDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  date: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  @IsIn(STAFF_ATTENDANCE_STATUSES as unknown as string[])
  status: StaffAttendanceStatus;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  checkIn?: string; // e.g. "08:15 AM"

  @IsString()
  @IsOptional()
  @MaxLength(20)
  checkOut?: string; // e.g. "03:30 PM"

  @IsString()
  @IsOptional()
  @MaxLength(255)
  remarks?: string;
}
