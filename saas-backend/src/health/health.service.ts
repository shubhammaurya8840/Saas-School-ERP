import { Injectable, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface HealthCheckResponse {
  status: "ok" | "degraded" | "error";
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  database: {
    status: "connected" | "disconnected";
    type: string;
    databaseName: string;
    latencyMs?: number;
    error?: string;
  };
  environment: string;
}

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async checkHealth(): Promise<{ response: HealthCheckResponse; httpStatus: number }> {
    const dbHealth = await this.prisma.isHealthy();
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    // Extract database name from connection URL if possible (without exposing credentials)
    let databaseName = "school_erp";
    try {
      const dbUrl = process.env.DATABASE_URL || "";
      const match = dbUrl.match(/\/([^/?]+)(\?|$)/);
      if (match && match[1]) {
        databaseName = match[1];
      }
    } catch {
      databaseName = "school_erp";
    }

    const isConnected = dbHealth.connected;
    const overallStatus: "ok" | "error" = isConnected ? "ok" : "error";
    const httpStatus = isConnected ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;

    const response: HealthCheckResponse = {
      status: overallStatus,
      service: "school-erp-saas-backend",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds,
      database: {
        status: isConnected ? "connected" : "disconnected",
        type: "PostgreSQL (Prisma ORM)",
        databaseName,
        latencyMs: dbHealth.latencyMs,
        error: dbHealth.error,
      },
      environment: process.env.NODE_ENV || "development",
    };

    return { response, httpStatus };
  }
}
