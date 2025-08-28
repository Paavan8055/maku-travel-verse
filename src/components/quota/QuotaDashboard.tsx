import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuotaMonitor } from "@/hooks/useQuotaMonitor";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function QuotaDashboard() {
  const {
    quotas,
    warnings,
    criticalProviders,
    recommendedActions,
    lastUpdated,
    loading,
    error,
    refreshQuotas,
    getQuotaStats,
    getOverallQuotaHealth
  } = useQuotaMonitor();

  const stats = getQuotaStats();
  const overallHealth = getOverallQuotaHealth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-orange-500';
      case 'exceeded': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'exceeded': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': case 'exceeded': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Provider Quota Monitor</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of API quotas and usage limits
          </p>
        </div>
        <Button
          onClick={refreshQuotas}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="providers">Provider Details</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(overallHealth)}
                System Quota Health
              </CardTitle>
              <CardDescription>
                {lastUpdated 
                  ? `Last updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}`
                  : 'No data available'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.healthy}</div>
                  <div className="text-sm text-muted-foreground">Healthy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
                  <div className="text-sm text-muted-foreground">Warning</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.critical}</div>
                  <div className="text-sm text-muted-foreground">Critical</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.exceeded}</div>
                  <div className="text-sm text-muted-foreground">Exceeded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.availabilityPercentage.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warnings and Alerts */}
          {(warnings.length > 0 || error) && (
            <div className="space-y-3 mt-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {warnings.slice(0, 3).map((warning, index) => (
                <Alert key={index} variant="default">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="providers">
          {/* Provider Quotas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quotas.map((quota) => (
              <Card key={`${quota.provider}-${quota.service}`} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg capitalize">
                      {quota.provider}
                    </CardTitle>
                    <Badge variant={getStatusVariant(quota.status)}>
                      {quota.status}
                    </Badge>
                  </div>
                  <CardDescription className="capitalize">
                    {quota.service.replace('_', ' ')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Usage</span>
                      <span>
                        {quota.quotaUsed.toLocaleString()} / {quota.quotaLimit.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={quota.percentageUsed}
                      className="h-2"
                    />
                    <div className="text-center text-sm text-muted-foreground">
                      {quota.percentageUsed.toFixed(1)}% used
                    </div>
                  </div>

                  {quota.resetTime && (
                    <div className="text-xs text-muted-foreground">
                      Resets: {new Date(quota.resetTime).toLocaleString()}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Last checked: {formatDistanceToNow(quota.lastChecked, { addSuffix: true })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="space-y-6">
            {/* Critical Providers Alert */}
            {criticalProviders.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Critical:</strong> The following providers have quota issues: {criticalProviders.join(', ')}. 
                  Some services may be temporarily unavailable.
                </AlertDescription>
              </Alert>
            )}

            {/* All Warnings */}
            {warnings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">System Warnings</h3>
                {warnings.map((warning, index) => (
                  <Alert key={index} variant="default">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{warning}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Recommended Actions */}
            {recommendedActions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Actions</CardTitle>
                  <CardDescription>
                    Suggested steps to optimize quota usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recommendedActions.map((action, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <p className="text-sm">{action}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}