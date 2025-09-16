import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './skeleton';

interface EnhancedSkeletonProps {
  className?: string;
  variant?: 'card' | 'list' | 'profile' | 'text' | 'image' | 'button';
  lines?: number;
  showAvatar?: boolean;
}

export const EnhancedSkeleton: React.FC<EnhancedSkeletonProps> = ({
  className,
  variant = 'text',
  lines = 3,
  showAvatar = false
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return (
          <div className={cn('space-y-4 p-4 border rounded-lg', className)}>
            <Skeleton className="h-48 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        );

      case 'list':
        return (
          <div className={cn('space-y-3', className)}>
            {Array.from({ length: lines }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'profile':
        return (
          <div className={cn('space-y-4', className)}>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        );

      case 'image':
        return <Skeleton className={cn('h-48 w-full', className)} />;

      case 'button':
        return <Skeleton className={cn('h-10 w-20', className)} />;

      default:
        return (
          <div className={cn('space-y-2', className)}>
            {Array.from({ length: lines }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        );
    }
  };

  return renderSkeleton();
};

// Specialized skeleton components
export const HotelCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <EnhancedSkeleton variant="card" className={className} />
);

export const FlightCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-3 p-4 border rounded-lg', className)}>
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  </div>
);

export const ActivityCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('space-y-3 p-4 border rounded-lg', className)}>
    <Skeleton className="h-32 w-full" />
    <div className="space-y-2">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex items-center space-x-2">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
    <div className="flex justify-between items-center">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

export const SearchResultsSkeleton: React.FC<{ count?: number; type?: 'hotel' | 'flight' | 'activity' }> = ({
  count = 6,
  type = 'hotel'
}) => {
  const SkeletonComponent = type === 'hotel' ? HotelCardSkeleton : 
                          type === 'flight' ? FlightCardSkeleton : 
                          ActivityCardSkeleton;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  );
};