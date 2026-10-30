import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateGradingRuleDto {
  @IsString()
  @IsNotEmpty()
  name: string; // e.g. "Standard 10-Point Scale"

  @IsNumber()
  @Min(0)
  @Max(100)
  minPercentage: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  maxPercentage: number;

  @IsString()
  @IsNotEmpty()
  grade: string; // "A+", "A", "B", "C", "D", "E", "F"

  @IsNumber()
  @IsOptional()
  gradePoint?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPassing?: boolean = true;

  @IsString()
  @IsOptional()
  academicYear?: string;
}
