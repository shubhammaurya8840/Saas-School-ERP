import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { UserRole } from "@prisma/client";

export class CreateUserDto {
  @IsEmail({}, { message: "Valid email address is required" })
  email: string;

  @IsString()
  @IsNotEmpty({ message: "Full name is required" })
  fullName: string;

  @IsEnum(UserRole, {
    message: "Valid user role required (TEACHER, STAFF, ACCOUNTANT, LIBRARIAN)",
  })
  role: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  designation?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters if provided" })
  password?: string;
}
