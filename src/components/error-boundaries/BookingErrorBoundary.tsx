import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, ArrowLeft, CreditCard } from 'lucide-react';
import { correlationId, withCorrelationId } from '@/utils/correlationId';
import logger from '@/utils/logger';

interface Props {
  children: ReactNode;
  onReturnToSearch?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
  isPaymentError?: boolean;
}

export class BookingErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    const isPaymentError = error.message.toLowerCase().includes('payment') || 
                          error.message.toLowerCase().includes('stripe') ||
                          error.message.toLowerCase().includes('card');
    
    return { 
      hasError: true, 
      error,
      errorId: correlationId.generateId(),
      isPaymentError
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorData = withCorrelationId({
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      section: 'booking',
      isPaymentError: this.state.isPaymentError,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });

    logger.error('Booking Error Boundary caught an error:', errorData);
    
    // High priority for booking/payment errors
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        level: this.state.isPaymentError ? 'error' : 'warning',
        tags: {
          section: 'booking',
          correlationId: errorData.correlationId,
          isPaymentError: this.state.isPaymentError
        },
        contexts: {
          react: errorInfo
        }
      });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  private handleReturnToSearch = () => {
    if (this.props.onReturnToSearch) {
      this.props.onReturnToSearch();
    } else {
      window.history.back();
    }
  };

  public render() {
    if (this.state.hasError) {
      const isPaymentError = this.state.isPaymentError;

      return (
        <Card className="border-destructive max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              {isPaymentError ? <CreditCard className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              {isPaymentError ? 'Payment Processing Error' : 'Booking Error'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {isPaymentError ? 'Payment could not be processed' : 'Booking could not be completed'}
              </AlertTitle>
              <AlertDescription>
                {isPaymentError ? (
                  "There was an issue processing your payment. Your card has not been charged. Please check your payment details and try again."
                ) : (
                  "We encountered an issue while processing your booking. Don't worry - if any payment was attempted, it will be automatically reversed."
                )}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button variant="outline" onClick={this.handleReturnToSearch} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Search
              </Button>
            </div>

            {/* Payment-specific help */}
            {isPaymentError && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Payment Troubleshooting</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Verify your card details are correct</li>
                  <li>Check that your card has sufficient funds</li>
                  <li>Ensure your card allows international transactions</li>
                  <li>Try a different payment method</li>
                  <li>Contact your bank if issues persist</li>
                </ul>
              </div>
            )}

            {/* General booking help */}
            {!isPaymentError && (
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Common causes:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>The selected room or flight is no longer available</li>
                  <li>Temporary connectivity issues</li>
                  <li>Booking session expired</li>
                  <li>Invalid guest or passenger information</li>
                </ul>
              </div>
            )}

            {this.state.errorId && (
              <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
                <p>Reference ID: <code>{this.state.errorId}</code></p>
                <p>Please provide this ID when contacting support.</p>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 p-4 bg-muted rounded text-sm">
                <summary className="cursor-pointer font-medium">Developer Details</summary>
                <pre className="mt-2 whitespace-pre-wrap text-xs">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}