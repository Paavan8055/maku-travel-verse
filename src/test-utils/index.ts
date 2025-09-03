/**
 * Test utilities entry point
 * Phase 2: Test Environment Standardization
 */

export * from './mockFactories';
export * from './testSetup';

// Re-export common testing library functions for convenience
export {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';

export { vi } from 'vitest';