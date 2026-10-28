import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { join } from "node:path";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { uploadsRoot } from "./common/uploads";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  const config = app.get(ConfigService);
  const logger = new Logger("Bootstrap");

  // Campaign media is served from /uploads and rendered by the web app on a
  // different origin, so allow cross-origin embedding for those responses.
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cookieParser());

  // Only mount local uploads when the local storage provider is active — with
  // a CDN (MEDIA_STORAGE=cloudinary) media is served from the CDN directly.
  if ((process.env.MEDIA_STORAGE ?? "local").trim().toLowerCase() !== "cloudinary") {
    app.useStaticAssets(uploadsRoot(), {
      prefix: "/uploads/",
      maxAge: "7d",
      index: false,
    });
  }

  const corsOrigin = config.get<string>("cors.origin") ?? "http://localhost:5023";
  const allowedOrigins = corsOrigin === "*" ? true : corsOrigin.split(",").map((o) => o.trim());
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins === true) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://localhost:") ||
        origin.startsWith("http://127.0.0.1:")
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  });

  // All routes live under /api/v1, except the health probe which stays at /health.
  app.setGlobalPrefix("api/v1", { exclude: ["health"] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = config.get<number>("port") ?? 5024;

  if (config.get<string>("nodeEnv") !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("FundorDonate API")
      .setDescription("Crowdfunding & Donation Platform API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`Swagger docs on http://localhost:${port}/api/docs`);
  }

  await app.listen(port);

  logger.log(`API running on http://localhost:${port}/api/v1`);
  logger.log(`Health check on http://localhost:${port}/health`);
}

void bootstrap();
