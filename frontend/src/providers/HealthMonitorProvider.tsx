
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HealthStatus {
  api: 'healthy' | 'unhealthy' | 'checking';
  database: 'healthy' | 'unhealthy' | 'checking';
  apiError?: string | null;
  databaseError?: string | null;
  lastCheck: Date | null;
}

interface HealthMonitorContextType {
  status: HealthStatus;
  checkHealth: () => Promise<void>;
}

const HealthMonitorContext = createContext<HealthMonitorContextType | undefined>(undefined);

export const useHealthMonitor = () => {
  const context = useContext(HealthMonitorContext);
  if (!context) {
    throw new Error('useHealthMonitor must be used within a HealthMonitorProvider');
  }
  return context;
};

export const HealthMonitorProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<HealthStatus>({
    api: 'checking',
    database: 'checking',
    apiError: null,
    databaseError: null,
    lastCheck: null,
  });

  const checkHealth = async () => {
    // Reset to checking state before performing checks
    setStatus({
      api: 'checking',
      database: 'checking',
      apiError: null,
      databaseError: null,
      lastCheck: null,
    });

    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
      new Promise((resolve, reject) => {
        const id = setTimeout(() => reject(new Error('timeout')), ms);
        promise
          .then((value) => {
            clearTimeout(id);
            resolve(value);
          })
          .catch((err) => {
            clearTimeout(id);
            reject(err);
          });
      });

    const apiCheck = withTimeout(
      fetch('/api/health').then((res) => {
        if (!res.ok) {
          throw new Error(`API responded with status ${res.status}`);
        }
        return res.json();
      }),
      5000
    );

    const dbCheck = withTimeout(
      Promise.resolve(supabase.from('bookings').select('id').limit(1)),
      5000
    );

    const [apiResult, dbResult] = await Promise.allSettled([apiCheck, dbCheck]);

    let apiStatus: 'healthy' | 'unhealthy' = 'healthy';
    let databaseStatus: 'healthy' | 'unhealthy' = 'healthy';
    let apiError: string | null = null;
    let databaseError: string | null = null;

    if (apiResult.status === 'rejected') {
      apiStatus = 'unhealthy';
      apiError = apiResult.reason instanceof Error ? apiResult.reason.message : String(apiResult.reason);
    }

    if (dbResult.status === 'rejected') {
      databaseStatus = 'unhealthy';
      databaseError = dbResult.reason instanceof Error ? dbResult.reason.message : String(dbResult.reason);
    } else if (dbResult.status === 'fulfilled') {
      const result = dbResult.value as { error?: { message?: string } };
      if (result.error) {
        databaseStatus = 'unhealthy';
        databaseError = result.error.message ?? 'unknown error';
      }
    }

    setStatus({
      api: apiStatus,
      database: databaseStatus,
      apiError,
      databaseError,
      lastCheck: new Date(),
    });
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <HealthMonitorContext.Provider value={{ status, checkHealth }}>
      {children}
    </HealthMonitorContext.Provider>
  );
};
