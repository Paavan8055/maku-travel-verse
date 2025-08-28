import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Search } from 'lucide-react';
import { correlationId, withCorrelationId } from '@/utils/correlationId';
import logger from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class SearchErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 2;

  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: correlationId.generateId()
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorData = withCorrelationId({
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      section: 'search',
      retryCount: this.retryCount,
      timestamp: new Date().toISOString()
    });

    logger.error('Search Error Boundary caught an error:', errorData);
    
    // Report to external monitoring if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          section: 'search',
          correlationId: errorData.correlationId
        },
        contexts: {
          react: errorInfo
        }
      });
    }

    this.setState({ error, errorId: errorData.correlationId });
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: undefined, errorId: undefined });
      logger.info('Search error boundary retry attempt', withCorrelationId({ 
        retryCount: this.retryCount 
      }));
    } else {
      window.location.reload();
    }
  };

  private handleReset = () => {
    this.retryCount = 0;
    this.setState({ hasError: false, error: undefined, errorId: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Search Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Something went wrong with your search</AlertTitle>
              <AlertDescription>
                {this.props.fallbackMessage || 
                  "We encountered an issue while processing your search. This could be due to temporary server issues or invalid search parameters."}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={this.handleRetry} className="flex-1">
                <RefreshCcw className="h-4 w-4 mr-2" />
                {this.retryCount < this.maxRetries ? 'Try Again' : 'Reload Page'}
              </Button>
              <Button variant="outline" onClick={this.handleReset} className="flex-1">
                <Search className="h-4 w-4 mr-2" />
                New Search
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>What you can try:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Check your search dates and destination</li>
                <li>Try a different destination or date range</li>
                <li>Refresh the page and search again</li>
                <li>Contact support if the problem persists</li>
              </ul>
              {this.state.errorId && (
                <p className="text-xs mt-2">
                  Error ID: <code className="bg-muted px-1 rounded">{this.state.errorId}</code>
                </p>
              )}
            </div>

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