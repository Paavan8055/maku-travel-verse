import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Loader2, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Enhanced Loading States with animations
export const AnimatedLoadingState = ({ 
  message = "Loading...", 
  progress,
  steps = [],
  currentStep = 0,
  className 
}: {
  message?: string;
  progress?: number;
  steps?: string[];
  currentStep?: number;
  className?: string;
}) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className={cn("flex flex-col items-center justify-center p-8 space-y-4", className)}
  >
    <div className="relative">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-12 w-12 text-primary" />
      </motion.div>
      
      {progress !== undefined && (
        <motion.div 
          className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
        >
          <div className="h-1 bg-primary rounded-full" />
        </motion.div>
      )}
    </div>
    
    <motion.p 
      className="text-muted-foreground text-center"
      key={message}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {message}
    </motion.p>
    
    {steps.length > 0 && (
      <div className="space-y-2 w-full max-w-sm">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            className={cn(
              "flex items-center space-x-2 p-2 rounded-md transition-colors",
              index === currentStep ? "bg-primary/10 text-primary" : 
              index < currentStep ? "text-green-600" : "text-muted-foreground"
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {index < currentStep ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : index === currentStep ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-muted" />
            )}
            <span className="text-sm">{step}</span>
          </motion.div>
        ))}
      </div>
    )}
  </motion.div>
);

// Enhanced Error State with retry mechanisms
export const EnhancedErrorState = ({
  title = "Something went wrong",
  message = "We're having trouble loading this content",
  error,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
  showDetails = false,
  className
}: {
  title?: string;
  message?: string;
  error?: Error;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
  showDetails?: boolean;
  className?: string;
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const { toast } = useToast();

  const handleRetry = useCallback(async () => {
    if (!onRetry || retryCount >= maxRetries) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
      toast({
        title: "Success",
        description: "Content loaded successfully",
        variant: "default"
      });
    } catch (err) {
      toast({
        title: "Retry failed",
        description: "Please try again in a moment",
        variant: "destructive"
      });
    } finally {
      setIsRetrying(false);
    }
  }, [onRetry, retryCount, maxRetries, toast]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("max-w-md mx-auto", className)}
    >
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          </motion.div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-muted-foreground">{message}</p>
          </div>
          
          {showDetails && error && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Technical details
              </summary>
              <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
          
          {onRetry && retryCount < maxRetries && (
            <div className="space-y-2">
              <Button 
                onClick={handleRetry} 
                disabled={isRetrying}
                className="w-full"
              >
                {isRetrying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  `Try Again ${retryCount > 0 ? `(${retryCount}/${maxRetries})` : ''}`
                )}
              </Button>
              
              {retryCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Attempted {retryCount} time{retryCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
          
          {retryCount >= maxRetries && (
            <div className="space-y-2">
              <p className="text-sm text-destructive">
                Maximum retry attempts reached
              </p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Network Status Indicator
export const NetworkStatusIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showStatus && isOnline) return null;

  return (
    <AnimatePresence>
      {(showStatus || !isOnline) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={cn(
            "fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg",
            isOnline ? "bg-green-600 text-white" : "bg-destructive text-destructive-foreground"
          )}
        >
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {isOnline ? "Back online" : "No internet connection"}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Smart Loading Skeleton
export const SmartSkeleton = ({ 
  type = 'text',
  lines = 1,
  avatar = false,
  className 
}: {
  type?: 'text' | 'card' | 'list' | 'form';
  lines?: number;
  avatar?: boolean;
  className?: string;
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="space-y-4">
            <div className="h-48 bg-muted rounded-lg animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse" />
              <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
            </div>
          </div>
        );
      
      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: lines }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                {avatar && <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />}
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'form':
        return (
          <div className="space-y-4">
            {Array.from({ length: lines }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
                <div className="h-10 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        );
      
      default:
        return (
          <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-4 bg-muted rounded animate-pulse",
                  i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
                )}
              />
            ))}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={className}
    >
      {renderSkeleton()}
    </motion.div>
  );
};

// Progress Indicator
export const ProgressIndicator = ({
  steps,
  currentStep,
  orientation = 'horizontal',
  showLabels = true,
  className
}: {
  steps: string[];
  currentStep: number;
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  className?: string;
}) => {
  return (
    <div className={cn(
      "flex",
      orientation === 'vertical' ? "flex-col space-y-4" : "items-center space-x-4",
      className
    )}>
      {steps.map((step, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center",
            orientation === 'vertical' ? "space-x-3" : "flex-col space-y-2"
          )}
        >
          <motion.div
            className={cn(
              "rounded-full border-2 flex items-center justify-center",
              "h-8 w-8 text-sm font-medium transition-colors",
              index < currentStep
                ? "bg-primary border-primary text-primary-foreground"
                : index === currentStep
                ? "border-primary text-primary"
                : "border-muted text-muted-foreground"
            )}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            {index < currentStep ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              index + 1
            )}
          </motion.div>
          
          {showLabels && (
            <motion.span
              className={cn(
                "text-sm",
                index <= currentStep ? "text-foreground" : "text-muted-foreground"
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              {step}
            </motion.span>
          )}
          
          {orientation === 'horizontal' && index < steps.length - 1 && (
            <div
              className={cn(
                "h-px w-12 transition-colors",
                index < currentStep ? "bg-primary" : "bg-muted"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// Toast notification types
export const showSuccessToast = (toast: any, title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "default",
    className: "border-green-200 bg-green-50 text-green-900"
  });
};

export const showErrorToast = (toast: any, title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "destructive"
  });
};

export const showInfoToast = (toast: any, title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "default",
    className: "border-blue-200 bg-blue-50 text-blue-900"
  });
};