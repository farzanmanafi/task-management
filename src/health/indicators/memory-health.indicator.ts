// src/health/indicators/memory-health.indicator.ts
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';

@Injectable()
export class MemoryHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal;
      const usedMemory = memoryUsage.heapUsed;
      const freeMemory = totalMemory - usedMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      // Consider unhealthy if memory usage is above 90%
      const isHealthy = memoryUsagePercent < 90;

      if (isHealthy) {
        return this.getStatus(key, true, {
          memory: 'up',
          used: usedMemory,
          total: totalMemory,
          free: freeMemory,
          usage_percent: memoryUsagePercent,
        });
      } else {
        throw new Error('High memory usage');
      }
    } catch (error) {
      const result = this.getStatus(key, false, {
        memory: 'down',
        error: error.message,
      });
      throw new HealthCheckError('Memory health check failed', result);
    }
  }
}
