import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Clock, DollarSign, TrendingUp, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface HealthMetrics {
  summary: {
    total_bookings_7d: number;
    total_payments_7d: number;
    bookings_24h: number;
    payments_24h: number;
    booking_success_rate: number;
    payment_success_rate: number;
    total_revenue_7d: number;
    revenue_24h: number;
  };
  bookings_by_status: {
    pending: number;
    confirmed: number;
    failed: number;
    cancelled: number;
  };
  payments_by_status: {
    pending: number;
    succeeded: number;
    failed: number;
    processing: number;
  };
  critical_issues: Array<{
    severity: string;
    type: string;
    message: string;
    recommendation: string;
  }>;
  common_failure_reasons: Record<string, number>;
  health_score: {
    score: number;
    status: string;
    color: string;
  };
}

export function BookingHealthDashboard() {
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchHealthMetrics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('booking-health-monitor');
      
      if (error) {
        throw error;
      }
      
      if (data?.success && data.metrics) {
        setMetrics(data.metrics);
        setLastUpdated(new Date());
        
        // Show critical issues in toast
        if (data.metrics.critical_issues.length > 0) {
          const criticalCount = data.metrics.critical_issues.filter(i => i.severity === 'CRITICAL').length;
          if (criticalCount > 0) {
            toast({
              title: `${criticalCount} Critical Issues Detected`,
              description: "Review the issues below and take immediate action",
              variant: "destructive"
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch health metrics:', error);
      toast({
        title: "Failed to load health metrics",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fixStuckBookings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fix-stuck-bookings');
      
      if (error) {
        throw error;
      }
      
      if (data?.success) {
        toast({
          title: "Stuck Bookings Recovery Completed",
          description: `Processed ${data.summary.total_processed} bookings. ${data.summary.recovered} recovered.`
        });
        
        // Refresh metrics after recovery
        fetchHealthMetrics();
      }
    } catch (error) {
      console.error('Failed to fix stuck bookings:', error);
      toast({
        title: "Recovery Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthMetrics();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchHealthMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Booking Health Dashboard</h2>
          <Button onClick={fetchHealthMetrics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY': return 'text-green-600 bg-green-50';
      case 'WARNING': return 'text-yellow-600 bg-yellow-50';
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityVariant = (severity: string): "default" | "destructive" => {
    switch (severity) {
      case 'CRITICAL': return 'destructive';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Booking Health Dashboard</h2>
          {lastUpdated && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={fixStuckBookings} disabled={isLoading} variant="outline">
            <Clock className="h-4 w-4 mr-2" />
            Fix Stuck Bookings
          </Button>
          <Button onClick={fetchHealthMetrics} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Health Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Overall Health Score</h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="text-4xl font-bold">{metrics.health_score.score}</div>
                <Badge className={getStatusColor(metrics.health_score.status)}>
                  {metrics.health_score.status}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Booking Success</div>
              <div className="text-2xl font-bold">{metrics.summary.booking_success_rate}%</div>
              <div className="text-sm text-muted-foreground mt-2">Payment Success</div>
              <div className="text-2xl font-bold">{metrics.summary.payment_success_rate}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Bookings (24h)</p>
                <p className="text-2xl font-bold">{metrics.summary.bookings_24h}</p>
                <p className="text-xs text-muted-foreground">{metrics.summary.total_bookings_7d} in 7 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">{metrics.bookings_by_status.confirmed}</p>
                <p className="text-xs text-muted-foreground">Total confirmed bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{metrics.bookings_by_status.pending}</p>
                <p className="text-xs text-muted-foreground">Awaiting payment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Revenue (24h)</p>
                <p className="text-2xl font-bold">${metrics.summary.revenue_24h}</p>
                <p className="text-xs text-muted-foreground">${metrics.summary.total_revenue_7d} in 7 days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Issues */}
      {metrics.critical_issues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Critical Issues ({metrics.critical_issues.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {metrics.critical_issues.map((issue, index) => (
              <Alert key={index} variant={getSeverityVariant(issue.severity)}>
                <AlertTriangle className="h-4 w-4" />
                <div>
                  <AlertDescription>
                    <div className="font-semibold">{issue.message}</div>
                    <div className="text-sm mt-1">{issue.recommendation}</div>
                  </AlertDescription>
                </div>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Booking Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Confirmed
              </span>
              <span className="font-bold">{metrics.bookings_by_status.confirmed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Pending
              </span>
              <span className="font-bold">{metrics.bookings_by_status.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Failed
              </span>
              <span className="font-bold">{metrics.bookings_by_status.failed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-gray-600" />
                Cancelled
              </span>
              <span className="font-bold">{metrics.bookings_by_status.cancelled}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Succeeded
              </span>
              <span className="font-bold">{metrics.payments_by_status.succeeded}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                Processing
              </span>
              <span className="font-bold">{metrics.payments_by_status.processing}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Pending
              </span>
              <span className="font-bold">{metrics.payments_by_status.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                Failed
              </span>
              <span className="font-bold">{metrics.payments_by_status.failed}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Common Failure Reasons */}
      {Object.keys(metrics.common_failure_reasons).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Common Payment Failure Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(metrics.common_failure_reasons)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([reason, count]) => (
                  <div key={reason} className="flex justify-between items-center">
                    <span className="text-sm">{reason}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}