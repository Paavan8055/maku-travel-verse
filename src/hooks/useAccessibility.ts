import { useEffect, useRef } from 'react';

interface UseAccessibilityOptions {
  /**
   * Automatically focus the element when it mounts
   */
  autoFocus?: boolean;
  /**
   * Skip this element during tab navigation
   */
  skipFocus?: boolean;
  /**
   * Announce content changes to screen readers
   */
  announceChanges?: boolean;
}

/**
 * Hook for managing accessibility patterns
 */
export const useAccessibility = (options: UseAccessibilityOptions = {}) => {
  const elementRef = useRef<HTMLElement>(null);
  const { autoFocus = false, skipFocus = false, announceChanges = false } = options;

  // Auto-focus management
  useEffect(() => {
    if (autoFocus && elementRef.current) {
      // Delay focus to ensure element is fully rendered
      const timer = setTimeout(() => {
        elementRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  // Focus trap for modals/dialogs
  const trapFocus = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !elementRef.current) return;

    const focusableElements = elementRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  // Announce content changes
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceChanges) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Check if user prefers reduced motion
  const prefersReducedMotion = () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  // Generate accessible IDs
  const generateId = (prefix = 'accessible') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  };

  return {
    elementRef,
    trapFocus,
    announce,
    prefersReducedMotion,
    generateId,
    // Common accessibility attributes
    accessibilityProps: {
      ref: elementRef,
      tabIndex: skipFocus ? -1 : undefined,
    },
  };
};

/**
 * Hook for managing focus restoration
 */
export const useFocusRestore = () => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  };

  const restoreFocus = () => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      // Restore focus on cleanup
      restoreFocus();
    };
  }, []);

  return { saveFocus, restoreFocus };
};

/**
 * Hook for managing skip links
 */
export const useSkipLinks = () => {
  const skipToContent = () => {
    const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
    if (mainContent) {
      (mainContent as HTMLElement).focus();
      (mainContent as HTMLElement).scrollIntoView({ behavior: 'smooth' });
    }
  };

  return { skipToContent };
};