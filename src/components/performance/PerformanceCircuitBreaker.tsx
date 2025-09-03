import { useEffect, useState, ReactNode } from 'react';

interface PerformanceCircuitBreakerProps {
  children: ReactNode;
  memoryThreshold?: number;
  onCircuitOpen?: () => void;
}

export const PerformanceCircuitBreaker = ({ 
  children, 
  memoryThreshold = 85,
  onCircuitOpen 
}: PerformanceCircuitBreakerProps) => {
  const [isCircuitOpen, setIsCircuitOpen] = useState(false);

  useEffect(() => {
    const checkMemory = () => {
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = Math.round((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100);
        
        if (memoryUsage > memoryThreshold && !isCircuitOpen) {
          console.error(`CIRCUIT BREAKER: Memory usage ${memoryUsage}% exceeds threshold ${memoryThreshold}%`);
          setIsCircuitOpen(true);
          onCircuitOpen?.();
          
          // Force garbage collection if available
          if (typeof window !== 'undefined' && (window as any).gc) {
            (window as any).gc();
          }
        }
      }
    };

    // Check immediately
    checkMemory();
    
    // Only check every 30 seconds to minimize overhead
    const interval = setInterval(checkMemory, 30000);
    
    return () => clearInterval(interval);
  }, [memoryThreshold, isCircuitOpen, onCircuitOpen]);

  if (isCircuitOpen) {
    return (
      <div className="p-4 bg-warning/10 border border-warning rounded-lg">
        <p className="text-sm text-warning-foreground">
          Performance monitoring temporarily disabled due to high memory usage.
        </p>
        {children}
      </div>
    );
  }

  return <>{children}</>;
};