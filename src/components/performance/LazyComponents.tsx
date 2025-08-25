import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load heavy components for better performance
export const LazyAdminDashboard = lazy(() => 
  import('@/components/admin/AdminDashboard')
);

export const LazyInteractiveHotelMap = lazy(() => 
  import('@/components/maps/InteractiveHotelMap').then(module => ({ 
    default: module.InteractiveHotelMap 
  }))
);

export const LazyPerformanceMonitor = lazy(() => 
  import('@/components/performance/PerformanceMonitor').then(module => ({ 
    default: module.PerformanceMonitor 
  }))
);

export const LazySearchPerformanceOptimizer = lazy(() => 
  import('@/components/search/SearchPerformanceOptimizer').then(module => ({ 
    default: module.SearchPerformanceOptimizer 
  }))
);

export const LazyPersonalizationEngine = lazy(() => 
  import('@/components/personalization/PersonalizationEngine').then(module => ({ 
    default: module.PersonalizationEngine 
  }))
);

export const LazyAmadeusOptimizer = lazy(() => 
  import('@/components/api/AmadeusOptimizer').then(module => ({ 
    default: module.AmadeusOptimizer 
  }))
);

export const LazyRevenueOptimizer = lazy(() => 
  import('@/components/revenue/RevenueOptimizer').then(module => ({ 
    default: module.RevenueOptimizer 
  }))
);

export const LazyMultiPropertyBooking = lazy(() => 
  import('@/components/enterprise/MultiPropertyBooking').then(module => ({ 
    default: module.MultiPropertyBooking 
  }))
);

export const LazyLoyaltyProgramIntegration = lazy(() => 
  import('@/components/loyalty/LoyaltyProgramIntegration').then(module => ({ 
    default: module.LoyaltyProgramIntegration 
  }))
);

// Wrapper component with loading state
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyWrapper = ({ children, fallback }: LazyWrapperProps) => (
  <Suspense fallback={fallback || <LoadingSpinner size="lg" text="Loading..." />}>
    {children}
  </Suspense>
);

// Preload functions for critical routes
export const preloadAdminDashboard = () => {
  const componentImport = () => import('@/components/admin/AdminDashboard');
  return componentImport();
};

export const preloadHotelMap = () => {
  const componentImport = () => import('@/components/maps/InteractiveHotelMap');
  return componentImport();
};