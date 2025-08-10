import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AdvancedCacheService } from '../services/advanced-cache.service';
import { CACHE_KEY } from '../decorators/cache.decorator';
import { CACHE_TAGS_KEY } from '../decorators/cache-tags.decorator';

@Injectable()
export class AdvancedCacheInterceptor implements NestInterceptor {
  constructor(
    private advancedCacheService: AdvancedCacheService,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheMetadata = this.reflector.get(CACHE_KEY, context.getHandler());
    const cacheTags = this.reflector.get(CACHE_TAGS_KEY, context.getHandler());

    if (!cacheMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const cacheKey = this.buildCacheKey(cacheMetadata.key, request);

    const cachedValue = await this.advancedCacheService.get(cacheKey);
    if (cachedValue) {
      return new Observable((subscriber) => {
        subscriber.next(cachedValue);
        subscriber.complete();
      });
    }

    return next.handle().pipe(
      tap(async (result) => {
        await this.advancedCacheService.set(cacheKey, result, {
          ttl: cacheMetadata.ttl,
          tags: cacheTags,
        });
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

    return key;
  }
}
