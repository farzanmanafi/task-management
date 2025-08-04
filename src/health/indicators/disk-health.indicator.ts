// src/health/indicators/disk-health.indicator.ts
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

@Injectable()
export class DiskHealthIndicator extends HealthIndicator {
  constructor(private configService: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const uploadPath = this.configService.get<string>(
        'UPLOAD_DESTINATION',
        './uploads',
      );
      const stats = fs.statSync(uploadPath);
      const diskUsage = this.getDiskUsage(uploadPath);

      const isHealthy = diskUsage.free > 1024 * 1024 * 100; // 100MB minimum

      if (isHealthy) {
        return this.getStatus(key, true, {
          disk: 'up',
          free_space: diskUsage.free,
          total_space: diskUsage.total,
          usage_percent:
            ((diskUsage.total - diskUsage.free) / diskUsage.total) * 100,
        });
      } else {
        throw new Error('Insufficient disk space');
      }
    } catch (error) {
      const result = this.getStatus(key, false, {
        disk: 'down',
        error: error.message,
      });
      throw new HealthCheckError('Disk health check failed', result);
    }
  }

  private getDiskUsage(path: string): { free: number; total: number } {
    try {
      const stats = fs.statSync(path);
      // This is a simplified implementation
      // In production, you might use statvfs or similar
      return {
        free: 1024 * 1024 * 1024, // 1GB (placeholder)
        total: 10 * 1024 * 1024 * 1024, // 10GB (placeholder)
      };
    } catch (error) {
      return { free: 0, total: 0 };
    }
  }
}
