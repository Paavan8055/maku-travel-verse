import { describe, it, expect } from 'vitest';

describe('smoke suite', () => {
  it('verifies the test harness is operational', () => {
    expect(1 + 1).toBe(2);
  });
});
