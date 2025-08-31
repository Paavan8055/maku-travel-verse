
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/features/auth/context/AuthContext';
import { TripTimeline } from '@/components/dashboard/TripTimeline';
import { TravelWeatherWidget } from '@/components/dashboard/TravelWeatherWidget';
import { TravelCountdown } from '@/components/dashboard/TravelCountdown';
import { TravelInspirationCard } from '@/components/dashboard/TravelInspirationCard';
import { 
  Calendar, 
  Plane, 
  Hotel, 
  Activity, 
  Plus,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Compass,
  Globe,
  Luggage,
  Camera
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
    <div className="min-h-screen bg-gradient-to-br from-background via-travel-sky/5 to-travel-ocean/5">
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Welcome Header */}
        <div className="relative text-center space-y-4 py-8">
          <div className="absolute inset-0 bg-gradient-hero opacity-5 rounded-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold hero-text mb-2">
              Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Your travel command center is ready. Discover, book, and manage your adventures all in one place.
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Globe className="h-5 w-5 text-primary animate-float" />
              <span className="text-sm text-muted-foreground">
                {upcomingBookings.length > 0 
                  ? `${upcomingBookings.length} adventure${upcomingBookings.length > 1 ? 's' : ''} awaiting!`
                  : 'Ready for your next adventure?'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Button 
            onClick={() => navigate('/search')} 
            className="h-20 p-6 bg-gradient-to-br from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-primary-foreground shadow-card hover:shadow-floating transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center space-x-4 w-full">
              <div className="p-2 bg-white/20 rounded-lg">
                <Plane className="h-6 w-6" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-lg">Book Flights</div>
                <div className="text-sm opacity-90">Compare prices worldwide</div>
              </div>
            </div>
          </Button>
          
          <Button 
            onClick={() => navigate('/hotels')} 
            variant="outline" 
            className="h-20 p-6 bg-gradient-to-br from-travel-ocean/10 to-travel-forest/10 border-travel-ocean/20 hover:bg-travel-ocean/20 shadow-card hover:shadow-floating transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center space-x-4 w-full">
              <div className="p-2 bg-travel-ocean/20 rounded-lg">
                <Hotel className="h-6 w-6 text-travel-ocean" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-lg text-travel-ocean">Book Hotels</div>
                <div className="text-sm text-muted-foreground">Perfect stays await</div>
              </div>
            </div>
          </Button>
          
          <Button 
            onClick={() => navigate('/activities')} 
            variant="outline" 
            className="h-20 p-6 bg-gradient-to-br from-travel-sunset/10 to-travel-coral/10 border-travel-sunset/20 hover:bg-travel-sunset/20 shadow-card hover:shadow-floating transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center space-x-4 w-full">
              <div className="p-2 bg-travel-sunset/20 rounded-lg">
                <Activity className="h-6 w-6 text-travel-sunset" />
              </div>
              <div className="text-left flex-1">
                <div className="font-semibold text-lg text-travel-sunset">Activities</div>
                <div className="text-sm text-muted-foreground">Unique experiences</div>
              </div>
            </div>
          </Button>
        </div>

        {/* Travel Dashboard Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Travel Countdown */}
          {upcomingBookings.length > 0 && (
            <TravelCountdown
              destination={upcomingBookings[0].booking_data?.destination || 'Your Next Destination'}
              departureDate={upcomingBookings[0].check_in_date || new Date().toISOString()}
              bookingType={upcomingBookings[0].booking_type}
            />
          )}
          
          {/* Weather Widget */}
          <TravelWeatherWidget 
            destinations={upcomingBookings.map(b => b.booking_data?.destination || 'Unknown').filter(Boolean)}
          />
          
          {/* Travel Inspiration */}
          <TravelInspirationCard 
            onExplore={(destination) => {
              // Navigate to search with destination pre-filled
              navigate(`/search?destination=${encodeURIComponent(destination.name)}`);
            }}
          />
        </div>

        {/* Enhanced Recent Bookings */}
        <Card className="travel-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-hero rounded-lg">
                  <Luggage className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Your Travel History</h3>
                  <p className="text-sm text-muted-foreground font-normal">Recent bookings and adventures</p>
                </div>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/bookings')} className="hover:bg-primary hover:text-primary-foreground">
                <Compass className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
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
              <div className="text-center py-12">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-pink-orange opacity-10 rounded-full w-24 h-24 mx-auto animate-pulse-soft"></div>
                  <Camera className="w-16 h-16 text-primary mx-auto relative z-10" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Your adventure awaits!</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create unforgettable memories with your first booking. The world is waiting to be explored.
                </p>
                <Button onClick={() => navigate('/search')} className="bg-gradient-hero hover:opacity-90">
                  <Plus className="h-4 w-4 mr-2" />
                  Start Your Journey
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="group relative p-6 bg-gradient-to-r from-card to-muted/20 rounded-xl border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-hero rounded-lg">
                          {getBookingTypeIcon(booking.booking_type)}
                        </div>
                        <div>
                          <p className="font-semibold text-lg text-foreground">{booking.booking_reference}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span className="capitalize font-medium">{booking.booking_type}</span>
                            <span>•</span>
                            <span>{formatDate(booking.check_in_date)}</span>
                            {booking.booking_data?.destination && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {booking.booking_data.destination}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-bold text-lg text-foreground">
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
                            className="capitalize font-medium"
                          >
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Upcoming Travel */}
        {upcomingBookings.length > 0 && (
          <Card className="travel-card bg-gradient-to-br from-primary/5 to-accent/5 border-l-4 border-l-primary">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-hero rounded-lg">
                  <Plane className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Ready for Takeoff</h3>
                  <p className="text-sm text-muted-foreground font-normal">Your confirmed adventures</p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="group p-5 bg-gradient-to-r from-background to-primary/5 rounded-xl border border-primary/20 hover:border-primary/40 hover:shadow-card transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {getBookingTypeIcon(booking.booking_type)}
                        </div>
                        <div>
                          <p className="font-semibold text-lg text-foreground">{booking.booking_reference}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>Departing {formatDate(booking.check_in_date)}</span>
                            {booking.booking_data?.destination && (
                              <>
                                <span>•</span>
                                <MapPin className="h-3 w-3" />
                                <span>{booking.booking_data.destination}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        View Details
                      </Button>
                    </div>
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
