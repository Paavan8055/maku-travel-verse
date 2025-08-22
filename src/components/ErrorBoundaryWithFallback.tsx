import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  context?: string;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetErrorBoundary, 
  context = 'application' 
}) => {
  const getErrorMessage = (error: Error) => {
    // Provide user-friendly error messages based on error types
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      return 'Connection error. Please check your internet connection and try again.';
    }
    
    if (error.message.includes('AMADEUS_AUTH_INVALID_CREDENTIALS')) {
      return 'Service temporarily unavailable. Our team has been notified and is working on a fix.';
    }
    
    if (error.message.includes('Circuit breaker')) {
      return 'Service is temporarily overloaded. Please try again in a few minutes.';
    }
    
    if (error.message.includes('Missing required parameters')) {
      return 'Please fill in all required fields and try again.';
    }
    
    // Default user-friendly message
    return `Something went wrong with the ${context}. Please try again.`;
  };

  const isSystemError = (error: Error) => {
    return error.message.includes('AMADEUS_AUTH_INVALID_CREDENTIALS') ||
           error.message.includes('Circuit breaker') ||
           error.message.includes('Service unavailable');
  };

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {getErrorMessage(error)}
          </AlertDescription>
        </Alert>
        
        <div className="space-y-3">
          <Button 
            onClick={resetErrorBoundary}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          
          {isSystemError(error) && (
            <p className="text-xs text-muted-foreground text-center">
              If the problem persists, please try again in a few minutes.
            </p>
          )}
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer">
                Technical Details (Development)
              </summary>
              <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

interface ErrorBoundaryWithFallbackProps {
  children: React.ReactNode;
  context?: string;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundaryWithFallback extends React.Component<
  ErrorBoundaryWithFallbackProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryWithFallbackProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || ErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
          context={this.props.context}
        />
      );
    }

    return this.props.children;
  }
}