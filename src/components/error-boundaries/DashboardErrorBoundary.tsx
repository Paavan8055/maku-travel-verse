import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCcw, Home, Settings } from 'lucide-react';
import { correlationId, withCorrelationId } from '@/utils/correlationId';
import logger from '@/utils/logger';

interface Props {
  children: ReactNode;
  section?: 'dashboard' | 'admin' | 'profile' | 'settings';
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId?: string;
}

export class DashboardErrorBoundary extends Component<Props, State> {
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
    const section = this.props.section || 'dashboard';
    const errorData = withCorrelationId({
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      section,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });

    logger.error(`${section} Error Boundary caught an error:`, errorData);
    
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          section,
          correlationId: errorData.correlationId
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

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getSectionTitle = () => {
    switch (this.props.section) {
      case 'admin': return 'Admin Dashboard Error';
      case 'profile': return 'Profile Error';
      case 'settings': return 'Settings Error';
      default: return 'Dashboard Error';
    }
  };

  private getSectionDescription = () => {
    switch (this.props.section) {
      case 'admin': 
        return 'There was an issue loading the admin dashboard. This could be due to permission issues or data loading problems.';
      case 'profile': 
        return 'We encountered an issue loading your profile information. Your data is safe and this is likely a temporary issue.';
      case 'settings': 
        return 'There was a problem loading the settings page. Your current settings are preserved.';
      default: 
        return 'We encountered an issue loading your dashboard. Your bookings and data are safe.';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background p-6">
          <div className="max-w-2xl mx-auto">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  {this.getSectionTitle()}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Something went wrong</AlertTitle>
                  <AlertDescription>
                    {this.getSectionDescription()}
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={this.handleRetry} className="w-full">
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                </div>

                {/* Section-specific help */}
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>What you can try:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {this.props.section === 'admin' && (
                      <>
                        <li>Verify you have admin permissions</li>
                        <li>Check if all required services are running</li>
                      </>
                    )}
                    {this.props.section === 'profile' && (
                      <>
                        <li>Refresh the page to reload your profile</li>
                        <li>Check your internet connection</li>
                      </>
                    )}
                    <li>Clear browser cache and cookies</li>
                    <li>Try again in a few minutes</li>
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
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}