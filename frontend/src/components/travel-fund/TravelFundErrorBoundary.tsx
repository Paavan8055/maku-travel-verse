import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class TravelFundErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Travel Fund Error Boundary caught an error:', error, errorInfo);
    
    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Could integrate with error tracking service here
      console.error('Production error in Travel Fund:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2 text-red-700">
              {this.props.componentName ? `${this.props.componentName} Error` : 'Something went wrong'}
            </h3>
            <p className="text-red-600 mb-4">
              We're having trouble loading this feature. Please try refreshing or contact support if the issue persists.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={this.handleRetry}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm text-red-600">
                    Developer Info (Dev Mode Only)
                  </summary>
                  <pre className="mt-2 p-2 bg-red-100 rounded text-xs text-red-800 overflow-auto max-h-32">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Simple fallback components for production safety
export const SafeFallbackCard = ({ title, description, actionText, onAction }: {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-6 text-center">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} className="bg-orange-500 hover:bg-orange-600 text-white">
          {actionText}
        </Button>
      )}
    </CardContent>
  </Card>
);

export default TravelFundErrorBoundary;