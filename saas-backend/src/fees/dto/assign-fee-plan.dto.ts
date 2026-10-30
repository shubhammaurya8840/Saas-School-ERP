import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ValidateNested,
  IsDateString,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";

export class CustomStudentInstallmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsDateString()
  dueDate: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class AssignFeePlanDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  feePlanId: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  academicYear?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  concessionType?: string; // "MERIT_SCHOLARSHIP", "SIBLING_CONCESSION", "STAFF_CHILD", "EWS"

  @IsNumber()
  @IsOptional()
  @Min(0)
  concessionAmount?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CustomStudentInstallmentDto)
  customInstallments?: CustomStudentInstallmentDto[];
}
