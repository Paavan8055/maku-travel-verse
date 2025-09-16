import { useEffect, useCallback, useState } from 'react';

interface AccessibilityOptions {
  enableScreenReader?: boolean;
  enableKeyboardNavigation?: boolean;
  enableHighContrast?: boolean;
  enableLargeText?: boolean;
  enableReducedMotion?: boolean;
}

export const useAccessibilityEnhancer = (options: AccessibilityOptions = {}) => {
  const [currentFocus, setCurrentFocus] = useState<Element | null>(null);
  const [skipLinksVisible, setSkipLinksVisible] = useState(false);

  // Enhanced keyboard navigation
  const handleKeyboardNavigation = useCallback((event: KeyboardEvent) => {
    // Skip to main content
    if (event.altKey && event.key === 'm') {
      event.preventDefault();
      const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
      if (mainContent) {
        (mainContent as HTMLElement).focus();
        mainContent.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Skip to navigation
    if (event.altKey && event.key === 'n') {
      event.preventDefault();
      const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
      if (nav) {
        (nav as HTMLElement).focus();
        nav.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Enhanced Tab navigation with visible focus indicators
    if (event.key === 'Tab') {
      setSkipLinksVisible(true);
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      // Add visible focus indicators
      focusableElements.forEach(el => {
        el.addEventListener('focus', () => setCurrentFocus(el));
        el.addEventListener('blur', () => setCurrentFocus(null));
      });
    }

    // Escape key to close modals or return to main content
    if (event.key === 'Escape') {
      const activeModal = document.querySelector('[role="dialog"][aria-hidden="false"]');
      if (activeModal) {
        const closeButton = activeModal.querySelector('[aria-label*="close"], [aria-label*="Close"]');
        if (closeButton) {
          (closeButton as HTMLElement).click();
        }
      }
    }
  }, []);

  // Screen reader announcements
  const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!options.enableScreenReader) return;

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
  }, [options.enableScreenReader]);

  // Focus management for dynamic content
  const manageFocus = useCallback((target: HTMLElement | string) => {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (element) {
      (element as HTMLElement).focus();
      // Announce focus change to screen readers
      const label = element.getAttribute('aria-label') || element.textContent || 'Content';
      announceToScreenReader(`Focused on ${label}`, 'polite');
    }
  }, [announceToScreenReader]);

  // High contrast mode toggle
  const toggleHighContrast = useCallback(() => {
    document.documentElement.classList.toggle('high-contrast');
    const isEnabled = document.documentElement.classList.contains('high-contrast');
    announceToScreenReader(
      `High contrast mode ${isEnabled ? 'enabled' : 'disabled'}`, 
      'assertive'
    );
  }, [announceToScreenReader]);

  // Large text mode toggle
  const toggleLargeText = useCallback(() => {
    document.documentElement.classList.toggle('large-text');
    const isEnabled = document.documentElement.classList.contains('large-text');
    announceToScreenReader(
      `Large text mode ${isEnabled ? 'enabled' : 'disabled'}`, 
      'assertive'
    );
  }, [announceToScreenReader]);

  // Reduced motion toggle
  const toggleReducedMotion = useCallback(() => {
    document.documentElement.classList.toggle('reduce-motion');
    const isEnabled = document.documentElement.classList.contains('reduce-motion');
    announceToScreenReader(
      `Reduced motion ${isEnabled ? 'enabled' : 'disabled'}`, 
      'assertive'
    );
  }, [announceToScreenReader]);

  // Form validation announcements
  const announceFormErrors = useCallback((errors: string[]) => {
    if (errors.length > 0) {
      const errorMessage = `Form has ${errors.length} error${errors.length > 1 ? 's' : ''}: ${errors.join(', ')}`;
      announceToScreenReader(errorMessage, 'assertive');
    }
  }, [announceToScreenReader]);

  // Progress announcements
  const announceProgress = useCallback((current: number, total: number, description?: string) => {
    const percentage = Math.round((current / total) * 100);
    const message = description 
      ? `${description}: ${percentage}% complete, ${current} of ${total}`
      : `Progress: ${percentage}% complete`;
    announceToScreenReader(message, 'polite');
  }, [announceToScreenReader]);

  useEffect(() => {
    if (options.enableKeyboardNavigation) {
      document.addEventListener('keydown', handleKeyboardNavigation);
      return () => {
        document.removeEventListener('keydown', handleKeyboardNavigation);
      };
    }
  }, [handleKeyboardNavigation, options.enableKeyboardNavigation]);

  // Add CSS for accessibility features
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
      
      .high-contrast {
        filter: contrast(150%);
      }
      
      .large-text {
        font-size: 120% !important;
      }
      
      .large-text * {
        font-size: inherit !important;
      }
      
      .reduce-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
      
      /* Enhanced focus indicators */
      *:focus {
        outline: 3px solid hsl(var(--primary)) !important;
        outline-offset: 2px !important;
      }
      
      /* Skip links */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        padding: 8px;
        z-index: 100;
        text-decoration: none;
        border-radius: 4px;
      }
      
      .skip-link:focus {
        top: 6px;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return {
    announceToScreenReader,
    manageFocus,
    toggleHighContrast,
    toggleLargeText,
    toggleReducedMotion,
    announceFormErrors,
    announceProgress,
    currentFocus,
    skipLinksVisible
  };
};