// src/health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DatabaseHealthIndicator } from './indicators/database-health.indicator';
import { RedisHealthIndicator } from './indicators/redis-health.indicator';
import { DiskHealthIndicator } from './indicators/disk-health.indicator';
import { MemoryHealthIndicator } from './indicators/memory-health.indicator';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    DatabaseHealthIndicator,
    RedisHealthIndicator,
    DiskHealthIndicator,
    MemoryHealthIndicator,
  ],
})
export class HealthModule {}
