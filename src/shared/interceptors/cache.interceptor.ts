import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../cache/cache.service';

import { CACHE_KEY } from '../decorators/cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheMetadata = this.reflector.get(CACHE_KEY, context.getHandler());

    if (!cacheMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const cacheKey = this.buildCacheKey(cacheMetadata.key, request);

    const cachedValue = await this.cacheService.get(cacheKey);
    if (cachedValue) {
      return new Observable((subscriber) => {
        subscriber.next(cachedValue);
        subscriber.complete();
      });
    }

    return next.handle().pipe(
      tap(async (result) => {
        await this.cacheService.set(cacheKey, result, cacheMetadata.ttl);
      }),
    );
  }

  private buildCacheKey(template: string, request: any): string {
    let key = template;

    // Replace placeholders with actual values
    key = key.replace(/\{userId\}/g, request.user?.id || 'anonymous');
    key = key.replace(/\{method\}/g, request.method);
    key = key.replace(/\{url\}/g, request.url);

    // Replace route parameters
    if (request.params) {
      Object.keys(request.params).forEach((param) => {
        key = key.replace(
          new RegExp(`\\{${param}\\}`, 'g'),
          request.params[param],
        );
      });
    }

    // Replace query parameters
    if (request.query) {
      Object.keys(request.query).forEach((param) => {
        key = key.replace(
          new RegExp(`\\{query\\.${param}\\}`, 'g'),
          request.query[param],
        );
      });
    }

    return key;
  }
}
