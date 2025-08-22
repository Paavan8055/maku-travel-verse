import { useEffect, ReactNode } from 'react';
import { usePerformanceOptimizer } from '@/hooks/usePerformanceOptimizer';

interface PerformanceWrapperProps {
  children: ReactNode;
  componentName: string;
  enableMonitoring?: boolean;
}

export const PerformanceWrapper = ({ 
  children, 
  componentName, 
  enableMonitoring = true 
}: PerformanceWrapperProps) => {
  const { startRender, endRender } = usePerformanceOptimizer({
    componentName,
    enableMonitoring,
    reportToAnalytics: true
  });

  useEffect(() => {
    startRender();
    return () => {
      endRender();
    };
  }, [startRender, endRender]);

  return <>{children}</>;
};