
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, MapPin } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useBookings, Booking } from '@/hooks/useBookings';
import { TravelCountdown } from '@/components/dashboard/TravelCountdown';
import { TravelWeatherWidget } from '@/components/dashboard/TravelWeatherWidget';
import { TravelInspirationCard } from '@/components/dashboard/TravelInspirationCard';
import { DetailedBookingCard } from '@/components/dashboard/DetailedBookingCard';
import { TravelDocuments } from '@/components/dashboard/TravelDocuments';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { bookings, loading, error } = useBookings();
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);

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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Travel Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm mb-4">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Your Travel Hub</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Welcome back, {user?.user_metadata?.first_name || 'Traveler'}!
          </h1>
          <p className="text-muted-foreground text-lg">Ready for your next adventure?</p>
        </div>

        {/* Quick Travel Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm shadow-sm hover:scale-105 transition-transform">
            <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
              <Button variant="secondary" className="w-full h-10">
                Find Flights
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-sm hover:scale-105 transition-transform">
            <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
              <Button variant="secondary" className="w-full h-10">
                Discover Hotels
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-sm hover:scale-105 transition-transform">
            <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
              <Button variant="secondary" className="w-full h-10">
                Explore Activities
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm shadow-sm hover:scale-105 transition-transform">
            <CardContent className="p-4 flex flex-col items-center justify-center space-y-2">
              <Button variant="secondary" className="w-full h-10">
                Plan a Trip
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Travel Countdown */}
          <div className="xl:col-span-1">
            {upcomingTrip ? (
              <TravelCountdown 
                destination={upcomingTrip.booking_data?.destination || upcomingTrip.booking_data?.hotel?.city || 'Your Destination'}
                departureDate={upcomingTrip.check_in_date || upcomingTrip.booking_data?.departure_date || new Date().toISOString()}
                bookingType={upcomingTrip.booking_type}
              />
            ) : (
              <TravelCountdown 
                destination="Your Next Adventure"
                departureDate={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()} // 7 days from now
                bookingType="upcoming"
              />
            )}
          </div>

          {/* Weather Widget */}
          <div className="xl:col-span-1">
            <TravelWeatherWidget destinations={destinations} />
          </div>

          {/* Travel Documents */}
          <div className="xl:col-span-1">
            <TravelDocuments />
          </div>

          {/* Recent Bookings */}
          <div className="xl:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Bookings
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')}>
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {loading ? (
                    <p>Loading bookings...</p>
                  ) : error ? (
                    <p>Error: {error}</p>
                  ) : recentBookings.length > 0 ? (
                    recentBookings.map((booking) => (
                      <DetailedBookingCard key={booking.id} booking={booking} onViewDetails={(bookingId) => navigate(`/bookings/${bookingId}`)} />
                    ))
                  ) : (
                    <p>No recent bookings found.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Travel Inspiration */}
          <div className="xl:col-span-1">
            <TravelInspirationCard onExplore={handleExploreDestination} />
          </div>
        </div>
      </div>
    </div>
  );
}
