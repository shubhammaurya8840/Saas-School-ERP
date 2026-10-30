import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  MaxLength,
} from "class-validator";
import { BorrowerType } from "@prisma/client";

export class IssueBookDto {
  @IsUUID("4", { message: "Valid book ID is required" })
  bookId: string;

  @IsOptional()
  @IsUUID("4", { message: "Valid copy ID required if specified" })
  copyId?: string;

  @IsOptional()
  @IsUUID("4", { message: "Valid copy ID required if specified" })
  bookCopyId?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsEnum(BorrowerType, {
    message: "Borrower type must be STUDENT or STAFF",
  })
  borrowerType: BorrowerType;

  @IsOptional()
  @IsUUID("4", { message: "Valid student ID required for student borrower" })
  studentId?: string;

  @IsOptional()
  @IsUUID("4", { message: "Valid user ID required for staff borrower" })
  userId?: string;

  @IsOptional()
  @IsUUID("4", { message: "Valid staff user ID required for staff borrower" })
  staffUserId?: string;

  @IsOptional()
  @IsDateString({}, { message: "Due date must be a valid ISO date string" })
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  remarks?: string;
}
