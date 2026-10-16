import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";

/**
 * Registers the BullMQ root connection against Redis.
 *
 * Concrete queues/processors are intentionally not declared yet — register
 * them with `BullModule.registerQueue({ name: "..." })` in the feature module
 * that owns them.
 */
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>("redis.host"),
          port: config.get<number>("redis.port"),
          password: config.get<string>("redis.password"),
          db: config.get<number>("redis.db"),
        },
        prefix: "fundordonate",
      }),
    }),
  ],
})
export class QueueModule {}
