import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { supabase } from '@/integrations/supabase/client';

interface AdminIntegrationState {
  currentTab: string;
  systemHealth: 'healthy' | 'warning' | 'critical';
  activeWorkflow: string | null;
  guidedMode: boolean;
  nonTechnicalMode: boolean;
}

interface AdminIntegrationContextType {
  state: AdminIntegrationState;
  navigateToTab: (tab: string) => void;
  startWorkflow: (workflow: string) => void;
  setGuidedMode: (enabled: boolean) => void;
  setNonTechnicalMode: (enabled: boolean) => void;
  getContextualHelp: () => string[];
  getQuickActions: () => Array<{
    label: string;
    action: () => void;
    icon: string;
    description: string;
  }>;
}

const AdminIntegrationContext = createContext<AdminIntegrationContextType | undefined>(undefined);

export const AdminIntegrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { metrics } = useAdminMetrics();
  const [state, setState] = useState<AdminIntegrationState>({
    currentTab: 'ai-assistant',
    systemHealth: 'healthy',
    activeWorkflow: null,
    guidedMode: false,
    nonTechnicalMode: true // Default to non-technical mode
  });

  useEffect(() => {
    const checkSystemHealth = async () => {
      try {
        const { data, error } = await supabase
          .from('critical_alerts')
          .select('severity')
          .eq('resolved', false)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;

        const criticalCount = data?.filter(alert => alert.severity === 'critical').length || 0;
        const warningCount = data?.filter(alert => alert.severity === 'warning').length || 0;

        let health: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (criticalCount > 0) health = 'critical';
        else if (warningCount > 0) health = 'warning';

        setState(prev => ({ ...prev, systemHealth: health }));
      } catch (error) {
        console.error('Error checking system health:', error);
        setState(prev => ({ ...prev, systemHealth: 'warning' }));
      }
    };

    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const navigateToTab = (tab: string) => {
    setState(prev => ({ ...prev, currentTab: tab }));
    // Trigger custom event for tab changes
    window.dispatchEvent(new CustomEvent('admin-tab-change', { detail: { tab } }));
  };

  const startWorkflow = (workflow: string) => {
    setState(prev => ({ ...prev, activeWorkflow: workflow }));
  };

  const setGuidedMode = (enabled: boolean) => {
    setState(prev => ({ ...prev, guidedMode: enabled }));
  };

  const setNonTechnicalMode = (enabled: boolean) => {
    setState(prev => ({ ...prev, nonTechnicalMode: enabled }));
  };

  const getContextualHelp = (): string[] => {
    const help = [];
    
    switch (state.currentTab) {
      case 'users':
        help.push('User management: View, edit, and manage user accounts');
        help.push('Reset passwords, update roles, and handle account issues');
        break;
      case 'bookings':
        help.push('Booking management: Track and resolve booking issues');
        help.push('Process refunds, modify bookings, and communicate with customers');
        break;
      case 'security':
        help.push('Security monitoring: Review security alerts and compliance');
        help.push('Manage access controls and monitor suspicious activity');
        break;
      case 'realtime':
        help.push('Real-time metrics: Monitor live system performance');
        help.push('Track booking rates, payment success, and system load');
        break;
      default:
        help.push('Use the AI Assistant for step-by-step guidance');
        help.push('Navigate to different tabs to manage specific areas');
    }

    if (state.systemHealth === 'critical') {
      help.unshift('⚠️ CRITICAL: System issues detected - check System Recovery tab');
    } else if (state.systemHealth === 'warning') {
      help.unshift('⚠️ WARNING: Minor issues detected - monitor system health');
    }

    return help;
  };

  const getQuickActions = () => {
    const actions = [];

    // Context-aware quick actions based on current tab
    switch (state.currentTab) {
      case 'users':
        actions.push({
          label: 'Reset User Password',
          action: () => startWorkflow('reset-password'),
          icon: 'key',
          description: 'Help a user reset their password'
        });
        actions.push({
          label: 'Create New Admin',
          action: () => startWorkflow('create-admin'),
          icon: 'user-plus',
          description: 'Add a new administrator account'
        });
        break;
      case 'bookings':
        actions.push({
          label: 'Process Refund',
          action: () => startWorkflow('process-refund'),
          icon: 'credit-card',
          description: 'Issue a refund for a booking'
        });
        actions.push({
          label: 'Modify Booking',
          action: () => startWorkflow('modify-booking'),
          icon: 'edit',
          description: 'Help modify an existing booking'
        });
        break;
      case 'security':
        actions.push({
          label: 'Review Security Alerts',
          action: () => startWorkflow('security-review'),
          icon: 'shield',
          description: 'Check and resolve security alerts'
        });
        break;
    }

    // System health quick actions
    if (state.systemHealth === 'critical') {
      actions.unshift({
        label: 'Emergency Recovery',
        action: () => navigateToTab('recovery'),
        icon: 'alert-triangle',
        description: 'Start emergency system recovery'
      });
    }

    // Always available actions
    actions.push({
      label: 'System Health Check',
      action: () => navigateToTab('monitoring'),
      icon: 'activity',
      description: 'View detailed system health metrics'
    });

    return actions;
  };

  return (
    <AdminIntegrationContext.Provider value={{
      state,
      navigateToTab,
      startWorkflow,
      setGuidedMode,
      setNonTechnicalMode,
      getContextualHelp,
      getQuickActions
    }}>
      {children}
    </AdminIntegrationContext.Provider>
  );
};

export const useAdminIntegration = () => {
  const context = useContext(AdminIntegrationContext);
  if (!context) {
    throw new Error('useAdminIntegration must be used within AdminIntegrationProvider');
  }
  return context;
};