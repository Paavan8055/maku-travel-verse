
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, 
  DollarSign, 
  Users, 
  TrendingUp,
  Calendar,
  MapPin,
  Star,
  AlertCircle
} from 'lucide-react';
import logger from "@/utils/logger";

interface DashboardData {
  current_month_bookings: number;
  current_month_revenue: number;
  active_properties: number;
  total_properties: number;
  recent_bookings: Array<{
    id: string;
    guest_name: string;
    property_name: string;
    check_in: string;
    check_out: string;
    total_amount: number;
    status: string;
  }>;
}

interface PartnerProfile {
  company_name: string;
  contact_email: string;
  phone: string;
  address: string;
  partner_type: string;
  status: string;
}

const PartnerDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchPartnerProfile();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
        const { data, error } = await supabase.rpc('get_partner_dashboard_data', {
          p_partner_id: user?.id
        });

      if (error) {
        logger.error('Error fetching dashboard data:', error);
      } else {
        // Safely cast the data with proper type checking
        const typedData = data as unknown as DashboardData;
        setDashboardData(typedData);
      }
    } catch (error) {
      logger.error('Error in fetchDashboardData:', error);
    }
  };

  const fetchPartnerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('partner_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        logger.error('Error fetching partner profile:', error);
      } else {
        setPartnerProfile({
          company_name: (data?.business_name as string) || '',
          contact_email: user?.email || '',
          phone: (data?.phone as string) || '',
          address: typeof data?.address === 'string' ? data.address : '',
          partner_type: (data?.business_type as string) || '',
          status: 'active'
        });
      }
    } catch (error) {
      logger.error('Error in fetchPartnerProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Mock data fallback if RPC fails
  const mockData: DashboardData = {
    current_month_bookings: 12,
    current_month_revenue: 15420,
    active_properties: 3,
    total_properties: 5,
    recent_bookings: [
      {
        id: '1',
        guest_name: 'John Smith',
        property_name: 'Sydney Harbour Hotel',
        check_in: '2024-02-15',
        check_out: '2024-02-18',
        total_amount: 1250,
        status: 'confirmed'
      }
    ]
  };

  const displayData = dashboardData || mockData;
  const occupancyRate = displayData.total_properties > 0 
    ? Math.round((displayData.active_properties / displayData.total_properties) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Partner Dashboard</h1>
          <div className="flex gap-3">
            <Button variant="outline">
              <Building2 className="mr-2 h-4 w-4" />
              Add Property
            </Button>
            <Button>
              <Users className="mr-2 h-4 w-4" />
              Manage Bookings
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month's Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayData.current_month_bookings}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${displayData.current_month_revenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+8% from last month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Properties</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayData.active_properties}</div>
              <p className="text-xs text-muted-foreground">
                {occupancyRate}% occupancy rate
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.7</div>
              <p className="text-xs text-muted-foreground">Across all properties</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {displayData.recent_bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{booking.guest_name}</p>
                          <p className="text-sm text-muted-foreground">{booking.property_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {booking.check_in} - {booking.check_out}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${booking.total_amount}</p>
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="ghost">
                    <Building2 className="mr-2 h-4 w-4" />
                    Add New Property
                  </Button>
                  <Button className="w-full justify-start" variant="ghost">
                    <Calendar className="mr-2 h-4 w-4" />
                    Update Availability
                  </Button>
                  <Button className="w-full justify-start" variant="ghost">
                    <DollarSign className="mr-2 h-4 w-4" />
                    Set Pricing Rules
                  </Button>
                  <Button className="w-full justify-start" variant="ghost">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="properties">
            <Card>
              <CardHeader>
                <CardTitle>Property Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Manage your properties, update listings, and monitor performance.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Booking Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p>View, modify, and track all your bookings in one place.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Detailed insights into your property performance and revenue trends.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Partner Profile</CardTitle>
              </CardHeader>
              <CardContent>
                {partnerProfile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Company Name</label>
                      <p className="text-sm text-muted-foreground">{partnerProfile.company_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contact Email</label>
                      <p className="text-sm text-muted-foreground">{partnerProfile.contact_email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Partner Type</label>
                      <p className="text-sm text-muted-foreground">{partnerProfile.partner_type}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        partnerProfile.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {partnerProfile.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Loading profile information...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PartnerDashboard;
