import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "info", "warn", "error"]
          : ["error"],
    });
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async connectWithRetry(retries = 3, delayMs = 2000): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.$connect();
        this.logger.log("✅ Successfully connected to PostgreSQL database.");
        return true;
      } catch (error) {
        this.logger.warn(
          `⚠️ PostgreSQL connection attempt ${attempt}/${retries} failed: ${error.message}`
        );
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          this.logger.error(
            "❌ Could not establish connection to PostgreSQL database after retries. Health check will report database disconnected."
          );
          return false;
        }
      }
    }
    return false;
  }

  async isHealthy(): Promise<{
    connected: boolean;
    latencyMs?: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      await this.$queryRaw`SELECT 1 as health_check`;
      return {
        connected: true,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message || "Failed to execute database ping query",
      };
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Prisma disconnected from PostgreSQL.");
  }
}
