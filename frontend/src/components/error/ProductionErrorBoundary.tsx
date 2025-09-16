import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { secureLogger } from '@/utils/secureLogger';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableRetry?: boolean;
  retryLimit?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  retryCount: number;
}

export class ProductionErrorBoundary extends Component<Props, State> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: crypto.randomUUID()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    const { errorId } = this.state;

    // Log error securely
    secureLogger.error('Production error caught by boundary', error, {
      component: 'ProductionErrorBoundary',
      errorId,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount
    });

    // Report to monitoring service
    this.reportToMonitoring(error, errorInfo, errorId);

    // Call custom error handler
    onError?.(error, errorInfo);
  }

  componentWillUnmount() {
    // Cleanup any pending retry timeouts
    this.retryTimeouts.forEach(timeout => clearTimeout(timeout));
  }

  private reportToMonitoring = (error: Error, errorInfo: ErrorInfo, errorId: string) => {
    // In production, this would integrate with monitoring services
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_map: {
          error_id: errorId,
          component_stack: errorInfo.componentStack
        }
      });
    }
  };

  private handleRetry = () => {
    const { retryLimit = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= retryLimit) {
      secureLogger.warn('Maximum retry attempts reached', {
        component: 'ProductionErrorBoundary',
        errorId: this.state.errorId,
        retryCount
      });
      return;
    }

    secureLogger.info('Retrying after error', {
      component: 'ProductionErrorBoundary',
      errorId: this.state.errorId,
      retryCount: retryCount + 1
    });

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.pow(2, retryCount) * 1000;
    
    const timeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorId: '',
        retryCount: retryCount + 1
      });
    }, delay);

    this.retryTimeouts.push(timeout);
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getSeverityLevel = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) return 'medium';
    if (message.includes('authentication') || message.includes('unauthorized')) return 'high';
    if (message.includes('payment') || message.includes('booking')) return 'critical';
    
    return 'low';
  };

  private getErrorCategory = (error: Error): string => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) return 'Network Error';
    if (message.includes('payment')) return 'Payment Error';
    if (message.includes('booking')) return 'Booking Error';
    if (message.includes('authentication')) return 'Authentication Error';
    
    return 'Application Error';
  };

  render() {
    const { hasError, error, errorId, retryCount } = this.state;
    const { children, fallbackComponent, enableRetry = true, retryLimit = 3 } = this.props;

    if (hasError && error) {
      if (fallbackComponent) {
        return fallbackComponent;
      }

      const severity = this.getSeverityLevel(error);
      const category = this.getErrorCategory(error);
      const canRetry = enableRetry && retryCount < retryLimit;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-red-900">
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">
                  Something went wrong while loading this section.
                </p>
                {severity === 'critical' && (
                  <p className="text-sm text-red-600 font-medium">
                    This appears to be a critical issue. Our team has been notified.
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Error ID: {errorId.slice(0, 8)}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    variant="default"
                    className="w-full"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again {retryCount > 0 && `(${retryCount}/${retryLimit})`}
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="w-full"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Go to Homepage
                </Button>
              </div>

              {!canRetry && retryCount >= retryLimit && (
                <div className="text-center p-3 bg-yellow-50 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Maximum retry attempts reached. Please refresh the page or contact support.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return children;
  }
}

export default ProductionErrorBoundary;