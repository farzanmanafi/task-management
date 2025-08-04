// src/monitoring/monitoring.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../shared/cache/cache.service';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

export interface AppMetrics {
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  database: {
    activeConnections: number;
    queryCount: number;
    avgResponseTime: number;
  };
  cache: {
    hitRate: number;
    memoryUsage: number;
    keyCount: number;
  };
  api: {
    requestCount: number;
    errorRate: number;
    avgResponseTime: number;
  };
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private totalResponseTime = 0;
  private queryCount = 0;
  private totalQueryTime = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
    @InjectConnection()
    private connection: Connection,
  ) {}

  async getMetrics(): Promise<AppMetrics> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = (Date.now() - this.startTime) / 1000;

    return {
      timestamp: new Date().toISOString(),
      uptime,
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      database: {
        activeConnections: this.connection.driver.pool?.numUsed || 0,
        queryCount: this.queryCount,
        avgResponseTime:
          this.queryCount > 0 ? this.totalQueryTime / this.queryCount : 0,
      },
      cache: {
        hitRate: this.getCacheHitRate(),
        memoryUsage: 0, // Would need Redis INFO command
        keyCount: 0, // Would need Redis DBSIZE command
      },
      api: {
        requestCount: this.requestCount,
        errorRate:
          this.requestCount > 0
            ? (this.errorCount / this.requestCount) * 100
            : 0,
        avgResponseTime:
          this.requestCount > 0
            ? this.totalResponseTime / this.requestCount
            : 0,
      },
    };
  }

  recordRequest(responseTime: number): void {
    this.requestCount++;
    this.totalResponseTime += responseTime;
  }

  recordError(): void {
    this.errorCount++;
  }

  recordQuery(queryTime: number): void {
    this.queryCount++;
    this.totalQueryTime += queryTime;
  }

  recordCacheHit(): void {
    this.cacheHits++;
  }

  recordCacheMiss(): void {
    this.cacheMisses++;
  }

  private getCacheHitRate(): number {
    const total = this.cacheHits + this.cacheMisses;
    return total > 0 ? (this.cacheHits / total) * 100 : 0;
  }

  async logMetrics(): Promise<void> {
    try {
      const metrics = await this.getMetrics();
      this.logger.log(`Metrics: ${JSON.stringify(metrics)}`);
    } catch (error) {
      this.logger.error(`Failed to log metrics: ${error.message}`);
    }
  }
}
