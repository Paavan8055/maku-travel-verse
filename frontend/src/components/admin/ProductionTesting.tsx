import { useRealBooking } from '@/hooks/useRealBooking';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, AlertTriangle, XCircle, Play, Loader2 } from 'lucide-react';
import { useState } from 'react';

export const ProductionTesting = () => {
  const { createBooking, loading } = useRealBooking();
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<any[]>([]);

  const runFlightBookingTest = async () => {
    try {
      const testParams = {
        type: 'flight' as const,
        offerId: 'test-flight-offer-123',
        offerData: {
          price: { total: 299.99, currency: 'AUD' },
          itineraries: [
            {
              segments: [
                {
                  departure: { iataCode: 'SYD', at: '2025-12-01T10:00:00' },
                  arrival: { iataCode: 'MEL', at: '2025-12-01T11:30:00' },
                  carrierCode: 'QF',
                  number: '123'
                }
              ]
            }
          ]
        },
        customerInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@maku.travel',
          phone: '+61400000000'
        },
        passengers: [
          {
            id: '1',
            dateOfBirth: '1990-01-01',
            name: { firstName: 'Test', lastName: 'User' },
            gender: 'MALE',
            contact: {
              emailAddress: 'test@maku.travel',
              phones: [{ deviceType: 'MOBILE', countryCallingCode: '61', number: '400000000' }]
            },
            documents: [
              {
                documentType: 'PASSPORT',
                number: 'A12345678',
                expiryDate: '2030-12-31',
                issuanceCountry: 'AU',
                nationality: 'AU',
                holder: true
              }
            ]
          }
        ]
      };

      const result = await createBooking(testParams);
      
      setTestResults(prev => [...prev, {
        id: Date.now(),
        type: 'flight',
        status: result ? 'success' : 'failed',
        result,
        timestamp: new Date().toISOString()
      }]);

      toast({
        title: result ? "Flight booking test passed" : "Flight booking test failed",
        description: result ? `Booking ID: ${result.bookingId}` : "Check logs for details",
        variant: result ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Flight booking test failed:', error);
      toast({
        title: "Flight booking test failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const runHotelBookingTest = async () => {
    try {
      const testParams = {
        type: 'hotel' as const,
        offerId: 'test-hotel-offer-456',
        offerData: {
          price: { total: 150.00, currency: 'AUD' },
          hotelId: 'RTPAR001',
          checkInDate: '2025-12-01',
          checkOutDate: '2025-12-02'
        },
        customerInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@maku.travel',
          phone: '+61400000000'
        },
        guests: [
          {
            id: 1,
            name: {
              title: 'MR',
              firstName: 'Test',
              lastName: 'User'
            },
            contact: {
              phone: '+61400000000',
              email: 'test@maku.travel'
            }
          }
        ]
      };

      const result = await createBooking(testParams);
      
      setTestResults(prev => [...prev, {
        id: Date.now(),
        type: 'hotel',
        status: result ? 'success' : 'failed',
        result,
        timestamp: new Date().toISOString()
      }]);

      toast({
        title: result ? "Hotel booking test passed" : "Hotel booking test failed",
        description: result ? `Booking ID: ${result.bookingId}` : "Check logs for details",
        variant: result ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Hotel booking test failed:', error);
      toast({
        title: "Hotel booking test failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const runActivityBookingTest = async () => {
    try {
      const testParams = {
        type: 'activity' as const,
        offerId: 'test-activity-789',
        offerData: {
          price: { total: 75.00, currency: 'AUD' },
          activityId: 'ACT001',
          scheduledAt: '2025-12-01T14:00:00'
        },
        customerInfo: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@maku.travel',
          phone: '+61400000000'
        },
        guests: [
          {
            name: 'Test User',
            age: 30,
            email: 'test@maku.travel'
          }
        ]
      };

      const result = await createBooking(testParams);
      
      setTestResults(prev => [...prev, {
        id: Date.now(),
        type: 'activity',
        status: result ? 'success' : 'failed',
        result,
        timestamp: new Date().toISOString()
      }]);

      toast({
        title: result ? "Activity booking test passed" : "Activity booking test failed",
        description: result ? `Booking ID: ${result.bookingId}` : "Check logs for details",
        variant: result ? "default" : "destructive"
      });
    } catch (error) {
      console.error('Activity booking test failed:', error);
      toast({
        title: "Activity booking test failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    await runFlightBookingTest();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await runHotelBookingTest();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    await runActivityBookingTest();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Testing</h1>
          <p className="text-muted-foreground">
            Test end-to-end booking flows with real provider integrations
          </p>
        </div>
        <Button onClick={runAllTests} disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 mr-2" />
          )}
          Run All Tests
        </Button>
      </div>

      <Tabs defaultValue="manual" className="space-y-4">
        <TabsList>
          <TabsTrigger value="manual">Manual Tests</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Flight Booking Test
                </CardTitle>
                <CardDescription>
                  Test complete flight booking flow with Amadeus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={runFlightBookingTest}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Flight Booking"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hotel Booking Test</CardTitle>
                <CardDescription>
                  Test complete hotel booking flow with Amadeus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={runHotelBookingTest}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Hotel Booking"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Booking Test</CardTitle>
                <CardDescription>
                  Test complete activity booking flow with HotelBeds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={runActivityBookingTest}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test Activity Booking"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>Results from booking flow tests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {testResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <p className="font-medium capitalize">{result.type} Booking Test</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                        {result.status}
                      </Badge>
                      {result.result?.bookingId && (
                        <span className="text-sm text-muted-foreground">
                          ID: {result.result.bookingId.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {testResults.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No test results yet. Run tests to see results here.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};