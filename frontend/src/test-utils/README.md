# Test Utilities

This directory contains centralized test utilities to standardize testing patterns across the MAKU.Travel project.

## Phase 2: Test Environment Standardization

### Mock Factories (`mockFactories.ts`)

Centralized mock creation functions to eliminate duplication:

- `createAuthMock(userId)` - Mock authentication hooks
- `createToastMock()` - Mock toast notifications
- `createSupabaseMock()` - Mock Supabase client operations
- `createBookingDataClientMock()` - Mock booking data API calls
- `createConsoleMock()` - Mock console logging with auto-restore

### Test Setup (`testSetup.ts`)

Reusable setup functions and data factories:

- `setupStandardMocks(userId)` - Standard auth + toast + booking mocks
- `clearAllMocks()` - Clear all mocks (use in beforeEach)
- `mockAsyncSuccess(data)` - Promise.resolve helper
- `mockAsyncError(message)` - Promise.reject helper
- `createMockBooking(overrides)` - Mock booking data factory
- `createMockOffer(overrides)` - Mock offer data factory
- `createMockPaymentMethod(overrides)` - Mock payment method factory

### Usage Examples

```typescript
import { render, waitFor, vi } from '@/test-utils';
import { setupStandardMocks, clearAllMocks } from '@/test-utils/testSetup';

describe('MyComponent', () => {
  const { toast, fetchUserFavorites } = setupStandardMocks();

  beforeEach(() => {
    clearAllMocks();
  });

  it('should work', async () => {
    fetchUserFavorites.mockResolvedValue([]);
    render(<MyComponent />);
    await waitFor(() => {
      expect(fetchUserFavorites).toHaveBeenCalled();
    });
  });
});
```

### Benefits

- **Consistency**: Standardized mocking patterns across all tests
- **DRY**: Eliminates code duplication in test setup
- **Maintainability**: Single place to update mock implementations
- **Type Safety**: Proper TypeScript support for all mocks
- **Performance**: Optimized mock creation and cleanup