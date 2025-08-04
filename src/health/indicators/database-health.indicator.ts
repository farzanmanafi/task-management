// src/health/indicators/database-health.indicator.ts
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(
    @InjectConnection()
    private connection: Connection,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.connection.query('SELECT 1');
      const result = this.getStatus(key, true, {
        database: 'up',
        connection: this.connection.isConnected,
      });
      return result;
    } catch (error) {
      const result = this.getStatus(key, false, {
        database: 'down',
        error: error.message,
      });
      throw new HealthCheckError('Database health check failed', result);
    }
  }
}
