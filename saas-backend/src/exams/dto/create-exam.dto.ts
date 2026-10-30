import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExamPaperInputDto {
  @IsUUID()
  @IsNotEmpty()
  subjectId: string;

  @IsDateString()
  @IsNotEmpty()
  examDate: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxMarks?: number = 100;

  @IsNumber()
  @Min(0)
  @IsOptional()
  passingMarks?: number = 35;

  @IsString()
  @IsOptional()
  room?: string;
}

export class CreateExamDto {
  @IsString()
  @IsNotEmpty()
  name: string; // e.g. "Term 1 Examination", "Mid-Term Exam", "Unit Test 1"

  @IsString()
  @IsNotEmpty()
  academicYear: string; // e.g. "2026-2027"

  @IsString()
  @IsOptional()
  term?: string; // "TERM_1", "TERM_2", "FINAL"

  @IsUUID()
  @IsNotEmpty()
  classSectionId: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  // Optional single paper shorthand
  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @IsDateString()
  @IsOptional()
  examDate?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxMarks?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  passingMarks?: number;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  room?: string;

  // Optional multi-paper array
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamPaperInputDto)
  @IsOptional()
  papers?: ExamPaperInputDto[];
}
