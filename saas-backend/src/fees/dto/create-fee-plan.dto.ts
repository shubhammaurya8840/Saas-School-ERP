import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  IsDateString,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";

export class FeePlanItemDto {
  @IsString()
  @IsNotEmpty()
  feeHeadId: string;

  @IsNumber()
  @Min(0)
  amount: number;
}

export class FeePlanInstallmentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsDateString()
  dueDate: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  percentage?: number;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  lateFeeFine?: number;
}

export class CreateFeePlanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  academicYear: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  applicableGrade?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FeePlanItemDto)
  items: FeePlanItemDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FeePlanInstallmentDto)
  installments?: FeePlanInstallmentDto[];
}
