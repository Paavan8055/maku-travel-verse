import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const LoadingState = ({ message = "Loading...", className }: LoadingStateProps) => (
  <div className={`flex items-center justify-center p-8 ${className}`}>
    <Loader2 className="h-8 w-8 animate-spin mr-3" />
    <span className="text-muted-foreground">{message}</span>
  </div>
);

export const LoadingSpinner = ({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]}`} />
    </div>
  );
};

export const ErrorState = ({ 
  title = "Something went wrong", 
  message = "Please try again or contact support if the issue persists",
  onRetry,
  className 
}: ErrorStateProps) => (
  <Card className={`mx-auto max-w-md ${className}`}>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-5 w-5" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-muted-foreground">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </CardContent>
  </Card>
);

export const SearchLoadingState = () => (
  <LoadingState message="Searching for hotels..." className="min-h-[200px]" />
);

export const BookingLoadingState = () => (
  <LoadingState message="Processing your booking..." className="min-h-[200px]" />
);

export const PaymentLoadingState = () => (
  <LoadingState message="Processing payment..." className="min-h-[200px]" />
);