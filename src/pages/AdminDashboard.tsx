
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminMetrics } from '@/hooks/useAdminMetrics';
import { UserManagement } from '@/components/admin/UserManagement';
import { BookingManagement } from '@/components/admin/BookingManagement';
import { SecurityMonitoring } from '@/components/admin/SecurityMonitoring';
import { ProductionMonitoringDashboard } from '@/components/admin/ProductionMonitoringDashboard';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building, 
  CreditCard, 
  TrendingUp,
  RefreshCw,
  Shield
} from 'lucide-react';

const AdminDashboard = () => {
  const { metrics, loading, error, refetch } = useAdminMetrics();

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Error Loading Admin Dashboard</h1>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refetch}>Try Again</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>Welcome to the Maku Travel admin dashboard. Monitor system health and key metrics here.</p>
                
                {metrics?.recentBookings && metrics.recentBookings.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Recent Bookings</h3>
                    <div className="space-y-2">
                      {metrics.recentBookings.slice(0, 5).map((booking: any) => (
                        <div key={booking.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                          <div>
                            <span className="font-mono text-sm">{booking.booking_reference}</span>
                            <span className="ml-2 text-sm text-muted-foreground">
                              {booking.booking_type}
                            </span>
                          </div>
                          <div className="text-sm">
                            {booking.currency} {booking.total_amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          
          <TabsContent value="bookings">
            <BookingManagement />
          </TabsContent>
          
          <TabsContent value="security">
            <SecurityMonitoring />
          </TabsContent>
          
          <TabsContent value="monitoring">
            <ProductionMonitoringDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
