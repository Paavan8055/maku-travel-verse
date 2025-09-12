import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Globe,
  Shield,
  DollarSign,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProviderPerformanceMonitor } from './ProviderPerformanceMonitor';

interface DiscoveryStats {
  total_discoveries: number;
  pending_approval: number;
  auto_approved: number;
  verification_rate: number;
  avg_confidence: number;
}

interface RecentDiscovery {
  id: string;
  discovered_provider_name: string;
  discovery_method: string;
  verification_status: string;
  discovery_metadata: any;
  created_at: string;
}

export const ProviderDiscoveryDashboard: React.FC = () => {
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [recentDiscoveries, setRecentDiscoveries] = useState<RecentDiscovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
    
    // Set up real-time updates
    const channel = supabase
      .channel('discovery-dashboard')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'provider_discovery_log'
      }, () => {
        loadDashboardData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pending_providers'
      }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDiscoveryStats(),
        loadRecentDiscoveries()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load provider discovery data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDiscoveryStats = async () => {
    // Get discovery statistics
    const { data: discoveries, error: discError } = await supabase
      .from('provider_discovery_log')
      .select('verification_status, discovery_metadata');

    if (discError) throw discError;

    const { data: pending, error: pendError } = await supabase
      .from('pending_providers')
      .select('approval_status');

    if (pendError) throw pendError;

    const totalDiscoveries = discoveries?.length || 0;
    const pendingApproval = pending?.filter(p => p.approval_status === 'pending').length || 0;
    const autoApproved = pending?.filter(p => p.approval_status === 'approved').length || 0;
    const verified = discoveries?.filter(d => d.verification_status === 'verified').length || 0;
    
    const avgConfidence = discoveries?.length > 0
      ? discoveries.reduce((sum, d) => {
          const metadata = typeof d.discovery_metadata === 'object' && d.discovery_metadata ? d.discovery_metadata as any : {};
          return sum + (metadata.confidence_score || 0);
        }, 0) / discoveries.length
      : 0;

    setStats({
      total_discoveries: totalDiscoveries,
      pending_approval: pendingApproval,
      auto_approved: autoApproved,
      verification_rate: totalDiscoveries > 0 ? (verified / totalDiscoveries) * 100 : 0,
      avg_confidence: avgConfidence * 100
    });
  };

  const loadRecentDiscoveries = async () => {
    const { data, error } = await supabase
      .from('provider_discovery_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    setRecentDiscoveries(data || []);
  };

  const triggerDiscovery = async () => {
    setDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke('provider-discovery-engine', {
        body: { method: 'all', provider_type: 'all' }
      });

      if (error) throw error;

      toast({
        title: "Discovery Started",
        description: `Scanning for new providers across all marketplaces`,
        variant: "default"
      });

      // Refresh data after discovery
      setTimeout(() => loadDashboardData(), 2000);
    } catch (error) {
      console.error('Discovery failed:', error);
      toast({
        title: "Discovery Failed",
        description: "Failed to start provider discovery",
        variant: "destructive"
      });
    } finally {
      setDiscovering(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMethodBadge = (method: string) => {
    const colors = {
      marketplace_scan: 'bg-blue-100 text-blue-800',
      endpoint_scan: 'bg-green-100 text-green-800',
      webhook: 'bg-purple-100 text-purple-800',
      manual: 'bg-gray-100 text-gray-800'
    };
    return colors[method] || colors.manual;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">Loading provider discovery dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Provider Discovery</h2>
          <p className="text-muted-foreground">
            Automated provider detection and integration pipeline
          </p>
        </div>
        <Button onClick={triggerDiscovery} disabled={discovering}>
          <Search className="h-4 w-4 mr-2" />
          {discovering ? 'Discovering...' : 'Start Discovery'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Total Discoveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_discoveries || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.pending_approval || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Auto-Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.auto_approved || 0}</div>
            <p className="text-xs text-muted-foreground">Automatically approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Verification Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats?.verification_rate || 0)}%</div>
            <p className="text-xs text-muted-foreground">Success rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats?.avg_confidence || 0)}%</div>
            <p className="text-xs text-muted-foreground">Discovery confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Discoveries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Discoveries</CardTitle>
          <CardDescription>
            Latest provider discoveries and their verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentDiscoveries.map((discovery) => (
              <div key={discovery.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  {getStatusIcon(discovery.verification_status)}
                  <div className="flex-1">
                    <p className="font-medium">{discovery.discovered_provider_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(discovery.created_at).toLocaleDateString()} • 
                      Confidence: {Math.round(((typeof discovery.discovery_metadata === 'object' && discovery.discovery_metadata ? (discovery.discovery_metadata as any).confidence_score : 0) || 0) * 100)}%
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getMethodBadge(discovery.discovery_method)}>
                    {discovery.discovery_method.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline">{discovery.verification_status}</Badge>
                </div>
              </div>
            ))}
            {recentDiscoveries.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No discoveries yet. Click "Start Discovery" to begin scanning.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Provider Performance Monitor */}
      <ProviderPerformanceMonitor />
    </div>
  );
};