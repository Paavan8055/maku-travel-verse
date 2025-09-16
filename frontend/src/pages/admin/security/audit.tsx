import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Eye, AlertTriangle, User, Clock, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const AdminAuditLogsPage = () => {
  const { data: auditData, isLoading, refetch } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const { data: systemLogs } = await supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: userActivity } = await supabase
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: bookingAccess } = await supabase
        .from('booking_access_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      return {
        systemLogs: systemLogs || [],
        userActivity: userActivity || [],
        bookingAccess: bookingAccess || []
      };
    },
    refetchInterval: 30000
  });

  const getLogLevelColor = (level: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (level.toLowerCase()) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      default: return 'outline';
    }
  };

  const getActivityTypeColor = (type: string) => {
    if (type.includes('admin')) return 'destructive';
    if (type.includes('login')) return 'default';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground">
            Comprehensive system and user activity monitoring
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Events</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditData?.systemLogs?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Recent system events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Activities</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditData?.userActivity?.length || 0}</div>
            <p className="text-xs text-muted-foreground">User interactions logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditData?.bookingAccess?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Booking access logs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList>
          <TabsTrigger value="system">System Logs</TabsTrigger>
          <TabsTrigger value="user">User Activity</TabsTrigger>
          <TabsTrigger value="access">Access Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Recent System Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditData?.systemLogs?.map((log) => (
                  <div key={log.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getLogLevelColor(log.log_level)}>
                          {log.log_level?.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{log.service_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {log.correlation_id || 'N/A'}
                        </span>
                      </div>
                      <p className="text-sm">{log.message}</p>
                      {log.error_details && (
                        <div className="mt-2 p-2 bg-destructive/10 rounded text-sm font-mono">
                          {JSON.stringify(log.error_details, null, 2)}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditData?.userActivity?.map((activity) => (
                  <div key={activity.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getActivityTypeColor(activity.activity_type)}>
                          {activity.activity_type?.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          User: {activity.user_id}
                        </span>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">{activity.item_type}</span>
                        {activity.item_id && `: ${activity.item_id}`}
                      </p>
                      {activity.item_data && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                          {JSON.stringify(activity.item_data, null, 2)}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(activity.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Booking Access Audit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditData?.bookingAccess?.map((access) => (
                  <div key={access.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={access.success ? 'default' : 'destructive'}>
                          {access.success ? 'SUCCESS' : 'FAILED'}
                        </Badge>
                        <span className="font-medium">{access.access_type}</span>
                        {access.access_method && (
                          <Badge variant="outline">{access.access_method}</Badge>
                        )}
                      </div>
                      <p className="text-sm">
                        Booking ID: <span className="font-mono">{access.booking_id}</span>
                      </p>
                      {access.failure_reason && (
                        <p className="text-sm text-destructive mt-1">
                          {access.failure_reason}
                        </p>
                      )}
                      {access.ip_address && (
                         <p className="text-xs text-muted-foreground mt-1">
                           IP: {access.ip_address?.toString() || 'N/A'}
                         </p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(access.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAuditLogsPage;