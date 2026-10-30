import { IsString, IsNotEmpty, IsOptional, IsBoolean, MaxLength } from "class-validator";

export class CreateFeeHeadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsBoolean()
  @IsOptional()
  isRecurring?: boolean;
}
