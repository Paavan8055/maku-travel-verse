import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { EnhancedSearch } from '@/components/ui/enhanced-search';
import { ResponsiveDataTable } from '@/components/ui/responsive-data-table';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Bell,
  Settings,
  Eye,
  Check,
  X
} from 'lucide-react';

interface CriticalAlert {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
  resolved: boolean | null;
  resolved_at: string | null;
  resolved_by: string | null;
  requires_manual_action: boolean | null;
  booking_id: string | null;
}

export const EnhancedCriticalAlertDashboard = () => {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<CriticalAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();
    setupRealtimeSubscription();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('critical_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAlerts(data || []);
      setFilteredAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch critical alerts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('critical_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'critical_alerts'
        },
        (payload) => {
          console.log('Alert change:', payload);
          fetchAlerts(); // Refresh data on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const resolveAlert = async (alertId: string) => {
    setResolving(prev => new Set(prev).add(alertId));
    
    try {
      const { error } = await supabase.functions.invoke('critical-alert-system', {
        body: {
          action: 'resolve_alert',
          alert_id: alertId
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Alert resolved successfully"
      });

      fetchAlerts();
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error",
        description: "Failed to resolve alert",
        variant: "destructive"
      });
    } finally {
      setResolving(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Bell className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStats = () => {
    const unresolved = alerts.filter(a => !a.resolved);
    const critical = unresolved.filter(a => a.severity === 'critical');
    const requiresAction = unresolved.filter(a => a.requires_manual_action);
    
    return {
      total: alerts.length,
      unresolved: unresolved.length,
      critical: critical.length,
      requiresAction: requiresAction.length
    };
  };

  const stats = getStats();

  const searchFields = ['alert_type', 'message', 'severity'];
  const filterOptions = [
    {
      key: 'severity',
      label: 'Severity',
      type: 'select' as const,
      options: [
        { value: 'critical', label: 'Critical' },
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' }
      ]
    },
    {
      key: 'alert_type',
      label: 'Alert Type',
      type: 'text' as const
    },
    {
      key: 'resolved',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'false', label: 'Unresolved' },
        { value: 'true', label: 'Resolved' }
      ]
    }
  ];

  const sortOptions = [
    { key: 'created_at', label: 'Created Date (Newest)', direction: 'desc' as const },
    { key: 'created_at', label: 'Created Date (Oldest)', direction: 'asc' as const },
    { key: 'severity', label: 'Severity', direction: 'desc' as const }
  ];

  const alertColumns = [
    {
      key: 'severity',
      header: 'Severity',
      cell: (value: string) => (
        <div className="flex items-center gap-2">
          {getSeverityIcon(value)}
          <Badge variant={getSeverityColor(value) as any}>
            {value.toUpperCase()}
          </Badge>
        </div>
      )
    },
    {
      key: 'alert_type',
      header: 'Type',
      cell: (value: string) => (
        <span className="font-medium capitalize">{value.replace(/_/g, ' ')}</span>
      )
    },
    {
      key: 'message',
      header: 'Message',
      cell: (value: string) => (
        <span className="text-sm line-clamp-2">{value}</span>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      cell: (value: string) => (
        <span className="text-sm text-muted-foreground">
          {new Date(value).toLocaleString()}
        </span>
      ),
      hiddenOnMobile: true
    },
    {
      key: 'resolved',
      header: 'Status',
      cell: (value: boolean | null, row: CriticalAlert) => (
        <div className="flex items-center gap-2">
          {value ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-500">Resolved</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-500">Active</span>
            </>
          )}
          {row.requires_manual_action && (
            <Badge variant="outline" className="text-xs">
              Action Required
            </Badge>
          )}
        </div>
      ),
      hiddenOnMobile: true
    }
  ];

  const alertActions = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: (alert: CriticalAlert) => {
        // TODO: Open alert details modal
        console.log('View alert:', alert);
      }
    },
    {
      label: 'Resolve',
      icon: <Check className="h-4 w-4" />,
      onClick: (alert: CriticalAlert) => resolveAlert(alert.id),
      hidden: (alert: CriticalAlert) => !!alert.resolved
    }
  ];

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-orange-500">{stats.unresolved}</p>
                <p className="text-xs text-muted-foreground">Unresolved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">{stats.critical}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-500">{stats.requiresAction}</p>
                <p className="text-xs text-muted-foreground">Need Action</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Critical Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EnhancedSearch
            data={alerts}
            onFilteredData={setFilteredAlerts}
            searchFields={searchFields}
            filterOptions={filterOptions}
            sortOptions={sortOptions}
            placeholder="Search alerts by type, message, or severity..."
          />

          <ResponsiveDataTable
            data={filteredAlerts}
            columns={alertColumns}
            actions={alertActions}
            loading={loading}
            emptyMessage="No critical alerts found"
            pageSize={20}
          />
        </CardContent>
      </Card>

      {/* Critical Alerts Summary */}
      {stats.critical > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {stats.critical} critical alert{stats.critical !== 1 ? 's' : ''} that require immediate attention.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};