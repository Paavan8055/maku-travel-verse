import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, X, Calendar, Users, DollarSign, Loader2, Zap, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

import { SmartAnalytics } from '@/components/dashboard/SmartAnalytics';
import { RealTimeFeeds } from '@/components/dashboard/RealTimeFeeds';
import { TripTimeline } from '@/components/dashboard/TripTimeline';
import { DocumentsHub } from '@/components/dashboard/DocumentsHub';
import { SmartTripPlanner } from '@/components/dashboard/SmartTripPlanner';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { LoyaltyWidget } from '@/components/ota/LoyaltyWidget';
import { SmartRecommendations } from '@/components/ota/SmartRecommendations';
import InteractiveWorldMap from '@/components/dream-map/InteractiveWorldMap';

interface BookingData {
  id: string;
  booking_reference: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  total_amount: number;
  currency: string;
  booking_data: any;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: string;
    item_type: string;
    item_details: any;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  latest_payment: {
    id: string;
    stripe_payment_intent_id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  } | null;
}

export const Dashboard: React.FC = () => {
  console.log('Dashboard: Component mounting');
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_bookings');
      
      if (error) throw error;
      
      setBookings((data as unknown as BookingData[]) || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      setCancelling(bookingId);
      const { data, error } = await supabase.rpc('cancel_booking', { 
        p_booking_id: bookingId 
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; message: string };
      if (result.success) {
        toast({
          title: "Success",
          description: "Booking cancelled successfully.",
        });
        fetchBookings(); // Refresh the list
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelling(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    fetchBookings();
  }, [authLoading, user]);

  console.log('Dashboard: Starting render');
  
  if (authLoading) {
    console.log('Dashboard: Auth loading');
    return <div>Loading auth...</div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Dashboard Test
            </h1>
            <p className="text-muted-foreground">Testing basic functionality</p>
          </div>

          {/* Step 1: Basic Cards and Tabs Layout */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="tools">Smart Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{bookings.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Active reservations
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Travel Spend</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(
                        bookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0),
                        'USD'
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      This year
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Destinations</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {new Set(bookings.map(b => b.booking_data?.destination || 'Unknown')).size}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Countries visited
                    </p>
                  </CardContent>
                </Card>
              </div>

            </TabsContent>

            <TabsContent value="bookings" className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading bookings...</span>
                </div>
              ) : bookings.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                    <p className="text-muted-foreground mb-4">Start planning your next adventure!</p>
                    <Button onClick={() => navigate('/')}>
                      Explore Destinations
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <Card key={booking.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {booking.booking_reference}
                            </CardTitle>
                            <p className="text-muted-foreground">
                              {formatDate(booking.check_in_date)} - {formatDate(booking.check_out_date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(booking.status)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/booking-details/${booking.id}`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {booking.status === 'confirmed' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleCancelBooking(booking.id)}
                                disabled={cancelling === booking.id}
                              >
                                {cancelling === booking.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <X className="h-4 w-4 mr-1" />
                                )}
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Guests</p>
                            <p className="font-medium">{booking.guest_count}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-medium">
                              {formatCurrency(booking.total_amount, booking.currency)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Payment</p>
                            <p className="font-medium">
                              {booking.latest_payment?.status || 'Pending'}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Created</p>
                            <p className="font-medium">{formatDate(booking.created_at)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <RealTimeFeeds />
            </TabsContent>

            <TabsContent value="tools" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <SmartTripPlanner />
                <DocumentsHub />
              </div>
              <TripTimeline />
              
              {/* Dream Map Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    100 Dream Destinations
                  </CardTitle>
                  <p className="text-muted-foreground">Explore and bookmark your dream travel destinations</p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-96 w-full">
                    <InteractiveWorldMap />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  );
};