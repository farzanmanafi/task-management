// src/shared/services/advanced-cache.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as crypto from 'crypto';

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  compress?: boolean;
  serialize?: boolean;
}

export interface CacheEntry<T> {
  value: T;
  tags: string[];
  timestamp: number;
  ttl: number;
  hits: number;
}

@Injectable()
export class AdvancedCacheService {
  private readonly logger = new Logger(AdvancedCacheService.name);
  private readonly cacheHits = new Map<string, number>();
  private readonly cacheMisses = new Map<string, number>();

  constructor(
    private cacheService: CacheService,
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const cacheKey = this.buildCacheKey(key);
      const entry = await this.cacheService.get<CacheEntry<T>>(cacheKey);

      if (!entry) {
        this.recordCacheMiss(key);
        return null;
      }

      // Check if entry is expired
      if (this.isExpired(entry)) {
        await this.cacheService.del(cacheKey);
        this.recordCacheMiss(key);
        return null;
      }

      // Update hit count
      entry.hits++;
      await this.cacheService.set(cacheKey, entry, entry.ttl);

      this.recordCacheHit(key);
      return entry.value;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}: ${error.message}`);
      return null;
    }
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {},
  ): Promise<void> {
    try {
      const cacheKey = this.buildCacheKey(key);
      const ttl = options.ttl || 3600;

      let processedValue = value;
      if (options.compress) {
        processedValue = await this.compress(value);
      }

      const entry: CacheEntry<T> = {
        value: processedValue,
        tags: options.tags || [],
        timestamp: Date.now(),
        ttl,
        hits: 0,
      };

      await this.cacheService.set(cacheKey, entry, ttl);

      // Store tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.storeTags(cacheKey, options.tags);
      }

      this.eventEmitter.emit('cache.set', { key, tags: options.tags });
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}: ${error.message}`);
    }
  }

  async remember<T>(
    key: string,
    callback: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    const cachedValue = await this.get<T>(key, options);
    if (cachedValue !== null) {
      return cachedValue;
    }

    const value = await callback();
    await this.set(key, value, options);
    return value;
  }

  async invalidateByTags(tags: string[]): Promise<void> {
    try {
      for (const tag of tags) {
        const tagKey = this.buildTagKey(tag);
        const keys = await this.cacheService.get<string[]>(tagKey);

        if (keys) {
          await Promise.all(keys.map((key) => this.cacheService.del(key)));
          await this.cacheService.del(tagKey);
        }
      }

      this.eventEmitter.emit('cache.invalidated', { tags });
      this.logger.log(`Invalidated cache for tags: ${tags.join(', ')}`);
    } catch (error) {
      this.logger.error(
        `Cache invalidation error for tags ${tags.join(', ')}: ${
          error.message
        }`,
      );
    }
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    try {
      await this.cacheService.delPattern(pattern);
      this.eventEmitter.emit('cache.pattern_invalidated', { pattern });
      this.logger.log(`Invalidated cache for pattern: ${pattern}`);
    } catch (error) {
      this.logger.error(
        `Cache pattern invalidation error for ${pattern}: ${error.message}`,
      );
    }
  }

  async getStats(): Promise<any> {
    const totalHits = Array.from(this.cacheHits.values()).reduce(
      (sum, hits) => sum + hits,
      0,
    );
    const totalMisses = Array.from(this.cacheMisses.values()).reduce(
      (sum, misses) => sum + misses,
      0,
    );
    const hitRate =
      totalHits + totalMisses > 0
        ? (totalHits / (totalHits + totalMisses)) * 100
        : 0;

    return {
      hitRate,
      totalHits,
      totalMisses,
      topKeys: {
        mostHits: this.getTopKeys(this.cacheHits, 10),
        mostMisses: this.getTopKeys(this.cacheMisses, 10),
      },
    };
  }

  async warmupCache(
    warmupStrategies: Array<{
      key: string;
      callback: () => Promise<any>;
      options?: CacheOptions;
    }>,
  ): Promise<void> {
    this.logger.log('Starting cache warmup...');

    const promises = warmupStrategies.map(
      async ({ key, callback, options }) => {
        try {
          const value = await callback();
          await this.set(key, value, options);
          this.logger.log(`Warmed up cache for key: ${key}`);
        } catch (error) {
          this.logger.error(
            `Failed to warm up cache for key ${key}: ${error.message}`,
          );
        }
      },
    );

    await Promise.all(promises);
    this.logger.log('Cache warmup completed');
  }

  private buildCacheKey(key: string): string {
    return `cache:${key}`;
  }

  private buildTagKey(tag: string): string {
    return `tag:${tag}`;
  }

  private async storeTags(cacheKey: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = this.buildTagKey(tag);
      const existingKeys =
        (await this.cacheService.get<string[]>(tagKey)) || [];

      if (!existingKeys.includes(cacheKey)) {
        existingKeys.push(cacheKey);
        await this.cacheService.set(tagKey, existingKeys, 86400); // 24 hours
      }
    }
  }

  private isExpired<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl * 1000;
  }

  private async compress<T>(value: T): Promise<T> {
    // Simple compression implementation
    // In production, you might use a proper compression library
    return value;
  }

  private recordCacheHit(key: string): void {
    this.cacheHits.set(key, (this.cacheHits.get(key) || 0) + 1);
  }

  private recordCacheMiss(key: string): void {
    this.cacheMisses.set(key, (this.cacheMisses.get(key) || 0) + 1);
  }

  private getTopKeys(
    map: Map<string, number>,
    limit: number,
  ): Array<{ key: string; count: number }> {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => ({ key, count }));
  }
}
