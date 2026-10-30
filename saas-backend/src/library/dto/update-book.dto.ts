import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";

export class UpdateBookDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  isbn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  author?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

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
  @Min(1)
  @Type(() => Number)
  totalCopies?: number;
}
