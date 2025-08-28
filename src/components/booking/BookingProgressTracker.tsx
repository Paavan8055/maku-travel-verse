import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, AlertCircle, Search, CreditCard, FileCheck, ShoppingCart } from 'lucide-react';
import { useBookingTracking } from '@/hooks/useBookingTracking';

interface BookingProgressTrackerProps {
  bookingId?: string;
  onStatusChange?: (status: string, progress: number) => void;
  className?: string;
}

const stepIcons = {
  search: Search,
  selection: ShoppingCart,
  review: FileCheck,
  payment: CreditCard,
  confirmation: Check
};

const stepLabels = {
  search: 'Finding Options',
  selection: 'Select & Customize',
  review: 'Review Details',
  payment: 'Payment Processing',
  confirmation: 'Booking Confirmed'
};

export const BookingProgressTracker = ({ 
  bookingId, 
  onStatusChange,
  className 
}: BookingProgressTrackerProps) => {
  const { 
    bookingState, 
    bookingSteps, 
    isCompleted, 
    hasError, 
    currentProgress 
  } = useBookingTracking(bookingId);

  // Notify parent of status changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(bookingState.status, currentProgress);
    }
  }, [bookingState.status, currentProgress, onStatusChange]);

  const getStepStatus = (stepName: string) => {
    const step = bookingSteps.find(s => s.step === stepName);
    return step?.status || 'pending';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'active':
        return 'bg-blue-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-muted';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Booking Progress</CardTitle>
          <Badge variant={hasError ? 'destructive' : isCompleted ? 'default' : 'secondary'}>
            {hasError ? 'Error' : isCompleted ? 'Complete' : 'In Progress'}
          </Badge>
        </div>
        <div className="space-y-2">
          <Progress value={currentProgress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {currentProgress}% complete • Current step: {stepLabels[bookingState.currentStep as keyof typeof stepLabels] || bookingState.currentStep}
          </p>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Booking Metadata */}
        {bookingState.metadata.bookingReference && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Booking Reference:</span>
              <span className="font-mono font-medium">{bookingState.metadata.bookingReference}</span>
            </div>
            {bookingState.metadata.totalAmount && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">
                  {bookingState.metadata.currency || 'AUD'} {bookingState.metadata.totalAmount}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step Progress */}
        <div className="space-y-3">
          {Object.entries(stepLabels).map(([stepKey, label], index) => {
            const status = getStepStatus(stepKey);
            const Icon = stepIcons[stepKey as keyof typeof stepIcons];
            const isActive = bookingState.currentStep === stepKey;
            const step = bookingSteps.find(s => s.step === stepKey);
            
            return (
              <div key={stepKey} className="flex items-center gap-3">
                {/* Step Number/Icon */}
                <div className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  status === 'completed' ? 'border-green-500 bg-green-500' :
                  status === 'active' ? 'border-blue-500 bg-blue-500' :
                  status === 'error' ? 'border-red-500 bg-red-500' :
                  'border-muted bg-background'
                }`}>
                  {status === 'completed' ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : status === 'active' ? (
                    <Icon className="h-4 w-4 text-white" />
                  ) : status === 'error' ? (
                    <AlertCircle className="h-4 w-4 text-white" />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Connection Line */}
                {index < Object.keys(stepLabels).length - 1 && (
                  <div className={`absolute left-4 top-8 w-0.5 h-6 ${getStatusColor(status)}`} />
                )}

                {/* Step Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium ${isActive ? 'text-primary' : status === 'completed' ? 'text-green-700' : ''}`}>
                      {label}
                    </h4>
                    {getStatusIcon(status)}
                  </div>
                  {step?.timestamp && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </p>
                  )}
                  {status === 'error' && step?.data?.error && (
                    <p className="text-xs text-red-600 mt-1">
                      {step.data.error}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Correlation ID for Support */}
        {bookingState.correlationId && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              Tracking ID: <span className="font-mono">{bookingState.correlationId}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};