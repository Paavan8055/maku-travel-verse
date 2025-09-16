import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plane, Calendar, Armchair, ShoppingCart, Bell, Settings } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { FlightExchangeWorkflow } from '@/features/flight-management/components/FlightExchangeWorkflow';
import { FlightStatusMonitor } from '@/features/flight-management/components/FlightStatusMonitor';
import { SeatSelectionInterface } from '@/features/flight-management/components/SeatSelectionInterface';
import { AirExtrasSelection } from '@/features/flight-management/components/AirExtrasSelection';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const FlightManagementPage = () => {
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const bookingId = searchParams.get('booking');
  const bookingRef = searchParams.get('ref');

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId && !bookingRef) {
        setError('No booking identifier provided');
        setIsLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('bookings')
          .select('*')
          .eq('booking_type', 'flight');

        if (bookingId) {
          query = query.eq('id', bookingId);
        } else if (bookingRef) {
          query = query.eq('booking_reference', bookingRef);
        }

        const { data, error: fetchError } = await query.single();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          throw new Error('Booking not found');
        }

        setBooking(data);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError(err instanceof Error ? err.message : 'Failed to load booking');
        toast({
          title: "Error",
          description: "Failed to load booking details",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, bookingRef, toast]);

  const handleWorkflowComplete = () => {
    // Refresh booking data after any workflow completion
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading booking details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Booking not found'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Flight Management</h1>
          
          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Flight Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Booking Reference</div>
                  <div className="font-medium">{booking.booking_reference}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Route</div>
                  <div className="font-medium">
                    {booking.booking_data?.flight?.origin} → {booking.booking_data?.flight?.destination}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="font-medium capitalize">{booking.status}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Departure</div>
                  <div className="font-medium">
                    {booking.booking_data?.flight?.departure_time 
                      ? new Date(booking.booking_data.flight.departure_time).toLocaleString()
                      : 'N/A'
                    }
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Flight Number</div>
                  <div className="font-medium">
                    {booking.booking_data?.flight?.flight_number || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">PNR Locator</div>
                  <div className="font-medium">
                    {booking.booking_data?.pnr_locator || 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="status" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="status" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Status & Alerts
            </TabsTrigger>
            <TabsTrigger value="exchange" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Exchange Flight
            </TabsTrigger>
            <TabsTrigger value="seats" className="flex items-center gap-2">
              <Armchair className="h-4 w-4" />
              Seat Selection
            </TabsTrigger>
            <TabsTrigger value="extras" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Air Extras
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manage Booking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="status">
            <FlightStatusMonitor 
              booking={booking}
            />
          </TabsContent>

          <TabsContent value="exchange">
            <FlightExchangeWorkflow 
              booking={booking}
              onExchangeComplete={handleWorkflowComplete}
            />
          </TabsContent>

          <TabsContent value="seats">
            <SeatSelectionInterface 
              booking={booking}
              onSeatSelectionComplete={handleWorkflowComplete}
            />
          </TabsContent>

          <TabsContent value="extras">
            <AirExtrasSelection 
              booking={booking}
              onExtrasComplete={handleWorkflowComplete}
            />
          </TabsContent>

          <TabsContent value="manage">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Booking Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertDescription>
                      Advanced booking management features including cancellation, contact updates, and special service requests will be available here.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Contact Information</h4>
                      <div className="text-sm text-muted-foreground">
                        Update your contact details for this booking
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Special Service Requests</h4>
                      <div className="text-sm text-muted-foreground">
                        Add or modify special service requests (SSRs)
                      </div>
                    </div>
                    
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Cancellation</h4>
                      <div className="text-sm text-muted-foreground">
                        Cancel your booking and process refunds
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FlightManagementPage;