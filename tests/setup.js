// Global test setup
require('dotenv').config({ path: '.env.test' });

// Increase timeout for tests
jest.setTimeout(30000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to create test data
  createTestData: () => ({
    timestamp: new Date().toISOString(),
    testId: Math.random().toString(36).substring(7)
  })
};

// Clean up after tests
afterEach(() => {
  jest.clearAllMocks();
});