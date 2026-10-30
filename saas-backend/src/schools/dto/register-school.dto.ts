import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
  IsInt,
  Min,
  IsEnum,
  IsObject,
  IsBoolean,
} from "class-validator";
import { SubscriptionPlan } from "@prisma/client";

export class UploadSettingsDto {
  @IsBoolean()
  @IsOptional()
  allowStudentUploads?: boolean;

  @IsBoolean()
  @IsOptional()
  allowParentUploads?: boolean;

  @IsBoolean()
  @IsOptional()
  allowStaffUploads?: boolean;
}

export class RegisterSchoolDto {
  @IsString()
  @IsNotEmpty({ message: "School Name is required" })
  @MinLength(3, { message: "School Name must be at least 3 characters" })
  name: string;

  @IsString()
  @IsOptional()
  legalName?: string;

  @IsString()
  @IsNotEmpty({ message: "Tenant Workspace Slug is required" })
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug must contain only lowercase letters, numbers, and single hyphens",
  })
  slug: string;

  @IsString()
  @IsOptional()
  board?: string = "CBSE";

  @IsString()
  @IsOptional()
  academicYear?: string; // Optional per PRD Rule 2

  @IsString()
  @IsNotEmpty({ message: "City is required" })
  city: string;

  @IsString()
  @IsNotEmpty({ message: "State is required" })
  state: string;

  @IsString()
  @IsOptional()
  country?: string = "India";

  @IsString()
  @IsOptional()
  timezone?: string = "Asia/Kolkata";

  @IsString()
  @IsOptional()
  currency?: string = "INR";

  // Primary School Admin Info
  @IsString()
  @IsNotEmpty({ message: "Administrator Full Name is required" })
  adminName: string;

  @IsEmail({}, { message: "Please provide a valid administrator email" })
  @IsNotEmpty({ message: "Administrator Email is required" })
  adminEmail: string;

  @IsString()
  @IsOptional()
  adminPhone?: string;

  @IsString()
  @IsOptional()
  adminDesignation?: string = "Principal / Director";

  // Subscription Plan & Resource Limits
  @IsEnum(SubscriptionPlan)
  @IsOptional()
  plan?: SubscriptionPlan = SubscriptionPlan.GROWTH;

  @IsInt()
  @Min(10)
  @IsOptional()
  maxStudents?: number = 1000;

  @IsInt()
  @Min(5)
  @IsOptional()
  maxStaff?: number = 100;

  @IsInt()
  @Min(500)
  @IsOptional()
  storageLimitMb?: number = 5000;

  // Module Entitlements
  @IsObject()
  @IsOptional()
  modules?: Record<string, boolean>;

  // Upload Permissions (PRD Section 2)
  @IsObject()
  @IsOptional()
  uploadSettings?: UploadSettingsDto;
}
