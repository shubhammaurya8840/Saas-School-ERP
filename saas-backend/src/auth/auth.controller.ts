import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RedeemInvitationDto } from "./dto/redeem-invitation.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../common/decorators/current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Get("invitation/:token")
  async verifyInvitation(@Param("token") token: string) {
    return this.authService.verifyInvitation(token);
  }

  @Post("invitation/redeem")
  @HttpCode(HttpStatus.OK)
  async redeemInvitation(
    @Body() dto: RedeemInvitationDto,
    @Req() req: Request
  ) {
    const ip = req.ip || req.socket.remoteAddress;
    return this.authService.redeemInvitation(dto, ip);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getProfile(user.id);
  }
}
