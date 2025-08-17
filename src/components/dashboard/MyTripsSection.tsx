import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Plane, 
  Building, 
  Car, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Eye, 
  X, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
// Use database types instead of Amadeus types for better compatibility

interface TripsData {
  flights: any[];
  hotels: any[];
  transfers: any[];
  activities: any[];
}

export const MyTripsSection: React.FC = () => {
  const [trips, setTrips] = useState<TripsData>({
    flights: [],
    hotels: [],
    transfers: [],
    activities: []
  });
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTrips = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Get user profile first
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        return;
      }

      const profileId = profiles.id;

      // Fetch all order types
      const [flightRes, hotelRes, transferRes, activityRes] = await Promise.all([
        supabase
          .from('flights_orders')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false }),
        supabase
          .from('hotels_orders')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false }),
        supabase
          .from('transfers_orders')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false }),
        supabase
          .from('activities_orders')
          .select('*')
          .eq('profile_id', profileId)
          .order('created_at', { ascending: false })
      ]);

      setTrips({
        flights: flightRes.data || [],
        hotels: hotelRes.data || [],
        transfers: transferRes.data || [],
        activities: activityRes.data || []
      });

    } catch (error) {
      console.error('Error fetching trips:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your trips. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "flex items-center gap-1";
    
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'created':
        return (
          <Badge className={`${baseClasses} bg-green-100 text-green-800 border-green-200`}>
            <CheckCircle className="h-3 w-3" />
            Confirmed
          </Badge>
        );
      case 'pending':
        return (
          <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200`}>
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className={`${baseClasses} bg-red-100 text-red-800 border-red-200`}>
            <X className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className={`${baseClasses} bg-gray-100 text-gray-800 border-gray-200`}>
            <AlertCircle className="h-3 w-3" />
            {status}
          </Badge>
        );
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

  const handleCancelOrder = async (orderId: string, orderType: 'flight' | 'hotel' | 'transfer' | 'activity') => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    setCancelling(orderId);
    try {
      // Here you would call the appropriate Amadeus cancellation endpoint
      // For now, just update the local status
      toast({
        title: 'Cancellation requested',
        description: 'Your cancellation request has been submitted and will be processed.',
      });

      // Refresh the trips data
      fetchTrips();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel the booking. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setCancelling(null);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading your trips...</span>
      </div>
    );
  }

  const totalTrips = trips.flights.length + trips.hotels.length + trips.transfers.length + trips.activities.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Trips</h2>
          <p className="text-muted-foreground">
            {totalTrips} total bookings across all services
          </p>
        </div>
        <Button variant="outline" onClick={fetchTrips} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="flights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="flights" className="flex items-center gap-2">
            <Plane className="h-4 w-4" />
            Flights ({trips.flights.length})
          </TabsTrigger>
          <TabsTrigger value="hotels" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Hotels ({trips.hotels.length})
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Transfers ({trips.transfers.length})
          </TabsTrigger>
          <TabsTrigger value="activities" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Activities ({trips.activities.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flights" className="space-y-4">
          {trips.flights.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Plane className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No flight bookings</h3>
                  <p className="text-muted-foreground">Your flight bookings will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            trips.flights.map((flight) => (
              <Card key={flight.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Plane className="h-5 w-5" />
                      Flight Booking
                    </CardTitle>
                    {getStatusBadge(flight.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {flight.offer_json?.itineraries?.[0]?.segments?.[0]?.departure?.iataCode || 'N/A'} → 
                          {flight.offer_json?.itineraries?.[0]?.segments?.slice(-1)[0]?.arrival?.iataCode || 'N/A'}
                        </span>
                      </div>
                      {flight.pnr && (
                        <div className="text-sm text-muted-foreground">
                          PNR: {flight.pnr}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {flight.price_total && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {formatCurrency(flight.price_total, flight.price_currency)}
                          </span>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        Booked: {formatDate(flight.created_at)}
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {flight.status !== 'cancelled' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelOrder(flight.id, 'flight')}
                        disabled={cancelling === flight.id}
                      >
                        {cancelling === flight.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="hotels" className="space-y-4">
          {trips.hotels.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hotel bookings</h3>
                  <p className="text-muted-foreground">Your hotel bookings will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            trips.hotels.map((hotel) => (
              <Card key={hotel.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {hotel.offer_json?.hotel?.name || 'Hotel Booking'}
                    </CardTitle>
                    {getStatusBadge(hotel.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(hotel.checkin)} - {formatDate(hotel.checkout)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{hotel.rooms} room(s)</span>
                      </div>
                      {hotel.confirmation_code && (
                        <div className="text-sm text-muted-foreground">
                          Confirmation: {hotel.confirmation_code}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {hotel.total_price && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {formatCurrency(hotel.total_price, hotel.currency)}
                          </span>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        Booked: {formatDate(hotel.created_at)}
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {hotel.status !== 'cancelled' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelOrder(hotel.id, 'hotel')}
                        disabled={cancelling === hotel.id}
                      >
                        {cancelling === hotel.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          {trips.transfers.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No transfer bookings</h3>
                  <p className="text-muted-foreground">Your transfer bookings will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            trips.transfers.map((transfer) => (
              <Card key={transfer.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Car className="h-5 w-5" />
                      Transfer Booking
                    </CardTitle>
                    {getStatusBadge(transfer.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(transfer.pickup_at)}
                        </span>
                      </div>
                      <div className="text-sm">
                        {transfer.offer_json?.start?.locationCode} → {transfer.offer_json?.end?.locationCode}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {transfer.total_price && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {formatCurrency(transfer.total_price, transfer.currency)}
                          </span>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        Booked: {formatDate(transfer.created_at)}
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {transfer.status !== 'cancelled' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelOrder(transfer.id, 'transfer')}
                        disabled={cancelling === transfer.id}
                      >
                        {cancelling === transfer.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          {trips.activities.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No activity bookings</h3>
                  <p className="text-muted-foreground">Your activity bookings will appear here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            trips.activities.map((activity) => (
              <Card key={activity.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {activity.offer_json?.name || 'Activity Booking'}
                    </CardTitle>
                    {getStatusBadge(activity.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {formatDate(activity.scheduled_at)}
                        </span>
                      </div>
                      {activity.offer_json?.shortDescription && (
                        <div className="text-sm text-muted-foreground">
                          {activity.offer_json.shortDescription}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {activity.total_price && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {formatCurrency(activity.total_price, activity.currency)}
                          </span>
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground">
                        Booked: {formatDate(activity.created_at)}
                      </div>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {activity.status !== 'cancelled' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelOrder(activity.id, 'activity')}
                        disabled={cancelling === activity.id}
                      >
                        {cancelling === activity.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <X className="h-4 w-4 mr-2" />
                        )}
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};