
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
import { Eye, X, Calendar, Users, DollarSign, Loader2, Zap, TrendingUp, Activity, BarChart3, RefreshCw, MapPin, Plane, Hotel } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import logger from "@/utils/logger";
import { PerformanceWrapper } from "@/components/PerformanceWrapper";

import { SmartAnalytics } from '@/components/dashboard/SmartAnalytics';
import { RealTimeFeeds } from '@/components/dashboard/RealTimeFeeds';
import { TripTimeline } from '@/components/dashboard/TripTimeline';
import { DocumentsHub } from '@/components/dashboard/DocumentsHub';
import { SmartTripPlanner } from '@/components/dashboard/SmartTripPlanner';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { LoyaltyWidget } from '@/components/ota/LoyaltyWidget';
import { SmartRecommendations } from '@/components/ota/SmartRecommendations';
import SimpleDreamMap from '@/components/dream-map/SimpleDreamMap';
import { DetailedBookingCard } from '@/components/dashboard/DetailedBookingCard';
import { MyTripsSection } from '@/components/dashboard/MyTripsSection';
import { useTrips } from '@/hooks/useTrips';

interface BookingData {
  id: string;
  booking_reference: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  total_amount: number;
  currency: string;
  booking_type: string;
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

const Dashboard: React.FC = () => {
  console.log('Dashboard: Component mounting');
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { trips, loading: tripsLoading } = useTrips();

  const fetchBookings = async () => {
    if (!user) return;
    
    setLoading(true);
    console.log('Dashboard: Fetching bookings for user:', user.id);
    
    try {
      const { data, error } = await supabase.rpc('get_user_bookings');
      
      if (error) {
        logger.error('Error fetching bookings:', error);
        toast({
          title: "Error",
          description: "Failed to load your bookings. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Type-safe handling of the JSON response
      const bookingsArray = Array.isArray(data) ? (data as unknown as BookingData[]) : [];
      console.log('Dashboard: Booking fetch result:', { 
        bookingsArray, 
        error, 
        user: user.id,
        userEmail: user.email,
        dataLength: bookingsArray.length || 0 
      });
      
      setBookings(bookingsArray);
      
      console.log('Dashboard: Set bookings count:', bookingsArray.length);
      
      // If no bookings found, check if there's a recent receipt in localStorage
      if (bookingsArray.length === 0) {
        const keys = Object.keys(localStorage).filter(key => key.startsWith('receipt:'));
        if (keys.length > 0) {
          console.log('Dashboard: Found recent receipts in localStorage, will refresh again');
          // Try again in 3 seconds
          setTimeout(() => {
            console.log('Dashboard: Retrying booking fetch after localStorage hint');
            fetchBookings();
          }, 3000);
        }
      }
      
    } catch (err) {
      logger.error('Fetch bookings exception:', err);
      toast({
        title: "Error",
        description: "Failed to load your bookings. Please try again.",
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
      logger.error('Error cancelling booking:', error);
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
    if (!dateString) return 'N/A';
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

  // Calculate summary statistics
  const totalSpent = bookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const upcomingTrips = trips.filter(t => t.status === 'booked' && new Date(t.start_date) > new Date());
  const destinations = new Set([
    ...bookings.map(b => b.booking_data?.destination || 'Unknown').filter(d => d !== 'Unknown'),
    ...trips.map(t => t.destination)
  ]);

  useEffect(() => {
    if (user) {
      fetchBookings();
      
      // Check if user just completed a booking or needs refresh
      const urlParams = new URLSearchParams(window.location.search);
      const bookingCompleted = urlParams.get('booking_completed') === 'true';
      const shouldRefresh = urlParams.get('refresh') === 'true';
      
      if (bookingCompleted || shouldRefresh) {
        console.log('Dashboard: Detected completion/refresh, fetching bookings with delay');
        // Add a delay to ensure data is ready in the database
        setTimeout(() => {
          fetchBookings();
          if (bookingCompleted) {
            toast({
              title: "Booking completed!",
              description: "Your booking has been confirmed and is now visible in your bookings.",
              duration: 5000,
            });
          }
          // Clean up URL
          window.history.replaceState({}, '', '/dashboard');
        }, 2000); // Increased delay to 2 seconds
      }
    }
  }, [user, toast]);

  console.log('Dashboard: Starting render');
  
  if (authLoading) {
    console.log('Dashboard: Auth loading');
    return <div>Loading auth...</div>;
  }

  return (
    <AuthGuard>
      <PerformanceWrapper componentName="DashboardPage">
        <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  Welcome back{user?.email && `, ${user.email.split('@')[0]}`}!
                </h1>
                <p className="text-muted-foreground">Here's your travel overview</p>
              </div>
              <Button 
                variant="outline" 
                onClick={fetchBookings}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Tabs Layout */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="tools">Smart Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Quick Stats Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{confirmedBookings.length}</div>
                    <p className="text-xs text-muted-foreground">
                      {bookings.length} total bookings
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(totalSpent, 'USD')}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All time travel expenses
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Upcoming Trips</CardTitle>
                    <Plane className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{upcomingTrips.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Planned adventures
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Destinations</CardTitle>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{destinations.size}</div>
                    <p className="text-xs text-muted-foreground">
                      Places visited & planned
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity and Quick Actions */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Bookings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : bookings.length > 0 ? (
                      <div className="space-y-4">
                        {bookings.slice(0, 3).map((booking) => (
                          <div key={booking.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                {booking.booking_type === 'hotel' ? (
                                  <Hotel className="h-4 w-4 text-primary" />
                                ) : (
                                  <Plane className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">{booking.booking_reference}</p>
                                <p className="text-sm text-muted-foreground">
                                  {booking.booking_type} • {formatDate(booking.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(booking.status)}
                              <p className="text-sm font-medium mt-1">
                                {formatCurrency(booking.total_amount, booking.currency)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {bookings.length > 3 && (
                          <Button 
                            variant="outline" 
                            className="w-full" 
                            onClick={() => document.querySelector('[value="bookings"]')?.click()}
                          >
                            View All Bookings ({bookings.length})
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">No bookings yet</p>
                        <Button onClick={() => navigate('/search')}>
                          Start Planning
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => navigate('/search')}
                    >
                      <Plane className="h-4 w-4 mr-2" />
                      Book a Flight
                    </Button>
                    
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => navigate('/search')}
                    >
                      <Hotel className="h-4 w-4 mr-2" />
                      Find Hotels
                    </Button>
                    
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => navigate('/search')}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Discover Activities
                    </Button>
                    
                    <Separator />
                    
                    <Button 
                      className="w-full justify-start" 
                      variant="ghost"
                      onClick={() => document.querySelector('[value="tools"]')?.click()}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Trip Planner
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Loyalty Widget */}
              <LoyaltyWidget />

              {/* Smart Recommendations */}
              <SmartRecommendations />
            </TabsContent>

            <TabsContent value="bookings" className="space-y-6">
              <MyTripsSection />
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
                <CardContent>
                  <SimpleDreamMap />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      </PerformanceWrapper>
    </AuthGuard>
  );
};

export default Dashboard;
