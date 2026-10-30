import { IsString, IsNotEmpty, IsOptional, MaxLength } from "class-validator";

export class CreateSubjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string; // e.g. "Mathematics", "Science"

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string; // e.g. "MATH-08", "SCI-08"

  @IsString()
  @IsOptional()
  @MaxLength(50)
  applicableGrade?: string; // e.g. "Class 8" or null

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}
