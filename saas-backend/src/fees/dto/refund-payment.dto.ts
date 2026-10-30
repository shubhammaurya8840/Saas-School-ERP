import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, MaxLength } from "class-validator";

export class RefundPaymentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  refundReason: string;

  @IsNumber()
  @IsOptional()
  @Min(0.01)
  refundAmount?: number; // Defaults to full payment amount if not specified
}
