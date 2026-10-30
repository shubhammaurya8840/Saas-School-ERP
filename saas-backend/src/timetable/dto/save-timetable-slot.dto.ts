import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsIn,
  MaxLength,
} from "class-validator";

export const DAYS_OF_WEEK = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

export type DayOfWeekType = (typeof DAYS_OF_WEEK)[number];

export class SaveTimetableSlotDto {
  @IsUUID()
  @IsNotEmpty()
  classSectionId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(DAYS_OF_WEEK as unknown as string[])
  dayOfWeek: DayOfWeekType;

  @IsInt()
  @Min(1)
  @Max(8)
  periodNumber: number; // 1 to 8

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  startTime: string; // e.g. "08:30"

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  endTime: string; // e.g. "09:15"

  @IsString()
  @IsOptional()
  @MaxLength(50)
  room?: string; // e.g. "Room 201"

  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @IsUUID()
  @IsOptional()
  teacherId?: string;
}
