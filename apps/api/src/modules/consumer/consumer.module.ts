import { Module } from "@nestjs/common";
import { ConsumerController } from "./consumer.controller";
import { ConsumerService } from "./consumer.service";
import { PrismaModule } from "@/prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ConsumerController],
  providers: [ConsumerService],
  exports: [ConsumerService],
})
export class ConsumerModule {}
