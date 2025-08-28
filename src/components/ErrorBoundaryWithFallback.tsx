import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {getErrorMessage(error)}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Button onClick={resetErrorBoundary} className="w-full" variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => navigate('/')} className="w-full" variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
          
          {isSystemError(error) && (
            <p className="text-xs text-muted-foreground text-center">
              If the problem persists, please try again in a few minutes.
            </p>
          )}
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
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