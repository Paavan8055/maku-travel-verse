import React, { createContext, useContext, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import secureLogger from '@/utils/secureLogger';

interface SecurityAuditContextType {
  logAccessAttempt: (resource: string, action: string, success: boolean, metadata?: any) => void;
  logSensitiveDataAccess: (dataType: string, context: string) => void;
  logSecurityEvent: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any) => void;
}

const SecurityAuditContext = createContext<SecurityAuditContextType | undefined>(undefined);

export const useSecurityAudit = () => {
  const context = useContext(SecurityAuditContext);
  if (!context) {
    throw new Error('useSecurityAudit must be used within a SecurityAuditProvider');
  }
  return context;
};

interface SecurityAuditProviderProps {
  children: React.ReactNode;
}

export const SecurityAuditProvider: React.FC<SecurityAuditProviderProps> = ({ children }) => {
  const { user } = useAuth();

  const logAccessAttempt = async (resource: string, action: string, success: boolean, metadata?: any) => {
    try {
      await supabase.from('user_activity_logs').insert({
        user_id: user?.id || null,
        activity_type: 'access_attempt',
        item_type: resource,
        item_id: action,
        item_data: {
          success,
          timestamp: new Date().toISOString(),
          metadata: metadata || {}
        }
      });

      secureLogger.securityEvent(`Access attempt: ${resource}:${action}`, success ? 'low' : 'medium', {
        resource,
        action,
        success,
        userId: user?.id || 'anonymous'
      });
    } catch (error) {
      secureLogger.error('Failed to log access attempt', error);
    }
  };

  const logSensitiveDataAccess = async (dataType: string, context: string) => {
    try {
      await supabase.from('user_activity_logs').insert({
        user_id: user?.id || null,
        activity_type: 'sensitive_data_access',
        item_type: dataType,
        item_id: context,
        item_data: {
          timestamp: new Date().toISOString(),
          context
        }
      });

      secureLogger.securityEvent(`Sensitive data access: ${dataType}`, 'medium', {
        dataType,
        context,
        userId: user?.id || 'anonymous'
      });
    } catch (error) {
      secureLogger.error('Failed to log sensitive data access', error);
    }
  };

  const logSecurityEvent = async (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: any) => {
    try {
      // Log critical events to critical_alerts table
      if (severity === 'critical') {
        await supabase.from('critical_alerts').insert({
          alert_type: 'security_event',
          severity,
          message: event,
          metadata: {
            details: details || {},
            timestamp: new Date().toISOString(),
            userId: user?.id || 'anonymous'
          }
        });
      }

      await supabase.from('user_activity_logs').insert({
        user_id: user?.id || null,
        activity_type: 'security_event',
        item_type: event,
        item_id: severity,
        item_data: {
          severity,
          details: details || {},
          timestamp: new Date().toISOString()
        }
      });

      secureLogger.securityEvent(event, severity, details);
    } catch (error) {
      secureLogger.error('Failed to log security event', error);
    }
  };

  // Monitor for potential security issues
  useEffect(() => {
    const monitorConsole = () => {
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;

      console.log = (...args: any[]) => {
        // Check for sensitive data in console logs
        const message = args.join(' ');
        if (message.includes('sk_') || message.includes('Bearer ') || message.includes('password')) {
          logSecurityEvent('Sensitive data in console log', 'high', { 
            message: '[REDACTED - Sensitive data detected]'
          });
        }
        originalLog.apply(console, args);
      };

      console.warn = (...args: any[]) => {
        originalWarn.apply(console, args);
      };

      console.error = (...args: any[]) => {
        originalError.apply(console, args);
      };

      // Cleanup function to restore original console methods
      return () => {
        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalError;
      };
    };

    const cleanup = monitorConsole();
    return cleanup;
  }, []);

  const value: SecurityAuditContextType = {
    logAccessAttempt,
    logSensitiveDataAccess,
    logSecurityEvent
  };

  return (
    <SecurityAuditContext.Provider value={value}>
      {children}
    </SecurityAuditContext.Provider>
  );
};