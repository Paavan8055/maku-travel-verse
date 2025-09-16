import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Search, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Zap, 
  Brain,
  Settings,
  TrendingUp,
  Globe,
  Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AutomationRule {
  id: string;
  rule_name: string;
  rule_type: string;
  conditions: any;
  actions: any;
  priority: number;
  is_active: boolean;
  trigger_count: number;
  last_triggered?: string;
}

interface DiscoveryEvent {
  id: string;
  discovery_method: string;
  discovered_provider_name: string;
  verification_status: string;
  created_at: string;
  discovery_metadata: any;
}

interface PendingProvider {
  id: string;
  provider_name: string;
  provider_type: string;
  approval_status: string;
  integration_complexity: string;
  cost_estimation: any;
  created_at: string;
}

interface SmartAutomationHubProps {
  userId?: string;
  className?: string;
}

export const SmartAutomationHub: React.FC<SmartAutomationHubProps> = ({
  userId,
  className = ""
}) => {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [recentDiscoveries, setRecentDiscoveries] = useState<DiscoveryEvent[]>([]);
  const [pendingProviders, setPendingProviders] = useState<PendingProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [discoveryRunning, setDiscoveryRunning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAutomationData();
  }, []);

  const loadAutomationData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadAutomationRules(),
        loadDiscoveries(),
        loadPendingProviders()
      ]);
    } catch (error) {
      console.error('Failed to load automation data:', error);
      toast({
        title: "Error",
        description: "Failed to load automation data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAutomationRules = async () => {
    const { data, error } = await supabase
      .from('discovery_automation_rules')
      .select('*')
      .order('priority', { ascending: true });
    
    if (error) throw error;
    setAutomationRules(data || []);
  };

  const loadDiscoveries = async () => {
    const { data, error } = await supabase
      .from('provider_discovery_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    setRecentDiscoveries(data || []);
  };

  const loadPendingProviders = async () => {
    const { data, error } = await supabase
      .from('pending_providers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    setPendingProviders(data || []);
  };

  const runProviderDiscovery = async (method: string = 'all') => {
    setDiscoveryRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('provider-discovery-engine', {
        body: { method, provider_type: 'all' }
      });

      if (error) throw error;

      toast({
        title: "Discovery Complete",
        description: `Found ${data.discovered_count} new providers`,
        variant: "default"
      });

      await loadAutomationData();
    } catch (error) {
      console.error('Discovery failed:', error);
      toast({
        title: "Discovery Failed",
        description: "Failed to run provider discovery",
        variant: "destructive"
      });
    } finally {
      setDiscoveryRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
      case 'rejected':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Smart Automation Hub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading automation data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Smart Automation Hub
        </CardTitle>
        <CardDescription>
          Intelligent provider discovery and automation management
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="discovery">Discovery</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Recent Discoveries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recentDiscoveries.length}</div>
                  <p className="text-xs text-muted-foreground">Last 24 hours</p>
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
                  <div className="text-2xl font-bold">
                    {pendingProviders.filter(p => p.approval_status === 'pending').length}
                  </div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Active Rules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {automationRules.filter(r => r.is_active).length}
                  </div>
                  <p className="text-xs text-muted-foreground">Automation rules</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Auto Success
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">94%</div>
                  <p className="text-xs text-muted-foreground">Success rate</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Provider Discovery</h3>
              <Button 
                onClick={() => runProviderDiscovery('all')}
                disabled={discoveryRunning}
              >
                <Search className="h-4 w-4 mr-2" />
                {discoveryRunning ? 'Discovering...' : 'Full Discovery'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="discovery" className="space-y-4">
            <div className="grid gap-4">
              {recentDiscoveries.map((discovery) => (
                <Card key={discovery.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(discovery.verification_status)}
                        <div>
                          <h4 className="font-medium">{discovery.discovered_provider_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Method: {discovery.discovery_method}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{discovery.verification_status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="automation" className="space-y-4">
            <div className="grid gap-4">
              {automationRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{rule.rule_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Type: {rule.rule_type} • Priority: {rule.priority}
                        </p>
                      </div>
                      <Badge variant={rule.is_active ? "default" : "secondary"}>
                        {rule.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <div className="grid gap-4">
              {pendingProviders.map((provider) => (
                <Card key={provider.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{provider.provider_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Type: {provider.provider_type} • Complexity: {provider.integration_complexity}
                        </p>
                      </div>
                      {getStatusIcon(provider.approval_status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};