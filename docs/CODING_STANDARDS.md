/**
 * Code Standards Documentation
 * Author: MAKU Travel Platform
 * Created: 2025-09-05
 * Purpose: Define coding standards and best practices for the project
 */

# MAKU Travel - Coding Standards & Guidelines

## 1. File Organization & Naming

### File Naming Conventions
- **React Components**: PascalCase (e.g., `HotelBookingWizard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useHotelSearch.ts`)
- **Utilities**: camelCase (e.g., `bookingUtils.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Types/Interfaces**: PascalCase (e.g., `BookingTypes.ts`)

### Directory Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI primitives
│   ├── forms/          # Form components
│   └── booking/        # Booking-specific components
├── features/           # Feature-based modules
│   ├── search/         # Search functionality
│   └── booking/        # Booking functionality
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
└── constants/          # Application constants
```

## 2. Component Standards

### Component Structure Template
```tsx
/**
 * ComponentName Component
 * Author: MAKU Travel Platform
 * Created: YYYY-MM-DD
 * Purpose: Brief description of component functionality
 */

import React from 'react';
import { ComponentProps } from './types';

interface IComponentNameProps {
  // Props definition
}

export const ComponentName = ({ 
  prop1, 
  prop2 
}: IComponentNameProps): JSX.Element => {
  // Component logic here
  
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

export default ComponentName;
```

### Component Guidelines
- **Single Responsibility**: Each component should have one clear purpose
- **Props Interface**: Always define interfaces for props with `I` prefix
- **Default Props**: Use default parameters instead of defaultProps
- **Export Pattern**: Use named exports for components, default export at bottom
- **JSX Return**: Keep JSX readable with proper indentation and line breaks

## 3. Hook Standards

### Custom Hook Template
```tsx
/**
 * useHookName Hook
 * Author: MAKU Travel Platform
 * Created: YYYY-MM-DD
 * Purpose: Brief description of hook functionality
 */

import { useState, useEffect } from 'react';

interface IUseHookNameReturn {
  // Return type definition
}

export const useHookName = (params: any): IUseHookNameReturn => {
  // Hook logic here
  
  return {
    // Return values
  };
};
```

### Hook Guidelines
- **Naming**: Always start with `use` prefix
- **Return Types**: Define clear return type interfaces
- **Error Handling**: Include error states and loading states
- **Cleanup**: Always clean up subscriptions and timeouts

## 4. TypeScript Standards

### Type Definitions
```typescript
// Interfaces for object shapes (use I prefix)
interface IBookingData {
  id: string;
  userId: string;
  status: BookingStatus;
}

// Types for unions and primitives
type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

// Enums for constants
enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
}
```

### TypeScript Guidelines
- **Strict Mode**: Always use strict TypeScript settings
- **Interface Prefix**: Use `I` prefix for interfaces
- **Type vs Interface**: Use `interface` for object shapes, `type` for unions
- **Explicit Returns**: Specify return types for functions when not obvious
- **Null Checks**: Always handle null/undefined cases

## 5. State Management

### useState Guidelines
```tsx
// Use descriptive names
const [isLoading, setIsLoading] = useState<boolean>(false);
const [hotelData, setHotelData] = useState<IHotelData | null>(null);
const [errors, setErrors] = useState<Record<string, string>>({});

// Use reducers for complex state
const [state, dispatch] = useReducer(bookingReducer, initialState);
```

### State Guidelines
- **Initial Values**: Always provide meaningful initial values
- **State Shape**: Keep state flat when possible
- **Updates**: Use functional updates for state that depends on previous state
- **Complex State**: Use useReducer for complex state logic

## 6. Error Handling

### Error Handling Pattern
```tsx
try {
  const result = await apiCall();
  setData(result);
  setError(null);
} catch (error) {
  console.error('API call failed:', error);
  setError(error instanceof Error ? error.message : 'Unknown error');
  
  // Log to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // logToService(error);
  }
}
```

### Error Guidelines
- **User-Friendly Messages**: Always show meaningful error messages to users
- **Logging**: Log errors with context for debugging
- **Fallback UI**: Provide fallback UI for error states
- **Recovery**: Allow users to retry failed operations

## 7. Performance Guidelines

### Optimization Patterns
```tsx
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Memoize callback functions
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);

// Lazy load components
const LazyComponent = lazy(() => import('./HeavyComponent'));
```

### Performance Guidelines
- **Memoization**: Use useMemo and useCallback judiciously
- **Code Splitting**: Implement route-based code splitting
- **Image Optimization**: Use proper image formats and lazy loading
- **Bundle Analysis**: Regular bundle size analysis

## 8. Testing Standards

### Test Structure Template
```tsx
/**
 * ComponentName Tests
 * Author: MAKU Travel Platform
 * Created: YYYY-MM-DD
 * Purpose: Unit tests for ComponentName component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  it('should render correctly with default props', () => {
    render(<ComponentName />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle user interactions', () => {
    const mockHandler = jest.fn();
    render(<ComponentName onClick={mockHandler} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Guidelines
- **Test Coverage**: Aim for 80%+ test coverage
- **User-Centric**: Test user interactions, not implementation details
- **Descriptive Names**: Use descriptive test names that explain behavior
- **Arrange-Act-Assert**: Follow AAA pattern in tests

## 9. Documentation Standards

### Function Documentation
```tsx
/**
 * Processes booking data and validates payment information
 * 
 * @param bookingData - The booking information to process
 * @param paymentMethod - Selected payment method
 * @returns Promise resolving to processed booking result
 * @throws {ValidationError} When booking data is invalid
 * @throws {PaymentError} When payment processing fails
 * 
 * @example
 * ```typescript
 * const result = await processBooking(bookingData, 'credit_card');
 * console.log(result.bookingId);
 * ```
 */
export const processBooking = async (
  bookingData: IBookingData,
  paymentMethod: PaymentMethod
): Promise<IBookingResult> => {
  // Implementation
};
```

### Documentation Guidelines
- **JSDoc Comments**: Use JSDoc for all public functions and components
- **Examples**: Provide usage examples for complex functions
- **README Updates**: Keep README files updated with latest changes
- **Inline Comments**: Use inline comments sparingly, for complex logic only

## 10. Git & Version Control

### Commit Message Format
```
type(scope): brief description

- Detailed explanation of changes
- Why the changes were made
- Any breaking changes or migration notes

Fixes #123
```

### Commit Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Branch Naming
- **feature/**: New features (`feature/hotel-booking-wizard`)
- **fix/**: Bug fixes (`fix/payment-validation-error`)
- **refactor/**: Code refactoring (`refactor/search-components`)
- **docs/**: Documentation updates (`docs/api-guidelines`)

## 11. Security Guidelines

### Input Validation
```tsx
// Always validate and sanitize user inputs
const validateBookingData = (data: unknown): IBookingData => {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Invalid booking data format');
  }
  
  // Use zod or similar for runtime validation
  return BookingDataSchema.parse(data);
};
```

### Security Guidelines
- **Input Validation**: Validate all user inputs
- **Sanitization**: Sanitize data before display
- **Authentication**: Check authentication state before sensitive operations
- **HTTPS**: Always use HTTPS in production
- **Dependencies**: Regularly update dependencies for security patches

## 12. Accessibility Standards

### Accessibility Guidelines
```tsx
// Use semantic HTML
<button type="button" aria-label="Close dialog">
  <X aria-hidden="true" />
</button>

// Provide alt text for images
<img src={hotel.image} alt={`${hotel.name} exterior view`} />

// Use proper heading hierarchy
<h1>Search Results</h1>
<h2>Filters</h2>
<h3>Price Range</h3>
```

### Accessibility Requirements
- **WCAG 2.2 AA**: Follow WCAG 2.2 AA guidelines
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
- **Screen Readers**: Test with screen readers
- **Color Contrast**: Maintain 4.5:1 contrast ratio minimum
- **Focus Management**: Proper focus management in modals and forms

---

## Implementation Checklist

When implementing new features, ensure:

- [ ] Component follows naming conventions
- [ ] TypeScript interfaces are defined
- [ ] Error handling is implemented
- [ ] Tests are written
- [ ] Documentation is updated
- [ ] Accessibility is considered
- [ ] Performance is optimized
- [ ] Code is reviewed
- [ ] Security implications are considered
- [ ] Mobile responsiveness is tested

This document should be updated as standards evolve and new patterns are established.