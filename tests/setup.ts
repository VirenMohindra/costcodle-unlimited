/**
 * Vitest Test Setup
 * Global test configuration and mocks
 */

import { beforeEach, vi } from 'vitest';

// Mock global objects that are typically available in browser environment
const globalThis = global as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
globalThis.localStorage = localStorageMock;

// Mock fetch for game data loading
global.fetch = vi.fn();

// Mock DOM globals for Node environment
globalThis.window = {
  matchMedia: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })),
  innerWidth: 1024,
  innerHeight: 768
} as any;

globalThis.navigator = {
  userAgent: 'test-agent',
  maxTouchPoints: 0,
  onLine: true,
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined)
  },
  share: vi.fn().mockResolvedValue(undefined),
  serviceWorker: {
    register: vi.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      update: vi.fn()
    }),
    getRegistration: vi.fn().mockResolvedValue(null)
  }
} as any;

// Create a simple in-memory storage implementation
const memoryStorage: Record<string, string> = {};

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();

  // Clear memory storage
  Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]);

  // Setup localStorage mock with memory storage
  localStorageMock.getItem.mockImplementation((key: string) => {
    return memoryStorage[key] || null;
  });

  localStorageMock.setItem.mockImplementation((key: string, value: string) => {
    memoryStorage[key] = value;
  });

  localStorageMock.removeItem.mockImplementation((key: string) => {
    delete memoryStorage[key];
  });

  localStorageMock.clear.mockImplementation(() => {
    Object.keys(memoryStorage).forEach(key => delete memoryStorage[key]);
  });
});

// Extend global types for better TypeScript support
declare global {
  interface Window {
    CostcodleApp: any;
  }
}

// Add custom matchers or global test utilities here if needed
export {};
