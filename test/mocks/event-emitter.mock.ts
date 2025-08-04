// test/mocks/event-emitter.mock.ts
export const mockEventEmitter = {
  emit: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  removeListener: jest.fn(),
  removeAllListeners: jest.fn(),
};
