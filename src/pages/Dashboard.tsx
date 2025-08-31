
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/features/auth/context/AuthContext';
import { TripTimeline } from '@/components/dashboard/TripTimeline';
import { BookingManagementDashboard } from '@/components/dashboard/BookingManagementDashboard';
import { 
  Calendar, 
  Plane, 
  Hotel, 
  Activity, 
  Plus,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const { bookings, loading, error } = useBookings();
  const navigate = useNavigate();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getBookingTypeIcon = (type: string) => {
    switch (type) {
      case 'flight':
        return <Plane className="h-5 w-5 text-primary" />;
      case 'hotel':
        return <Hotel className="h-5 w-5 text-primary" />;
      case 'activity':
        return <Activity className="h-5 w-5 text-primary" />;
      default:
        return <MapPin className="h-5 w-5 text-primary" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const upcomingBookings = bookings.filter(booking => {
    if (!booking.check_in_date) return false;
    const checkInDate = new Date(booking.check_in_date);
    return checkInDate > new Date() && booking.status === 'confirmed';
  });

  const recentBookings = bookings.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Manage your bookings and plan your next adventure
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={() => navigate('/search')} 
            className="h-16 text-left justify-start space-x-3"
          >
            <Plane className="h-6 w-6" />
            <div>
              <div className="font-semibold">Book Flights</div>
              <div className="text-sm opacity-80">Find and book flights</div>
            </div>
          </Button>
          
          <Button 
            onClick={() => navigate('/hotels')} 
            variant="outline" 
            className="h-16 text-left justify-start space-x-3"
          >
            <Hotel className="h-6 w-6" />
            <div>
              <div className="font-semibold">Book Hotels</div>
              <div className="text-sm opacity-80">Find accommodations</div>
            </div>
          </Button>
          
          <Button 
            onClick={() => navigate('/activities')} 
            variant="outline" 
            className="h-16 text-left justify-start space-x-3"
          >
            <Activity className="h-6 w-6" />
            <div>
              <div className="font-semibold">Activities</div>
              <div className="text-sm opacity-80">Discover experiences</div>
            </div>
          </Button>
        </div>

        {/* Recent Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Bookings
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/bookings')}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading bookings...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive">Error loading bookings: {error}</p>
              </div>
            ) : recentBookings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                <p className="text-muted-foreground mb-4">Start planning your next adventure!</p>
                <Button onClick={() => navigate('/search')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Make Your First Booking
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getBookingTypeIcon(booking.booking_type)}
                      <div>
                        <p className="font-semibold">{booking.booking_reference}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {booking.booking_type} • {formatDate(booking.check_in_date)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className="font-semibold">
                          {booking.currency} {booking.total_amount}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(booking.status)}
                        <Badge 
                          variant={
                            booking.status === 'confirmed' ? 'default' : 
                            booking.status === 'pending' ? 'secondary' : 
                            'destructive'
                          }
                          className="capitalize"
                        >
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Travel */}
        {upcomingBookings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Upcoming Travel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getBookingTypeIcon(booking.booking_type)}
                      <div>
                        <p className="font-semibold">{booking.booking_reference}</p>
                        <p className="text-sm text-muted-foreground">
                          Departing {formatDate(booking.check_in_date)}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trip Timeline Component */}
        <TripTimeline />
      </div>
    </div>
  );
};

export default Dashboard;
