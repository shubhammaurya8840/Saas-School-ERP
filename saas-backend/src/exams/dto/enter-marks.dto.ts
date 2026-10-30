import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StudentMarkEntryDto {
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @IsNumber()
  @Min(0, { message: 'Marks obtained cannot be negative' })
  marksObtained: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class EnterMarksDto {
  @IsUUID()
  @IsOptional()
  examPaperId?: string;

  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentMarkEntryDto)
  marks: StudentMarkEntryDto[];
}
