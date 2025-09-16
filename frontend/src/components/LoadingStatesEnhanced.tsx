import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Plane, Hotel, Calendar } from 'lucide-react';

interface BookingLoadingStateProps {
  type: 'flight' | 'hotel' | 'activity';
  stage: 'searching' | 'booking' | 'payment' | 'confirmation';
  message?: string;
}

export const BookingLoadingState: React.FC<BookingLoadingStateProps> = ({ 
  type, 
  stage, 
  message 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'flight': return Plane;
      case 'hotel': return Hotel;
      case 'activity': return Calendar;
      default: return Loader2;
    }
  };

  const getStageMessage = () => {
    if (message) return message;
    
    switch (stage) {
      case 'searching':
        return `Searching for ${type}s...`;
      case 'booking':
        return `Creating your ${type} booking...`;
      case 'payment':
        return 'Processing payment...';
      case 'confirmation':
        return 'Confirming your booking...';
      default:
        return 'Loading...';
    }
  };

  const Icon = getIcon();

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="h-8 w-8 text-primary animate-pulse" />
        </div>
        <div className="absolute -bottom-1 -right-1">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="font-semibold text-lg">{getStageMessage()}</h3>
        <p className="text-muted-foreground text-sm">
          Please wait while we process your request
        </p>
      </div>
      
      <div className="w-64 space-y-2">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-3/4 mx-auto" />
      </div>
    </div>
  );
};

interface PaymentLoadingStateProps {
  stage: 'preparing' | 'processing' | 'confirming';
}

export const PaymentLoadingState: React.FC<PaymentLoadingStateProps> = ({ stage }) => {
  const getMessage = () => {
    switch (stage) {
      case 'preparing':
        return 'Preparing payment...';
      case 'processing':
        return 'Processing payment...';
      case 'confirming':
        return 'Confirming transaction...';
      default:
        return 'Processing...';
    }
  };

  return (
    <Card className="travel-card">
      <CardHeader>
        <div className="text-center space-y-4">
          <div className="h-12 w-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
          <h3 className="font-semibold">{getMessage()}</h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </CardContent>
    </Card>
  );
};

interface FormLoadingStateProps {
  fields?: number;
  title?: string;
}

export const FormLoadingState: React.FC<FormLoadingStateProps> = ({ 
  fields = 4, 
  title = 'Loading form...' 
}) => {
  return (
    <Card className="travel-card">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-full mt-6" />
      </CardContent>
    </Card>
  );
};

export const SearchResultsLoadingState: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="travel-card">
          <CardContent className="p-6">
            <div className="flex space-x-4">
              <Skeleton className="h-16 w-16 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
              <div className="text-right space-y-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};