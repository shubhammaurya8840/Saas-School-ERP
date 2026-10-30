import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);

  // Set global API prefix (all routes accessible under /api/*)
  app.setGlobalPrefix("api");

  // Global validation pipe for type-safe DTO parsing
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    })
  );

  // Configure CORS for SaaS Frontend & SuperAdmin origins
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "*")
    .split(",")
    .map((o) => o.trim());

  app.enableCors({
    origin: allowedOrigins.includes("*") ? true : allowedOrigins,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`🚀 School ERP SaaS Backend running on: http://localhost:${port}/api`);
  logger.log(`🩺 Health check endpoint live at: http://localhost:${port}/api/health`);
}

bootstrap();
