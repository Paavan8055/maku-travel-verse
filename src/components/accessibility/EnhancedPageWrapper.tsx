import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AccessibilityFeaturesProps {
  className?: string;
}

export const AccessibilityFeatures = ({ className }: AccessibilityFeaturesProps) => {
  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      <Card className="w-64 shadow-lg border">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Accessibility Options</h3>
          <div className="space-y-2">
            <button 
              className="w-full text-left text-xs p-2 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => document.documentElement.classList.toggle('high-contrast')}
              aria-label="Toggle high contrast mode"
            >
              🔆 High Contrast
            </button>
            <button 
              className="w-full text-left text-xs p-2 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => document.documentElement.classList.toggle('large-text')}
              aria-label="Toggle large text mode"
            >
              🔍 Large Text
            </button>
            <button 
              className="w-full text-left text-xs p-2 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => document.documentElement.classList.toggle('reduce-motion')}
              aria-label="Toggle reduced motion"
            >
              ⏸️ Reduce Motion
            </button>
            <button 
              className="w-full text-left text-xs p-2 rounded hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => {
                const main = document.querySelector('main') || document.querySelector('[role="main"]');
                if (main) (main as HTMLElement).focus();
              }}
              aria-label="Skip to main content"
            >
              ⏭️ Skip to Content
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Page Wrapper with accessibility and performance
interface EnhancedPageWrapperProps {
  children: React.ReactNode;
  pageName: string;
  className?: string;
}

export const EnhancedPageWrapper = ({ 
  children, 
  pageName, 
  className 
}: EnhancedPageWrapperProps) => {
  return (
    <ErrorBoundary>
      <div className={cn("min-h-screen bg-background", className)}>
        {/* Skip Links */}
        <a 
          href="#main-content" 
          className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
        >
          Skip to main content
        </a>
        
        {/* Main Content */}
        <main id="main-content" role="main" aria-label={`${pageName} page`}>
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <LoadingSpinner size="lg" text={`Loading ${pageName}...`} />
            </div>
          }>
            {children}
          </Suspense>
        </main>
        
        {/* Accessibility Features Panel */}
        <AccessibilityFeatures />
      </div>
    </ErrorBoundary>
  );
};