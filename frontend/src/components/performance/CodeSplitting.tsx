import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load components to reduce initial bundle size
const DashboardLazy = lazy(() => import('@/pages/Dashboard').then(module => ({ default: module.default })));
const SearchLazy = lazy(() => import('@/pages/Search').then(module => ({ default: module.default })));
const BookingLazy = lazy(() => import('@/pages/BookingDetails').then(module => ({ default: module.default })));
const AdminLazy = lazy(() => import('@/pages/AdminDashboard').then(module => ({ default: module.default })));

// Custom loading components for different sections
export const PageLoader: React.FC<{ height?: string }> = ({ height = 'h-96' }) => (
  <div className={`flex items-center justify-center ${height}`}>
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

export const DashboardLoader: React.FC = () => (
  <div className="space-y-6 p-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card className="animate-pulse">
      <CardContent className="p-6">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

export const SearchLoader: React.FC = () => (
  <div className="space-y-6 p-6">
    {/* Search Header */}
    <div className="animate-pulse">
      <Skeleton className="h-8 w-1/3 mb-4" />
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
          <Skeleton className="h-12 w-full mt-6" />
        </CardContent>
      </Card>
    </div>

    {/* Search Results */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <Skeleton className="h-48 w-full" />
          <CardContent className="p-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-3" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const BookingLoader: React.FC = () => (
  <div className="max-w-4xl mx-auto p-6 space-y-6">
    <div className="animate-pulse">
      <Skeleton className="h-8 w-1/3 mb-6" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-48 w-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-1/4 mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-1/2 mb-4" />
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-12 w-full mt-6" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
);

// Wrapper components with Suspense
export const LazyDashboard: React.FC = () => (
  <Suspense fallback={<DashboardLoader />}>
    <DashboardLazy />
  </Suspense>
);

export const LazySearch: React.FC = () => (
  <Suspense fallback={<SearchLoader />}>
    <SearchLazy />
  </Suspense>
);

export const LazyBooking: React.FC = () => (
  <Suspense fallback={<BookingLoader />}>
    <BookingLazy />
  </Suspense>
);

export const LazyAdmin: React.FC = () => (
  <Suspense fallback={<PageLoader />}>
    <AdminLazy />
  </Suspense>
);

// Route-based code splitting utility
export const createLazyRoute = (
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFn);
  
  return (props: any) => (
    <Suspense fallback={fallback || <PageLoader />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Component-level code splitting for heavy features
export const LazySecurityMonitoring = createLazyRoute(
  () => import('@/components/admin/SecurityMonitoring').then(module => ({ default: module.SecurityMonitoring })),
  <PageLoader height="h-screen" />
);

export const LazyObservabilityDashboard = createLazyRoute(
  () => import('@/components/observability/ObservabilityDashboard').then(module => ({ default: module.ObservabilityDashboard })),
  <DashboardLoader />
);

export const LazyTestingFramework = createLazyRoute(
  () => import('@/components/testing/TestingFramework').then(module => ({ default: module.TestingFramework })),
  <PageLoader />
);

// Preload critical routes
export const preloadCriticalRoutes = () => {
  // Preload dashboard after initial load
  setTimeout(() => {
    import('@/pages/Dashboard');
  }, 2000);

  // Preload search after user interaction
  const preloadSearch = () => {
    import('@/pages/Search');
    document.removeEventListener('mouseover', preloadSearch);
    document.removeEventListener('touchstart', preloadSearch);
  };

  document.addEventListener('mouseover', preloadSearch);
  document.addEventListener('touchstart', preloadSearch);
};

// Bundle analysis helper
export const getBundleInfo = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      chunks: performance.getEntriesByType('navigation'),
      resources: performance.getEntriesByType('resource').filter(
        resource => resource.name.includes('.js') || resource.name.includes('.css')
      )
    };
  }
  return null;
};