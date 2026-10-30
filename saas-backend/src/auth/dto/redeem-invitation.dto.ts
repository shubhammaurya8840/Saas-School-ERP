import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class RedeemInvitationDto {
  @IsString()
  @IsNotEmpty({ message: "Invitation token is required" })
  token: string;

  @IsString()
  @IsNotEmpty({ message: "New password is required" })
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  password: string;
}
