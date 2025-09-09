import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { Calendar, DollarSign, Home, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import logger from '@/utils/logger';
import { EnhancedPartnerDashboard } from '@/components/dashboard/EnhancedPartnerDashboard';

interface PartnerStats {
  current_month_bookings: number;
  current_month_revenue: number;
  total_properties: number;
  active_properties: number;
  recent_bookings: Array<{
    id: string;
    booking_value: number;
    commission_amount: number;
    created_at: string;
    property_name: string;
  }>;
  monthly_analytics: Array<{
    month: number;
    year: number;
    total_bookings: number;
    total_revenue: number;
    total_commission: number;
  }>;
}

export const PartnerDashboardReal = () => {
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadPartnerData();
    }
  }, [user]);

  const loadPartnerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get partner profile
      const { data: partnerProfile, error: profileError } = await supabase
        .from('partner_profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (profileError || !partnerProfile) {
        setError('Partner profile not found. Please contact support.');
        return;
      }

      // Get dashboard data using the database function
      const { data: dashboardData, error: dashboardError } = await supabase
        .rpc('get_partner_dashboard_data', { p_partner_id: partnerProfile.id });

      if (dashboardError) {
        throw new Error(dashboardError.message);
      }

      if (dashboardData && typeof dashboardData === 'object' && 'error' in dashboardData) {
        throw new Error(String((dashboardData as any).error));
      }

      setStats(dashboardData as unknown as PartnerStats);
      logger.info('Partner dashboard data loaded', { partnerId: partnerProfile.id });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load partner data';
      logger.error('Partner dashboard error:', err);
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading partner dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Dashboard Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadPartnerData} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>Unable to load partner dashboard data</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <EnhancedPartnerDashboard />
      <div className="max-w-7xl mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Partner Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your properties and track performance
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.current_month_bookings}</div>
              <p className="text-xs text-muted-foreground">bookings this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.current_month_revenue)}</div>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Properties</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_properties}</div>
              <p className="text-xs text-muted-foreground">of {stats.total_properties} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_properties > 0 ? Math.round((stats.active_properties / stats.total_properties) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">properties active</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Bookings
            </CardTitle>
            <CardDescription>Latest bookings across your properties</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recent_bookings && stats.recent_bookings.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{booking.property_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(booking.booking_value)}</div>
                      <div className="text-sm text-muted-foreground">
                        Commission: {formatCurrency(booking.commission_amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent bookings found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>Revenue and booking trends over time</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.monthly_analytics && stats.monthly_analytics.length > 0 ? (
              <div className="space-y-4">
                {stats.monthly_analytics.slice(0, 6).map((analytics) => (
                  <div key={`${analytics.year}-${analytics.month}`} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">
                        {new Date(analytics.year, analytics.month - 1).toLocaleDateString('en-US', { 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {analytics.total_bookings} bookings
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(analytics.total_revenue)}</div>
                      <div className="text-sm text-muted-foreground">
                        Commission: {formatCurrency(analytics.total_commission)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No analytics data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button onClick={loadPartnerData} variant="outline">
            Refresh Data
          </Button>
          <Button>
            Add New Property
          </Button>
        </div>
      </div>
    </div>
  );
};