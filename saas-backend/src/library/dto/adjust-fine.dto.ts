import {
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class AdjustFineDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  transactionReference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string;
}
