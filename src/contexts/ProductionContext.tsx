import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { errorTracker } from '@/lib/errorTracking';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface ProductionContextType {
  featureFlags: Record<string, any>;
  isFeatureEnabled: (flagName: string) => boolean;
  trackError: (error: Error | string, context?: Record<string, any>) => void;
  trackPerformance: (operation: string, duration: number, context?: Record<string, any>) => void;
}

const ProductionContext = createContext<ProductionContextType | undefined>(undefined);

interface ProductionProviderProps {
  children: ReactNode;
}

export const ProductionProvider: React.FC<ProductionProviderProps> = ({ children }) => {
  const { flags, loadFlags, isEnabled } = useFeatureFlags();
  const { user } = useAuth();

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  const isFeatureEnabled = (flagName: string): boolean => {
    return isEnabled(flagName, user?.id);
  };

  const trackError = (error: Error | string, context?: Record<string, any>) => {
    errorTracker.trackError(error, {
      userContext: user ? { userId: user.id, email: user.email } : {},
      requestContext: context
    });
  };

  const trackPerformance = (operation: string, duration: number, context?: Record<string, any>) => {
    errorTracker.trackPerformance(operation, duration, context);
  };

  const value: ProductionContextType = {
    featureFlags: flags,
    isFeatureEnabled,
    trackError,
    trackPerformance
  };

  return (
    <ProductionContext.Provider value={value}>
      {children}
    </ProductionContext.Provider>
  );
};

export const useProduction = (): ProductionContextType => {
  const context = useContext(ProductionContext);
  if (!context) {
    throw new Error('useProduction must be used within a ProductionProvider');
  }
  return context;
};