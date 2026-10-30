import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty({ message: "Student full name is required" })
  fullName: string;

  @IsString()
  @IsNotEmpty({ message: "Grade level is required (e.g., LKG, UKG, Class 1 .. Class 12)" })
  gradeLevel: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  rollNumber?: string;

  @IsOptional()
  @IsString()
  academicYear?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  admissionNumber?: string;

  // Parent/Guardian Information (Required to link parent to student)
  @IsEmail({}, { message: "Valid parent email address is required" })
  parentEmail: string;

  @IsString()
  @IsNotEmpty({ message: "Parent full name is required" })
  parentName: string;

  @IsOptional()
  @IsString()
  parentPhone?: string;

  @IsOptional()
  @IsString()
  parentRelationship?: string;

  // Student Portal Access (Class 5+ only)
  @IsOptional()
  @IsBoolean()
  enableStudentPortalLogin?: boolean;

  @IsOptional()
  @IsEmail({}, { message: "Valid student email is required if portal login is enabled" })
  studentEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: "Student password must be at least 8 characters" })
  studentPassword?: string;
}
