
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, User, Shield, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminAuditLogs() {
  const auditLogs = [
    {
      id: 1,
      action: 'User Login',
      user: 'admin@maku.travel',
      resource: 'Admin Dashboard',
      timestamp: '2025-01-28 14:30:12',
      ip: '192.168.1.100',
      status: 'success'
    },
    {
      id: 2,
      action: 'Booking Updated',
      user: 'support@maku.travel',
      resource: 'Booking #BK-2025-001',
      timestamp: '2025-01-28 14:25:45',
      ip: '192.168.1.105',
      status: 'success'
    },
    {
      id: 3,
      action: 'Permission Changed',
      user: 'admin@maku.travel',
      resource: 'User Role: Support',
      timestamp: '2025-01-28 14:20:33',
      ip: '192.168.1.100',
      status: 'success'
    },
    {
      id: 4,
      action: 'Failed Login Attempt',
      user: 'unknown@example.com',
      resource: 'Admin Dashboard',
      timestamp: '2025-01-28 14:15:22',
      ip: '203.45.67.89',
      status: 'failed'
    }
  ];

  const getActionIcon = (action: string) => {
    if (action.includes('Login')) return <User className="h-4 w-4" />;
    if (action.includes('Permission')) return <Shield className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getStatusBadge = (status: string) => {
    return status === 'success' 
      ? <Badge variant="default" className="bg-green-500">Success</Badge>
      : <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all security-related activities and changes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Security Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {getActionIcon(log.action)}
                  <div>
                    <div className="font-medium">{log.action}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.user} • {log.resource}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(log.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {log.timestamp} • {log.ip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
