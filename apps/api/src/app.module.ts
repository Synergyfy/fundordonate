import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import configuration from "./config/configuration";
import { validateEnv } from "./config/env.validation";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { QueueModule } from "./queue/queue.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./auth/auth.module";
import { McomModule } from "./mcom/mcom.module";
import { BusinessModule } from "./modules/business/business.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { AdminModule } from "./modules/admin/admin.module";
import { HubModule } from "./modules/hub/hub.module";
import { PublicCampaignsModule } from "./modules/campaigns/public-campaigns.module";
import { ConsumerModule } from "./modules/consumer/consumer.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: [".env"],
    }),
    PrismaModule,
    RedisModule,
    QueueModule,
    HealthModule,
    McomModule,
    AuthModule,
    BusinessModule,
    PaymentsModule,
    AdminModule,
    HubModule,
    PublicCampaignsModule,
    ConsumerModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
