import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from "class-validator";

export class CreateClassSectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  className: string; // e.g. "Class 8", "Class 3", "LKG"

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  section: string; // e.g. "A", "B", "C"

  @IsString()
  @IsOptional()
  @MaxLength(50)
  room?: string; // e.g. "Room 204"

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  academicYear: string; // e.g. "2026-2027"

  @IsUUID()
  @IsOptional()
  classTeacherId?: string;
}
