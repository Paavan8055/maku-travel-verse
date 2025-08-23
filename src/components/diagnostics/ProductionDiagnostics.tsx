import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const ProductionDiagnostics = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setLoading(true);
    setResults(null);

    try {
      // Test critical debug function
      const { data: debugData, error: debugError } = await supabase.functions.invoke('critical-debug');
      
      if (debugError) {
        throw new Error(`Debug function error: ${debugError.message}`);
      }

      // Test hotel offers function
      let hotelTest = 'Not tested';
      try {
        const { data: hotelData, error: hotelError } = await supabase.functions.invoke('amadeus-hotel-offers', {
          body: {
            hotelId: 'RTPAR001',
            checkIn: '2025-12-01',
            checkOut: '2025-12-02',
            adults: 2,
            rooms: 1,
            currency: 'USD'
          }
        });
        hotelTest = hotelError ? `ERROR: ${hotelError.message}` : 'SUCCESS';
      } catch (error) {
        hotelTest = `FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }

      // Test flight search function
      let flightTest = 'Not tested';
      try {
        const { data: flightData, error: flightError } = await supabase.functions.invoke('amadeus-flight-search', {
          body: {
            origin: 'SYD',
            destination: 'MEL',
            departureDate: '2025-12-01',
            passengers: 1
          }
        });
        flightTest = flightError ? `ERROR: ${flightError.message}` : 'SUCCESS';
      } catch (error) {
        flightTest = `FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }

      // Test activities function
      let activityTest = 'Not tested';
      try {
        const { data: activityData, error: activityError } = await supabase.functions.invoke('hotelbeds-activities', {
          body: {
            destination: 'Sydney',
            language: 'en'
          }
        });
        activityTest = activityError ? `ERROR: ${activityError.message}` : 'SUCCESS';
      } catch (error) {
        activityTest = `FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }

      setResults({
        debug: debugData,
        tests: {
          hotel_offers: hotelTest,
          flight_search: flightTest,
          activities: activityTest
        }
      });

      toast.success('Diagnostics completed');
      
    } catch (error) {
      toast.error(`Diagnostics failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Production Diagnostics</CardTitle>
        <CardDescription>
          Test edge function deployment and API connectivity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Running Diagnostics...' : 'Run Full Diagnostics'}
        </Button>

        {results && (
          <div className="space-y-4">
            {results.error ? (
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <h3 className="font-semibold text-red-800">Critical Error</h3>
                <p className="text-red-600">{results.error}</p>
              </div>
            ) : (
              <>
                {/* Debug Function Results */}
                {results.debug && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Edge Function Status</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Badge variant={results.debug.success ? 'default' : 'destructive'}>
                        Debug Function: {results.debug.success ? 'Working' : 'Failed'}
                      </Badge>
                      <Badge variant="outline">
                        {results.debug.deployment_status}
                      </Badge>
                    </div>
                    
                    {results.debug.environment_status && (
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Environment Variables</h4>
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          {Object.entries(results.debug.environment_status).map(([key, value]) => (
                            <Badge 
                              key={key} 
                              variant={value === 'Present' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {key}: {value as string}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {results.debug.amadeus_api_test && (
                      <div className="text-sm">
                        <span className="font-medium">Amadeus API Test: </span>
                        <Badge variant={results.debug.amadeus_api_test === 'SUCCESS' ? 'default' : 'destructive'}>
                          {results.debug.amadeus_api_test}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Function Tests */}
                {results.tests && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">API Function Tests</h3>
                    <div className="space-y-1">
                      {Object.entries(results.tests).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                          <Badge variant={value === 'SUCCESS' ? 'default' : 'destructive'}>
                            {value as string}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw Debug Data */}
                {results.debug && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">Raw Debug Data</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                      {JSON.stringify(results.debug, null, 2)}
                    </pre>
                  </details>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};