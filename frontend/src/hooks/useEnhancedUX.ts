import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

// Enhanced loading state management
export const useEnhancedLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const retryCountRef = useRef(0);
  const { toast } = useToast();

  const startLoading = useCallback((loadingSteps?: string[]) => {
    setIsLoading(true);
    setProgress(0);
    setCurrentStep(0);
    setError(null);
    if (loadingSteps) {
      setSteps(loadingSteps);
    }
  }, []);

  const updateProgress = useCallback((newProgress: number, step?: number) => {
    setProgress(Math.min(100, Math.max(0, newProgress)));
    if (step !== undefined) {
      setCurrentStep(step);
    }
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
    setProgress(prev => Math.min(100, prev + (100 / steps.length)));
  }, [steps.length]);

  const finishLoading = useCallback(() => {
    setProgress(100);
    setCurrentStep(steps.length);
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
      setCurrentStep(0);
      retryCountRef.current = 0;
    }, 500);
  }, [steps.length]);

  const setLoadingError = useCallback((err: Error) => {
    setError(err);
    setIsLoading(false);
    retryCountRef.current++;
    
    toast({
      title: "Loading Error",
      description: err.message,
      variant: "destructive"
    });
  }, [toast]);

  const retry = useCallback(async (retryFn: () => Promise<void>) => {
    try {
      setError(null);
      startLoading();
      await retryFn();
      finishLoading();
    } catch (err) {
      setLoadingError(err as Error);
    }
  }, [startLoading, finishLoading, setLoadingError]);

  return {
    isLoading,
    progress,
    currentStep,
    steps,
    error,
    retryCount: retryCountRef.current,
    startLoading,
    updateProgress,
    nextStep,
    finishLoading,
    setLoadingError,
    retry
  };
};

// Enhanced error handling
export const useEnhancedErrorHandler = () => {
  const [errors, setErrors] = useState<Array<{ id: string; error: Error; timestamp: Date }>>([]);
  const { toast } = useToast();

  const handleError = useCallback((error: Error, context?: string) => {
    const errorId = Date.now().toString();
    const errorEntry = {
      id: errorId,
      error,
      timestamp: new Date()
    };

    setErrors(prev => [...prev.slice(-9), errorEntry]); // Keep last 10 errors

    // Show user-friendly error message
    const userMessage = getUserFriendlyErrorMessage(error);
    
    toast({
      title: context ? `${context} Error` : "Error",
      description: userMessage,
      variant: "destructive"
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${context || 'App'}] Error:`, error);
    }

    return errorId;
  }, [toast]);

  const clearError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(e => e.id !== errorId));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    errors,
    handleError,
    clearError,
    clearAllErrors
  };
};

// User-friendly error message mapping
const getUserFriendlyErrorMessage = (error: Error): string => {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Unable to connect to our servers. Please check your internet connection.';
  }
  
  if (message.includes('timeout')) {
    return 'The request is taking longer than expected. Please try again.';
  }
  
  if (message.includes('quota') || message.includes('rate limit')) {
    return 'Service temporarily unavailable. Please try again in a few minutes.';
  }
  
  if (message.includes('authentication') || message.includes('unauthorized')) {
    return 'Please log in to continue.';
  }
  
  if (message.includes('payment') || message.includes('stripe')) {
    return 'Payment processing error. Please check your payment details.';
  }
  
  return 'Something went wrong. Please try again or contact support if the issue persists.';
};

// Mobile detection and optimization
export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setIsMobile(width <= 768);
      setIsTablet(width > 768 && width <= 1024);
      setOrientation(height > width ? 'portrait' : 'landscape');
      setViewportHeight(height);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkDevice, 100); // Delay to get accurate dimensions
    });

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    orientation,
    viewportHeight,
    isSmallScreen: isMobile,
    isTouchDevice: 'ontouchstart' in window
  };
};

// Gesture support for mobile
export const useGestures = () => {
  const [gesture, setGesture] = useState<{
    type: 'swipe' | 'pinch' | 'tap' | null;
    direction?: 'up' | 'down' | 'left' | 'right';
    scale?: number;
  }>({ type: null });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - potential swipe or tap
      const touch = e.touches[0];
      setGesture({
        type: 'tap',
        direction: undefined,
        scale: undefined
      });
    } else if (e.touches.length === 2) {
      // Multi-touch - potential pinch
      setGesture({
        type: 'pinch',
        direction: undefined,
        scale: 1
      });
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1 && gesture.type === 'tap') {
      // Convert tap to swipe
      setGesture(prev => ({ ...prev, type: 'swipe' }));
    }
  }, [gesture.type]);

  const handleTouchEnd = useCallback(() => {
    setTimeout(() => {
      setGesture({ type: null });
    }, 100);
  }, []);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return gesture;
};

// Performance monitoring
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0,
    networkRequests: 0
  });

  useEffect(() => {
    // Monitor page load performance
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      setMetrics(prev => ({
        ...prev,
        loadTime: navigation.loadEventEnd - navigation.loadEventStart
      }));
    }

    // Monitor network requests
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      setMetrics(prev => ({
        ...prev,
        networkRequests: prev.networkRequests + entries.length
      }));
    });

    observer.observe({ entryTypes: ['resource'] });

    return () => observer.disconnect();
  }, []);

  return metrics;
};

// Accessibility enhancements
export const useAccessibilityEnhancements = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('normal');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check user preferences
    const highContrastMedia = window.matchMedia('(prefers-contrast: high)');
    const reduceMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

    setIsHighContrast(highContrastMedia.matches);
    setReduceMotion(reduceMotionMedia.matches);

    const handleContrastChange = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);

    highContrastMedia.addListener(handleContrastChange);
    reduceMotionMedia.addListener(handleMotionChange);

    return () => {
      highContrastMedia.removeListener(handleContrastChange);
      reduceMotionMedia.removeListener(handleMotionChange);
    };
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontSize(prev => {
      switch (prev) {
        case 'normal': return 'large';
        case 'large': return 'extra-large';
        default: return 'extra-large';
      }
    });
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => {
      switch (prev) {
        case 'extra-large': return 'large';
        case 'large': return 'normal';
        default: return 'normal';
      }
    });
  }, []);

  return {
    isHighContrast,
    fontSize,
    reduceMotion,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize: () => setFontSize('normal')
  };
};