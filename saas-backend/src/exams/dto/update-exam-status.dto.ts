import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateExamStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['DRAFT', 'REVIEWED', 'PUBLISHED'], {
    message: 'Status must be one of DRAFT, REVIEWED, or PUBLISHED',
  })
  status: 'DRAFT' | 'REVIEWED' | 'PUBLISHED';
}
