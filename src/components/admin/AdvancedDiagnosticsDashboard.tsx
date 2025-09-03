import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  Server, 
  Shield, 
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Zap,
  BarChart3,
  Settings,
  HardDrive
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DiagnosticResult {
  component: string;
  status: 'healthy' | 'warning' | 'critical';
  metrics: Record<string, any>;
  recommendations: string[];
  lastChecked: string;
}

interface SystemDiagnostics {
  overall_status: string;
  diagnostics: DiagnosticResult[];
  timestamp: string;
}

export const AdvancedDiagnosticsDashboard = () => {
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    runFullDiagnostic();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      runFullDiagnostic(false);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const runFullDiagnostic = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('advanced-diagnostics', {
        body: { action: 'full_diagnostic' }
      });

      if (error) throw error;
      setDiagnostics(data);
    } catch (error) {
      console.error('Error running diagnostics:', error);
      toast({
        title: "Error",
        description: "Failed to run system diagnostics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runComponentDiagnostic = async (component: string) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('advanced-diagnostics', {
        body: { action: 'component_diagnostic', component }
      });

      if (error) throw error;
      
      // Update the specific component in diagnostics
      if (diagnostics) {
        const updatedDiagnostics = diagnostics.diagnostics.map(d => 
          d.component === component ? data : d
        );
        setDiagnostics({
          ...diagnostics,
          diagnostics: updatedDiagnostics
        });
      }

      toast({
        title: "Success",
        description: `${component} diagnostic completed`
      });
    } catch (error) {
      console.error('Error running component diagnostic:', error);
      toast({
        title: "Error",
        description: `Failed to run ${component} diagnostic`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runAutomatedRecovery = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('advanced-diagnostics', {
        body: { action: 'automated_recovery' }
      });

      if (error) throw error;

      toast({
        title: "Recovery Initiated",
        description: `${data.recovery_actions.length} recovery actions executed`
      });

      // Refresh diagnostics after recovery
      setTimeout(() => runFullDiagnostic(false), 5000);
    } catch (error) {
      console.error('Error running automated recovery:', error);
      toast({
        title: "Error",
        description: "Failed to run automated recovery",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'critical':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'database':
        return <Database className="h-5 w-5" />;
      case 'providers':
        return <Server className="h-5 w-5" />;
      case 'performance':
        return <Activity className="h-5 w-5" />;
      case 'security':
        return <Shield className="h-5 w-5" />;
      case 'queues':
        return <BarChart3 className="h-5 w-5" />;
      case 'storage':
        return <HardDrive className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  if (!diagnostics && !loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Button onClick={() => runFullDiagnostic()}>
          Run System Diagnostics
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => runFullDiagnostic()} 
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={runAutomatedRecovery} 
            disabled={loading}
            variant="outline"
          >
            <Zap className="h-4 w-4 mr-2" />
            Auto Recovery
          </Button>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
          >
            <Clock className="h-4 w-4 mr-2" />
            Auto Refresh
          </Button>
        </div>
        {diagnostics && (
          <Badge variant={diagnostics.overall_status === 'healthy' ? 'secondary' : 'destructive'}>
            System Status: {diagnostics.overall_status.toUpperCase()}
          </Badge>
        )}
      </div>

      {/* System Overview */}
      {diagnostics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {diagnostics.diagnostics.map((diagnostic) => (
            <Card key={diagnostic.component}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {getComponentIcon(diagnostic.component)}
                  <span className="font-medium capitalize">{diagnostic.component}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(diagnostic.status)}
                  <span className={`text-sm ${getStatusColor(diagnostic.status)}`}>
                    {diagnostic.status.toUpperCase()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detailed Diagnostics */}
      {diagnostics && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {diagnostics.diagnostics.map((diagnostic) => (
                <Card key={diagnostic.component}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center space-x-2">
                      {getComponentIcon(diagnostic.component)}
                      <span className="capitalize">{diagnostic.component}</span>
                    </CardTitle>
                    {getStatusIcon(diagnostic.status)}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(diagnostic.metrics).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span>{typeof value === 'number' ? value.toLocaleString() : String(value)}</span>
                        </div>
                      ))}
                    </div>
                    {diagnostic.recommendations.length > 0 && (
                      <Alert className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          {diagnostic.recommendations[0]}
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="components" className="space-y-4">
            {diagnostics.diagnostics.map((diagnostic) => (
              <Card key={diagnostic.component}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      {getComponentIcon(diagnostic.component)}
                      <span className="capitalize">{diagnostic.component} Diagnostics</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(diagnostic.status)}
                      <Button 
                        onClick={() => runComponentDiagnostic(diagnostic.component)}
                        size="sm"
                        variant="outline"
                      >
                        Recheck
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(diagnostic.metrics).map(([key, value]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <span className="font-medium">
                            {typeof value === 'number' && key.includes('percent') ? (
                              <>
                                {value}%
                                <Progress value={value} className="w-16 h-2 mt-1" />
                              </>
                            ) : (
                              typeof value === 'number' ? value.toLocaleString() : String(value)
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {diagnostic.recommendations.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <h4 className="text-sm font-medium">Recommendations:</h4>
                      <ul className="space-y-1">
                        {diagnostic.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm text-muted-foreground flex items-start">
                            <span className="text-yellow-500 mr-2">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {diagnostics.diagnostics
                    .filter(d => d.component === 'performance')[0]?.metrics && 
                    Object.entries(diagnostics.diagnostics.filter(d => d.component === 'performance')[0].metrics)
                      .map(([key, value]) => (
                        <div key={key} className="text-center">
                          <p className="text-2xl font-bold">
                            {typeof value === 'number' ? value.toLocaleString() : String(value)}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </p>
                        </div>
                      ))
                  }
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Capacity Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">CPU Utilization</p>
                      <Progress value={65} className="mt-2" />
                      <p className="text-xs text-muted-foreground mt-1">65% average</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Memory Utilization</p>
                      <Progress value={45} className="mt-2" />
                      <p className="text-xs text-muted-foreground mt-1">45% average</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {diagnostics.diagnostics.flatMap(d => d.recommendations).map((recommendation, index) => (
                    <Alert key={index}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{recommendation}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};