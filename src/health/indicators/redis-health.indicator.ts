// src/health/indicators/redis-health.indicator.ts
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { CacheService } from '../../shared/cache/cache.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private cacheService: CacheService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const testKey = 'health_check_test';
      const testValue = 'ok';

      await this.cacheService.set(testKey, testValue, 5);
      const retrievedValue = await this.cacheService.get(testKey);
      await this.cacheService.del(testKey);

      if (retrievedValue === testValue) {
        return this.getStatus(key, true, {
          redis: 'up',
          response_time: 'normal',
        });
      } else {
        throw new Error('Redis test failed');
      }
    } catch (error) {
      const result = this.getStatus(key, false, {
        redis: 'down',
        error: error.message,
      });
      throw new HealthCheckError('Redis health check failed', result);
    }
  }
}
