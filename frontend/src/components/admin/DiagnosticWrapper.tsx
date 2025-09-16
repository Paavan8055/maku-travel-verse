import React, { Suspense } from 'react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DiagnosticWrapperProps {
  componentName: string;
  children: React.ReactNode;
}

const LoadingFallback = ({ componentName }: { componentName: string }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading {componentName}...
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground">Loading component...</p>
    </CardContent>
  </Card>
);

const ErrorFallback = ({ componentName, error, resetErrorBoundary }: { 
  componentName: string; 
  error: Error;
  resetErrorBoundary: () => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-4 w-4" />
        Error in {componentName}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Component: {componentName}
      </p>
      <p className="text-sm text-muted-foreground">
        Error: {error.message}
      </p>
      <div className="space-y-2">
        <Button onClick={resetErrorBoundary} variant="outline" size="sm">
          Retry Component
        </Button>
      </div>
    </CardContent>
  </Card>
);

export const DiagnosticWrapper: React.FC<DiagnosticWrapperProps> = ({ 
  componentName, 
  children 
}) => {
  console.log(`DiagnosticWrapper: Rendering ${componentName}`);
  
  return (
    <ErrorBoundary
      fallback={
        <ErrorFallback 
          componentName={componentName}
          error={new Error("Component failed to render")}
          resetErrorBoundary={() => window.location.reload()}
        />
      }
      onError={(error) => {
        console.error(`DiagnosticWrapper: Error in ${componentName}:`, error);
      }}
    >
      <Suspense fallback={<LoadingFallback componentName={componentName} />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};