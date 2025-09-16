import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building, 
  CreditCard, 
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

const AdminOverviewPage = () => {
  const { metrics, loading, error, refetch } = useAdminMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Dashboard</h1>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={refetch}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Monitor key metrics and system performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Last updated: {metrics?.lastUpdated ? new Date(metrics.lastUpdated).toLocaleString() : 'Never'}
          </div>
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalBookings || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(metrics?.totalRevenue || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeProperties || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Welcome to the MAKU Travel admin dashboard. Monitor system health and key metrics here.</p>
          
          {(() => {
            // Defensive programming: ensure recentBookings is an array
            const bookingsArray = Array.isArray(metrics?.recentBookings) 
              ? metrics.recentBookings 
              : (typeof metrics?.recentBookings === 'string' 
                  ? (() => {
                      try {
                        return JSON.parse(metrics.recentBookings);
                      } catch {
                        return [];
                      }
                    })()
                  : []
                );
            
            return bookingsArray.length > 0 ? (
              <div>
                <h3 className="font-semibold mb-2">Recent Bookings</h3>
                <div className="space-y-2">
                  {bookingsArray.slice(0, 5).map((booking: any, index: number) => (
                    <div key={booking.id || index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <div>
                        <span className="font-mono text-sm">{booking.booking_reference || 'N/A'}</span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          {booking.booking_type || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-sm">
                        {booking.currency || 'USD'} {booking.total_amount || '0.00'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold mb-2">Recent Bookings</h3>
                <p className="text-muted-foreground">No recent bookings found.</p>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverviewPage;