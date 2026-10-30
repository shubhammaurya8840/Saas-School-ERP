import {
  IsOptional,
  IsBoolean,
  IsString,
  IsDateString,
  MaxLength,
} from "class-validator";

export class ReturnBookDto {
  @IsOptional()
  @IsDateString({}, { message: "Return date must be a valid ISO date string" })
  returnedDate?: string;

  @IsOptional()
  @IsBoolean()
  isFinePaid?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  finePaidRemarks?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string;
}
