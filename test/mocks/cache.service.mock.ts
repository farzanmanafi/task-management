// test/mocks/cache.service.mock.ts
export const mockCacheService = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
  delPattern: jest.fn().mockResolvedValue(undefined),
  exists: jest.fn().mockResolvedValue(false),
  increment: jest.fn().mockResolvedValue(1),
  hget: jest.fn().mockResolvedValue(null),
  hset: jest.fn().mockResolvedValue(undefined),
  hdel: jest.fn().mockResolvedValue(undefined),
  flush: jest.fn().mockResolvedValue(undefined),
  generateKey: jest.fn().mockImplementation((...args) => args.join(':')),
  getOrSet: jest.fn().mockImplementation(async (key, fetchFunction) => {
    return await fetchFunction();
  }),
};
