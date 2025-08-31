
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useBookings } from '@/hooks/useBookings';
import { useTrips } from '@/hooks/useTrips';
import { TripTimeline } from '@/components/dashboard/TripTimeline';
import { BookingManagementDashboard } from '@/components/dashboard/BookingManagementDashboard';
import { 
  Calendar,
  MapPin,
  Plane,
  Building2,
  Activity,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Users,
  Star,
  Globe
} from 'lucide-react';
import { formatDistance } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const { bookings, loading: bookingsLoading } = useBookings();
  const { trips, loading: tripsLoading } = useTrips();
  const [activeTab, setActiveTab] = useState('overview');

  // Calculate dashboard statistics
  const stats = React.useMemo(() => {
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const totalSpent = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    
    const upcomingTrips = trips.filter(t => 
      new Date(t.start_date) > new Date() && t.status !== 'completed'
    );
    
    const activeTrips = trips.filter(t => 
      t.status === 'traveling' || (
        new Date(t.start_date) <= new Date() && 
        new Date(t.end_date) >= new Date()
      )
    );

    return {
      totalBookings: bookings.length,
      confirmedBookings: confirmedBookings.length,
      pendingBookings: pendingBookings.length,
      totalSpent,
      upcomingTrips: upcomingTrips.length,
      activeTrips: activeTrips.length,
      totalTrips: trips.length
    };
  }, [bookings, trips]);

  // Get recent activity (last 5 bookings and trips)
  const recentActivity = React.useMemo(() => {
    const bookingActivities = bookings
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map(booking => ({
        id: booking.id,
        type: 'booking' as const,
        title: `${booking.booking_type} booking`,
        subtitle: booking.booking_reference,
        date: booking.created_at,
        status: booking.status,
        amount: booking.total_amount,
        currency: booking.currency
      }));

    const tripActivities = trips
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 2)
      .map(trip => ({
        id: trip.id,
        type: 'trip' as const,
        title: `Trip to ${trip.destination}`,
        subtitle: `${formatDistance(new Date(trip.start_date), new Date(), { addSuffix: true })}`,
        date: trip.created_at,
        status: trip.status,
        days: Math.ceil((new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) / (1000 * 60 * 60 * 24))
      }));

    return [...bookingActivities, ...tripActivities]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [bookings, trips]);

  // Get next upcoming trip
  const nextTrip = React.useMemo(() => {
    return trips
      .filter(t => new Date(t.start_date) > new Date() && t.status !== 'completed')
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];
  }, [trips]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
      case 'planning':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'traveling':
        return <Plane className="h-4 w-4 text-blue-600" />;
      case 'booked':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
      case 'planning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'traveling':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'booked':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-trip':
        // Find and click the "Plan New Trip" button in TripTimeline
        setTimeout(() => {
          const button = document.querySelector('[data-testid="plan-new-trip-button"]') as HTMLElement;
          if (button) {
            button.click();
          }
        }, 100);
        setActiveTab('trips');
        break;
      case 'search-hotels':
        window.location.href = '/hotels';
        break;
      case 'search-flights':
        window.location.href = '/flights';
        break;
      case 'search-activities':
        window.location.href = '/activities';
        break;
      case 'view-bookings':
        setActiveTab('bookings');
        break;
      case 'view-trips':
        setActiveTab('trips');
        break;
    }
  };

  if (bookingsLoading || tripsLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.user_metadata?.full_name || 'Traveler'}!</h1>
              <p className="text-muted-foreground mt-1">
                Manage your trips, bookings, and discover new destinations
              </p>
            </div>
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback>
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="trips">My Trips</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBookings}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.confirmedBookings} confirmed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTrips}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.upcomingTrips} upcoming
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.totalSpent.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all bookings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
                  <Plane className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeTrips}</div>
                  <p className="text-xs text-muted-foreground">
                    Currently traveling
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Next Trip Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Next Trip
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {nextTrip ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{nextTrip.destination}</h3>
                          <p className="text-muted-foreground">
                            {new Date(nextTrip.start_date).toLocaleDateString()} - {new Date(nextTrip.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className={getStatusColor(nextTrip.status)}>
                          {nextTrip.status}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Departing {formatDistance(new Date(nextTrip.start_date), new Date(), { addSuffix: true })}
                      </div>

                      {nextTrip.budget && (
                        <div className="flex justify-between text-sm">
                          <span>Budget:</span>
                          <span className="font-medium">${nextTrip.budget.toLocaleString()}</span>
                        </div>
                      )}

                      <Button 
                        onClick={() => handleQuickAction('view-trips')} 
                        className="w-full"
                        variant="outline"
                      >
                        View Trip Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No upcoming trips</h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        Start planning your next adventure!
                      </p>
                      <Button onClick={() => handleQuickAction('new-trip')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Plan New Trip
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={`${activity.type}-${activity.id}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="flex-shrink-0">
                            {getStatusIcon(activity.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{activity.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{activity.subtitle}</p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {activity.type === 'booking' && activity.amount && (
                              <div>${activity.amount}</div>
                            )}
                            {activity.type === 'trip' && activity.days && (
                              <div>{activity.days} days</div>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button 
                        variant="ghost" 
                        className="w-full" 
                        onClick={() => handleQuickAction('view-bookings')}
                      >
                        View All Activity
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">No recent activity</h3>
                      <p className="text-muted-foreground text-sm">
                        Your bookings and trips will appear here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2" 
                    onClick={() => handleQuickAction('new-trip')}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="text-xs">Plan Trip</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2" 
                    onClick={() => handleQuickAction('search-hotels')}
                  >
                    <Building2 className="h-5 w-5" />
                    <span className="text-xs">Book Hotel</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2" 
                    onClick={() => handleQuickAction('search-flights')}
                  >
                    <Plane className="h-5 w-5" />
                    <span className="text-xs">Book Flight</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2" 
                    onClick={() => handleQuickAction('search-activities')}
                  >
                    <Activity className="h-5 w-5" />
                    <span className="text-xs">Find Activities</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2" 
                    onClick={() => handleQuickAction('view-bookings')}
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="text-xs">My Bookings</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2" 
                    onClick={() => handleQuickAction('view-trips')}
                  >
                    <Globe className="h-5 w-5" />
                    <span className="text-xs">My Trips</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <BookingManagementDashboard />
          </TabsContent>

          <TabsContent value="trips">
            <TripTimeline />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
