import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '@/hooks/useAccessibility';

interface AccessibilityEnhancerProps {
  children: React.ReactNode;
  skipLinkTarget?: string;
  announceRouteChanges?: boolean;
  autoFocus?: boolean;
  className?: string;
}

export const AccessibilityEnhancer: React.FC<AccessibilityEnhancerProps> = ({
  children,
  skipLinkTarget = 'main-content',
  announceRouteChanges = true,
  autoFocus = false,
  className
}) => {
  const { t } = useTranslation();
  const { elementRef, announce, generateId } = useAccessibility({
    autoFocus,
    announceChanges: announceRouteChanges
  });

  const contentId = generateId('main-content');

  return (
    <div className={className}>
      {/* Skip Links */}
      <a
        href={`#${skipLinkTarget}`}
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 z-50 bg-primary text-primary-foreground px-4 py-2 text-sm font-medium rounded-b-md"
        onFocus={() => announce(t('accessibility.skipToContent'))}
      >
        {t('accessibility.skipToContent')}
      </a>

      {/* Main content with proper landmarks */}
      <main
        id={skipLinkTarget}
        ref={elementRef}
        className="focus:outline-none"
        tabIndex={-1}
        role="main"
        aria-label={t('accessibility.mainContent')}
      >
        {children}
      </main>

      {/* Screen reader announcements region */}
      <div
        id="announcements"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </div>
  );
};

// Focus trap for modals and dialogs
export const FocusTrap: React.FC<{
  children: React.ReactNode;
  isActive?: boolean;
  restoreFocus?: boolean;
  className?: string;
}> = ({ children, isActive = true, restoreFocus = true, className }) => {
  const trapRef = useRef<HTMLDivElement>(null);
  const { trapFocus } = useAccessibility();
  
  useEffect(() => {
    if (isActive && trapRef.current) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          trapFocus(e);
        }
      };
      
      trapRef.current.addEventListener('keydown', handleKeyDown);
      
      return () => {
        trapRef.current?.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isActive, trapFocus]);

  return (
    <div
      ref={trapRef}
      className={className}
      data-focus-trap={isActive}
    >
      {children}
    </div>
  );
};

// Enhanced form field with accessibility features
export const AccessibleFormField: React.FC<{
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}> = ({ label, children, error, hint, required, className }) => {
  const { t } = useTranslation();
  const { generateId } = useAccessibility();
  
  const fieldId = generateId('field');
  const errorId = generateId('error');
  const hintId = generateId('hint');

  // Clone children to add accessibility props
  const enhancedChildren = React.cloneElement(children as React.ReactElement, {
    id: fieldId,
    'aria-describedby': [
      hint ? hintId : null,
      error ? errorId : null
    ].filter(Boolean).join(' ') || undefined,
    'aria-invalid': error ? 'true' : undefined,
    'aria-required': required ? 'true' : undefined
  });

  return (
    <div className={className}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium mb-2"
      >
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label={t('accessibility.required')}>
            *
          </span>
        )}
        {!required && (
          <span className="text-muted-foreground ml-1 text-xs">
            ({t('accessibility.optional')})
          </span>
        )}
      </label>
      
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground mb-2">
          {hint}
        </p>
      )}
      
      {enhancedChildren}
      
      {error && (
        <p
          id={errorId}
          className="text-sm text-destructive mt-1"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible navigation with proper ARIA
export const AccessibleNavigation: React.FC<{
  items: Array<{
    label: string;
    href: string;
    isActive?: boolean;
    icon?: React.ReactNode;
  }>;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}> = ({ items, orientation = 'horizontal', className }) => {
  const { generateId } = useAccessibility();
  const navId = generateId('nav');

  return (
    <nav
      id={navId}
      className={className}
      aria-label="Main navigation"
      role="navigation"
    >
      <ul
        className={`flex ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} space-${orientation === 'vertical' ? 'y' : 'x'}-2`}
        role="menubar"
        aria-orientation={orientation}
      >
        {items.map((item, index) => (
          <li key={index} role="none">
            <a
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${
                item.isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              role="menuitem"
              aria-current={item.isActive ? 'page' : undefined}
              tabIndex={item.isActive ? 0 : -1}
            >
              {item.icon && (
                <span className="mr-2" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};