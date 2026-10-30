import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateBookDto {
  @IsString()
  @IsNotEmpty({ message: "ISBN is required" })
  @MaxLength(50)
  isbn: string;

  @IsString()
  @IsNotEmpty({ message: "Book title is required" })
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty({ message: "Author name is required" })
  @MaxLength(255)
  author: string;

  @IsString()
  @IsNotEmpty({ message: "Category is required" })
  @MaxLength(100)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  publisher?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  edition?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  shelfLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  locationRack?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: "Total copies must be at least 1" })
  @Type(() => Number)
  totalCopies?: number;

  @IsOptional()
  @IsInt()
  @Min(1, { message: "Initial copies must be at least 1" })
  @Type(() => Number)
  initialCopies?: number;
}
