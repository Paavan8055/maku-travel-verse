
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Coins } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useBookings, Booking } from '@/hooks/useBookings';
import { TravelCountdown } from '@/components/dashboard/TravelCountdown';
import { TravelWeatherWidget } from '@/components/dashboard/TravelWeatherWidget';
import { DreamDestinationsCard } from '@/components/dashboard/DreamDestinationsCard';
import { DetailedBookingCard } from '@/components/dashboard/DetailedBookingCard';
import { TravelDocuments } from '@/components/dashboard/TravelDocuments';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, loading, error } = useBookings();
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (bookings && bookings.length > 0) {
      // Sort bookings by creation date in descending order
      const sortedBookings = [...bookings].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      // Take the 3 most recent bookings
      setRecentBookings(sortedBookings.slice(0, 3));
    } else {
      setRecentBookings([]);
    }
  }, [bookings]);

  // Get upcoming trip for countdown
  const getUpcomingTrip = () => {
    if (!bookings || bookings.length === 0) return null;
    
    const upcomingBookings = bookings.filter(booking => {
      const checkInDate = booking.check_in_date || booking.booking_data?.departure_date;
      return checkInDate && new Date(checkInDate) > new Date();
    }).sort((a, b) => {
      const dateA = new Date(a.check_in_date || a.booking_data?.departure_date);
      const dateB = new Date(b.check_in_date || b.booking_data?.departure_date);
      return dateA.getTime() - dateB.getTime();
    });

    return upcomingBookings[0] || null;
  };

  // Get destinations for weather widget
  const getDestinations = () => {
    if (!bookings || bookings.length === 0) return [];
    
    const destinations: string[] = [];
    bookings.forEach(booking => {
      const destination = booking.booking_data?.destination || 
                         booking.booking_data?.hotel?.city ||
                         booking.booking_data?.arrival_city;
      if (destination && !destinations.includes(destination)) {
        destinations.push(destination);
      }
    });
    
    return destinations.slice(0, 3); // Limit to 3 destinations
  };

  const upcomingTrip = getUpcomingTrip();
  const destinations = getDestinations();

  const handleExploreDestination = (destination: any) => {
    // Navigate to destination page or search
    navigate(`/search?destination=${encodeURIComponent(destination.name)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-muted/20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24 max-w-7xl">
        {/* Travel Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/80 backdrop-blur-sm rounded-full shadow-sm mb-4 border border-border/50">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Your Travel Hub</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent mb-2">
            Welcome back, {user?.user_metadata?.first_name || 'Traveler'}!
          </h1>
          <p className="text-muted-foreground text-lg">Ready for your next adventure?</p>
        </div>

        {/* Quick Travel Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 border border-border/50">
            <CardContent className="p-4">
              <Button 
                variant="secondary" 
                className="w-full h-10 text-sm font-medium"
                onClick={() => navigate('/flights')}
              >
                Find Flights
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 border border-border/50">
            <CardContent className="p-4">
              <Button 
                variant="secondary" 
                className="w-full h-10 text-sm font-medium"
                onClick={() => navigate('/search')}
              >
                Discover Hotels
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 border border-border/50">
            <CardContent className="p-4">
              <Button 
                variant="secondary" 
                className="w-full h-10 text-sm font-medium"
                onClick={() => navigate('/activities')}
              >
                Explore Activities
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-200 border border-border/50">
            <CardContent className="p-4">
              <Button 
                variant="secondary" 
                className="w-full h-10 text-sm font-medium"
                onClick={() => navigate('/travel-fund')}
              >
                <Coins className="mr-2 h-4 w-4" />
                Travel Fund
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Grid - Optimized Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Row 1: Travel Countdown + Weather Widget */}
          <div className="lg:col-span-6">
            {upcomingTrip ? (
              <TravelCountdown 
                destination={upcomingTrip.booking_data?.destination || upcomingTrip.booking_data?.hotel?.city || 'Your Destination'}
                departureDate={upcomingTrip.check_in_date || upcomingTrip.booking_data?.departure_date || new Date().toISOString()}
                bookingType={upcomingTrip.booking_type}
              />
            ) : (
              <TravelCountdown 
                destination="Your Next Adventure"
                departureDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}
                bookingType="upcoming"
              />
            )}
          </div>

          <div className="lg:col-span-6">
            <TravelDocuments />
          </div>

          {/* Row 2: Recent Bookings - Full Width */}
          <div className="lg:col-span-12">
            <Card className="h-full flex flex-col bg-card/80 backdrop-blur-sm border border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Clock className="h-5 w-5 text-primary" />
                    Recent Bookings
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')} className="text-sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                      <p className="text-muted-foreground">Loading bookings...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-destructive mb-2">Error loading bookings</p>
                      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : recentBookings.length > 0 ? (
                  <div className="flex-1 flex flex-col">
                    <div className="space-y-4 flex-1">
                      {recentBookings.map((booking) => (
                        <DetailedBookingCard 
                          key={booking.id} 
                          booking={booking} 
                          onViewDetails={(bookingId) => navigate(`/bookings/${bookingId}`)} 
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No recent bookings found</p>
                      <Button onClick={() => navigate('/search')} className="px-6">
                        Start Planning Your Trip
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Dream Destinations - Full Width */}
          <div className="lg:col-span-12">
            <DreamDestinationsCard onExplore={handleExploreDestination} />
          </div>
        </div>
      </div>
    </div>
  );
}
