import { Inject, Injectable } from "@nestjs/common";
import { HealthIndicatorResult, HealthIndicatorService } from "@nestjs/terminus";
import type Redis from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.constants";

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    try {
      const pong = await this.redis.ping();
      if (pong !== "PONG") {
        return indicator.down({ message: `Unexpected PING response: ${pong}` });
      }
      return indicator.up();
    } catch (error) {
      return indicator.down({ message: (error as Error).message });
    }
  }
}
