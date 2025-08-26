import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plane, Clock, MapPin, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FlightStatusMonitorProps {
  booking: {
    id: string;
    booking_reference: string;
    booking_data: any;
  };
}

export const FlightStatusMonitor: React.FC<FlightStatusMonitorProps> = ({ booking }) => {
  const [flightStatus, setFlightStatus] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchFlightStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sabre-travel-alerts', {
        body: {
          action: 'get_flight_status',
          pnrLocator: booking.booking_data.pnr_locator,
          flightNumber: booking.booking_data.flight?.flight_number
        }
      });

      if (error) throw error;

      if (data.success) {
        setFlightStatus(data.flightStatus);
      } else {
        throw new Error(data.error || 'Failed to fetch flight status');
      }
    } catch (error) {
      console.error('Flight status fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch flight status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTravelAlerts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('sabre-travel-alerts', {
        body: {
          action: 'check_alerts',
          pnrLocator: booking.booking_data.pnr_locator,
          userId: booking.booking_data.userId
        }
      });

      if (error) throw error;

      if (data.success) {
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Travel alerts fetch error:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('sabre-travel-alerts', {
        body: {
          action: 'acknowledge_alert',
          alertId: alertId
        }
      });

      if (error) throw error;

      if (data.success) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
        toast({
          title: "Alert Acknowledged",
          description: "The alert has been marked as acknowledged."
        });
      }
    } catch (error) {
      console.error('Alert acknowledgment error:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchFlightStatus();
    fetchTravelAlerts();
    
    // Set up periodic refresh for real-time updates
    const interval = setInterval(() => {
      fetchFlightStatus();
      fetchTravelAlerts();
    }, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'on_time': return 'default';
      case 'delayed': return 'destructive'; // Changed from 'warning' to 'destructive'
      case 'cancelled': return 'destructive';
      case 'boarding': return 'secondary';
      case 'departed': return 'default';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'on_time': return <CheckCircle className="h-4 w-4" />;
      case 'delayed': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'boarding': return <Plane className="h-4 w-4" />;
      case 'departed': return <Plane className="h-4 w-4" />;
      default: return <Plane className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Flight Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Flight Status
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFlightStatus}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {flightStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(flightStatus.status)}
                  <span className="font-medium">
                    Flight {booking.booking_data.flight?.flight_number}
                  </span>
                </div>
                <Badge variant={getStatusColor(flightStatus.status)}>
                  {flightStatus.status?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Departure</span>
                  </div>
                  <div className="pl-6">
                    <div>{flightStatus.departure?.airport || booking.booking_data.flight?.origin}</div>
                    <div className="text-sm text-muted-foreground">
                      Scheduled: {new Date(flightStatus.departure?.scheduled || booking.booking_data.flight?.departure_time).toLocaleString()}
                    </div>
                    {flightStatus.departure?.actual && (
                      <div className="text-sm text-muted-foreground">
                        Actual: {new Date(flightStatus.departure.actual).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Arrival</span>
                  </div>
                  <div className="pl-6">
                    <div>{flightStatus.arrival?.airport || booking.booking_data.flight?.destination}</div>
                    <div className="text-sm text-muted-foreground">
                      Scheduled: {new Date(flightStatus.arrival?.scheduled || booking.booking_data.flight?.arrival_time).toLocaleString()}
                    </div>
                    {flightStatus.arrival?.actual && (
                      <div className="text-sm text-muted-foreground">
                        Actual: {new Date(flightStatus.arrival.actual).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {flightStatus.gate && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">Gate: {flightStatus.gate}</div>
                  {flightStatus.terminal && (
                    <div className="text-sm text-muted-foreground">Terminal: {flightStatus.terminal}</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Click refresh to check flight status
            </div>
          )}
        </CardContent>
      </Card>

      {/* Travel Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Travel Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <Alert key={alert.id} variant={alert.severity === 'high' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{alert.alert_type?.replace('_', ' ').toUpperCase()}</div>
                    <div>{alert.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.created_at).toLocaleString()}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};