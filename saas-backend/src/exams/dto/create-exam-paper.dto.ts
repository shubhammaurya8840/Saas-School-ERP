import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateExamPaperDto {
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
