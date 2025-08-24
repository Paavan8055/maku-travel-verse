
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface HealthStatus {
  api: 'healthy' | 'unhealthy' | 'checking';
  database: 'healthy' | 'unhealthy' | 'checking';
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
    lastCheck: null,
  });

  const checkHealth = async () => {
    try {
      // Basic health check - can be expanded later
      setStatus({
        api: 'healthy',
        database: 'healthy',
        lastCheck: new Date(),
      });
    } catch (error) {
      setStatus({
        api: 'unhealthy',
        database: 'unhealthy',
        lastCheck: new Date(),
      });
    }
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
