import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth(@Res() res: Response) {
    const { response, httpStatus } = await this.healthService.checkHealth();
    return res.status(httpStatus).json(response);
  }
}
