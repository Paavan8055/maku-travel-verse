import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAccessibility } from '@/hooks/useAccessibility';

interface AccessibilityContextType {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleLargeText: () => void;
  setScreenReader: (enabled: boolean) => void;
  setKeyboardNavigation: (enabled: boolean) => void;
  announce: (message: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibilityContext = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilityContext must be used within AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);
  
  const { announce, prefersReducedMotion } = useAccessibility();

  useEffect(() => {
    // Load saved preferences
    const saved = localStorage.getItem('accessibility-preferences');
    if (saved) {
      try {
        const prefs = JSON.parse(saved);
        setHighContrast(prefs.highContrast || false);
        setReducedMotion(prefs.reducedMotion || prefersReducedMotion);
        setLargeText(prefs.largeText || false);
        setScreenReader(prefs.screenReader || false);
        setKeyboardNavigation(prefs.keyboardNavigation || false);
      } catch (error) {
        console.error('Error loading accessibility preferences:', error);
      }
    } else {
      // Use system preferences as defaults
      setReducedMotion(prefersReducedMotion);
    }
  }, [prefersReducedMotion]);

  useEffect(() => {
    // Save preferences
    const prefs = {
      highContrast,
      reducedMotion,
      largeText,
      screenReader,
      keyboardNavigation
    };
    localStorage.setItem('accessibility-preferences', JSON.stringify(prefs));

    // Apply CSS classes to body
    const body = document.body;
    body.classList.toggle('high-contrast', highContrast);
    body.classList.toggle('reduced-motion', reducedMotion);
    body.classList.toggle('large-text', largeText);
    body.classList.toggle('screen-reader-active', screenReader);
    body.classList.toggle('keyboard-navigation', keyboardNavigation);
  }, [highContrast, reducedMotion, largeText, screenReader, keyboardNavigation]);

  useEffect(() => {
    // Detect keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setKeyboardNavigation(true);
      }
    };

    const handleMouseDown = () => {
      setKeyboardNavigation(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  const toggleHighContrast = () => setHighContrast(!highContrast);
  const toggleReducedMotion = () => setReducedMotion(!reducedMotion);
  const toggleLargeText = () => setLargeText(!largeText);

  const value: AccessibilityContextType = {
    highContrast,
    reducedMotion,
    largeText,
    screenReader,
    keyboardNavigation,
    toggleHighContrast,
    toggleReducedMotion,
    toggleLargeText,
    setScreenReader,
    setKeyboardNavigation,
    announce
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider;