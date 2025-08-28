import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Search, MapPin, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { EnhancedSkeleton, SearchResultsSkeleton } from '@/components/ui/enhanced-skeleton';

interface LoadingStateProps {
  type?: 'search' | 'booking' | 'payment' | 'general';
  message?: string;
  className?: string;
  showProgress?: boolean;
  progress?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type = 'general',
  message,
  className,
  showProgress = false,
  progress = 0
}) => {
  const { t } = useTranslation();

  const getLoadingConfig = () => {
    switch (type) {
      case 'search':
        return {
          icon: Search,
          defaultMessage: t('loading.searching'),
          color: 'text-primary'
        };
      case 'booking':
        return {
          icon: Calendar,
          defaultMessage: t('loading.processingBooking'),
          color: 'text-green-600'
        };
      case 'payment':
        return {
          icon: Loader2,
          defaultMessage: t('loading.processingPayment'),
          color: 'text-blue-600'
        };
      default:
        return {
          icon: Loader2,
          defaultMessage: t('common.loading'),
          color: 'text-primary'
        };
    }
  };

  const config = getLoadingConfig();
  const Icon = config.icon;

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 space-y-4', className)}>
      <div className="relative">
        <Icon className={cn('h-8 w-8 animate-spin', config.color)} />
        {showProgress && (
          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
            <div className="w-16 h-1 bg-muted rounded-full">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground text-center">
        {message || config.defaultMessage}
      </p>
      {showProgress && (
        <p className="text-xs text-muted-foreground">
          {Math.round(progress)}% {t('common.complete')}
        </p>
      )}
    </div>
  );
};

// Specialized loading components
export const SearchLoadingState: React.FC<{ 
  searchType?: 'hotels' | 'flights' | 'activities';
  className?: string;
}> = ({ searchType = 'hotels', className }) => {
  const { t } = useTranslation();
  
  const messages = {
    hotels: t('loading.searchingHotels'),
    flights: t('loading.searchingFlights'),
    activities: t('loading.searchingActivities')
  };

  return (
    <div className={cn('space-y-6', className)} role="status" aria-live="polite">
      <LoadingState 
        type="search" 
        message={messages[searchType]}
        showProgress={true}
        progress={65}
      />
      <SearchResultsSkeleton type={searchType === 'hotels' ? 'hotel' : searchType === 'flights' ? 'flight' : 'activity'} />
    </div>
  );
};

export const BookingLoadingState: React.FC<{ 
  step?: 'validating' | 'processing' | 'confirming';
  className?: string;
}> = ({ step = 'processing', className }) => {
  const { t } = useTranslation();
  
  const stepMessages = {
    validating: t('loading.validatingBooking'),
    processing: t('loading.processingBooking'),
    confirming: t('loading.confirmingBooking')
  };

  const stepProgress = {
    validating: 30,
    processing: 70,
    confirming: 90
  };

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <LoadingState 
          type="booking"
          message={stepMessages[step]}
          showProgress={true}
          progress={stepProgress[step]}
        />
        <div className="mt-6 space-y-2">
          <EnhancedSkeleton variant="text" lines={2} />
          <div className="flex justify-between items-center mt-4">
            <EnhancedSkeleton className="h-4 w-24" />
            <EnhancedSkeleton className="h-6 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const PaymentLoadingState: React.FC<{ className?: string }> = ({ className }) => {
  const { t } = useTranslation();

  return (
    <div className={cn('text-center space-y-4', className)} role="status" aria-live="polite">
      <div className="flex justify-center">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-pulse" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="font-medium">{t('loading.processingPayment')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('loading.doNotRefresh')}
        </p>
      </div>
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-xs text-blue-700">
          {t('loading.secureProcessing')}
        </p>
      </div>
    </div>
  );
};

// Full page loading overlay
export const LoadingOverlay: React.FC<{
  isVisible: boolean;
  type?: LoadingStateProps['type'];
  message?: string;
}> = ({ isVisible, type, message }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <Card className="w-auto min-w-72">
        <CardContent className="p-6">
          <LoadingState type={type} message={message} />
        </CardContent>
      </Card>
    </div>
  );
};