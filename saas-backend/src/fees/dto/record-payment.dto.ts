import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsIn,
  IsDateString,
  MaxLength,
} from "class-validator";

export const ALLOWED_PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "CHEQUE",
  "UPI",
  "DEMAND_DRAFT",
  "CARD",
] as const;

export class RecordPaymentDto {
  @IsString()
  @IsNotEmpty()
  studentFeePlanId: string;

  @IsNumber()
  @Min(0.01, { message: "Payment amount must be greater than zero." })
  amount: number;

  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_PAYMENT_METHODS, {
    message: `Payment method must be one of: ${ALLOWED_PAYMENT_METHODS.join(", ")}`,
  })
  paymentMethod: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  transactionReference?: string; // Cheque No, Bank UTR, or Deposit Slip

  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  remarks?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  idempotencyKey?: string; // Prevents duplicate double-entry submission
}
