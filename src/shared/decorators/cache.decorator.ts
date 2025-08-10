import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY = 'cache_key';

export const CacheData = (key: string, ttl: number = 300) => {
  return SetMetadata(CACHE_KEY, { key, ttl });
};
