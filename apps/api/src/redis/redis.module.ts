import { Global, Logger, Module, OnApplicationShutdown } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ModuleRef } from "@nestjs/core";
import Redis from "ioredis";
import { REDIS_CLIENT } from "./redis.constants";

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const client = new Redis({
          host: config.get<string>("redis.host"),
          port: config.get<number>("redis.port"),
          password: config.get<string>("redis.password"),
          db: config.get<number>("redis.db"),
          // Required by BullMQ-style connections and keeps reconnects resilient.
          maxRetriesPerRequest: null,
        });

        client.on("connect", () => new Logger("Redis").log("Connected to Redis"));
        client.on("error", (error: Error) =>
          new Logger("Redis").error(`Redis error: ${error.message}`),
        );

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(private readonly moduleRef: ModuleRef) {}

  async onApplicationShutdown(): Promise<void> {
    const client = this.moduleRef.get<Redis>(REDIS_CLIENT, { strict: false });
    if (client) {
      await client.quit();
    }
  }
}
