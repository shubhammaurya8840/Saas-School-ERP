import { IsString, IsNotEmpty, IsBoolean, IsOptional } from "class-validator";

export class ToggleModuleDto {
  @IsString()
  @IsNotEmpty({ message: "moduleKey is required" })
  moduleKey: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
