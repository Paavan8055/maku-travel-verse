import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  Pause, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Users,
  Plane,
  Hotel,
  Car,
  Activity
} from 'lucide-react';

interface BookingFlow {
  id: string;
  correlation_id: string;
  booking_reference?: string;
  booking_type: string;
  status: 'initiated' | 'processing' | 'payment' | 'confirmation' | 'completed' | 'failed';
  customer_info: {
    name?: string;
    email?: string;
    type?: 'guest' | 'registered' | 'vip';
  };
  booking_value: number;
  currency: string;
  steps: BookingStep[];
  created_at: string;
  updated_at: string;
  duration_ms?: number;
}

interface BookingStep {
  step: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: string;
  duration_ms?: number;
  service?: string;
  error?: string;
}

interface FlowMetrics {
  active_flows: number;
  completed_today: number;
  failed_today: number;
  avg_completion_time: number;
  total_revenue_today: number;
  conversion_rate: number;
}

export const RealTimeBookingFlow: React.FC = () => {
  const [flows, setFlows] = useState<BookingFlow[]>([]);
  const [metrics, setMetrics] = useState<FlowMetrics | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingFlows();
    
    if (isLive) {
      const interval = setInterval(fetchBookingFlows, 2000); // Update every 2 seconds
      return () => clearInterval(interval);
    }
  }, [isLive]);

  useEffect(() => {
    if (!isLive) return;

    // Set up real-time subscription for booking updates
    const channel = supabase
      .channel('booking-flows')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'correlation_tracking'
        },
        (payload) => {
          console.log('Real-time booking update:', payload);
      // Only refresh if it's a booking-related correlation
      if (payload.new && typeof payload.new === 'object' && 'request_type' in payload.new && 
          typeof payload.new.request_type === 'string' && payload.new.request_type.includes('booking')) {
        fetchBookingFlows();
      }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        (payload) => {
          console.log('Real-time booking table update:', payload);
          fetchBookingFlows();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isLive]);

  const fetchBookingFlows = async () => {
    try {
      // Fetch recent booking correlations
      const { data: correlations, error: corrError } = await supabase
        .from('correlation_tracking')
        .select('*')
        .ilike('request_type', '%booking%')
        .order('created_at', { ascending: false })
        .limit(50);

      if (corrError) throw corrError;

      // Fetch actual booking records
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_reference,
          booking_type,
          status,
          total_amount,
          currency,
          booking_data,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (bookingError) throw bookingError;

      // Process and merge data
      const processedFlows = processBookingFlows(correlations || [], bookings || []);
      setFlows(processedFlows);

      // Calculate metrics
      const calculatedMetrics = calculateFlowMetrics(processedFlows, bookings || []);
      setMetrics(calculatedMetrics);

    } catch (error) {
      console.error('Failed to fetch booking flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const processBookingFlows = (correlations: any[], bookings: any[]): BookingFlow[] => {
    const flowMap = new Map<string, BookingFlow>();

    // Process correlations first
    correlations.forEach(corr => {
      const correlationId = corr.correlation_id;
      
      if (!flowMap.has(correlationId)) {
        flowMap.set(correlationId, {
          id: corr.id,
          correlation_id: correlationId,
          booking_type: corr.request_data?.booking_type || (corr.request_type || '').replace('_booking', ''),
          status: mapCorrelationStatus(corr.status, corr.request_type),
          customer_info: {
            email: corr.request_data?.email || corr.request_data?.customer_email,
            name: corr.request_data?.customer_name || 
                  (corr.request_data?.firstName && corr.request_data?.lastName 
                   ? `${corr.request_data.firstName} ${corr.request_data.lastName}` 
                   : undefined),
            type: corr.request_data?.customer_type || 'guest'
          },
          booking_value: corr.request_data?.amount || corr.response_data?.amount || 0,
          currency: corr.request_data?.currency || 'USD',
          steps: [],
          created_at: corr.created_at,
          updated_at: corr.updated_at || corr.created_at,
          duration_ms: corr.duration_ms
        });
      }

      // Add step information
      const flow = flowMap.get(correlationId)!;
      flow.steps.push({
        step: corr.request_type,
        status: corr.status === 'completed' ? 'completed' : corr.status === 'failed' ? 'failed' : 'processing',
        timestamp: corr.created_at,
        duration_ms: corr.duration_ms,
        service: corr.request_data?.service_name || corr.request_data?.service,
        error: corr.request_data?.error_message
      });
    });

    // Enhance with booking data
    bookings.forEach(booking => {
      const correlationId = booking.booking_data?.correlationId;
      if (correlationId && flowMap.has(correlationId)) {
        const flow = flowMap.get(correlationId)!;
        flow.booking_reference = booking.booking_reference;
        flow.status = mapBookingStatus(booking.status);
        flow.booking_value = booking.total_amount || flow.booking_value;
        flow.currency = booking.currency || flow.currency;
        flow.updated_at = booking.updated_at;
      }
    });

    return Array.from(flowMap.values()).slice(0, 20);
  };

  const mapCorrelationStatus = (status: string, requestType?: string): BookingFlow['status'] => {
    if (requestType?.includes('payment')) return 'payment';
    if (requestType?.includes('confirmation')) return 'confirmation';
    
    switch (status) {
      case 'completed': return 'completed';
      case 'failed': return 'failed';
      case 'in_progress': return 'processing';
      default: return 'initiated';
    }
  };

  const mapBookingStatus = (status: string): BookingFlow['status'] => {
    switch (status) {
      case 'confirmed': return 'completed';
      case 'failed': return 'failed';
      case 'pending_payment': return 'payment';
      case 'pending': return 'processing';
      default: return 'initiated';
    }
  };

  const calculateFlowMetrics = (flows: BookingFlow[], bookings: any[]): FlowMetrics => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayBookings = bookings.filter(b => 
      new Date(b.created_at) >= today
    );

    const completed = todayBookings.filter(b => b.status === 'confirmed').length;
    const failed = todayBookings.filter(b => b.status === 'failed').length;
    const total = todayBookings.length;

    const completedFlows = flows.filter(f => f.status === 'completed');
    const avgTime = completedFlows.length > 0 
      ? completedFlows.reduce((sum, f) => sum + (f.duration_ms || 0), 0) / completedFlows.length
      : 0;

    const totalRevenue = todayBookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);

    return {
      active_flows: flows.filter(f => !['completed', 'failed'].includes(f.status)).length,
      completed_today: completed,
      failed_today: failed,
      avg_completion_time: avgTime,
      total_revenue_today: totalRevenue,
      conversion_rate: total > 0 ? (completed / total) * 100 : 0
    };
  };

  const getStatusColor = (status: BookingFlow['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'payment': return 'bg-yellow-500';
      case 'processing': return 'bg-blue-500';
      case 'confirmation': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getBookingIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'flight': return <Plane className="h-4 w-4" />;
      case 'hotel': return <Hotel className="h-4 w-4" />;
      case 'car': return <Car className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStepProgress = (steps: BookingStep[]) => {
    const totalSteps = Math.max(4, steps.length); // Minimum 4 expected steps
    const completedSteps = steps.filter(s => s.status === 'completed').length;
    return (completedSteps / totalSteps) * 100;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading booking flows...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Control & Metrics */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant={isLive ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Live
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Paused
              </>
            )}
          </Button>
          {isLive && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Real-time monitoring active
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Flows</p>
                  <p className="text-2xl font-bold">{metrics.active_flows}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed Today</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.completed_today}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Today</p>
                  <p className="text-2xl font-bold">${metrics.total_revenue_today.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversion Rate</p>
                  <p className="text-2xl font-bold">{metrics.conversion_rate.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <Progress value={metrics.conversion_rate} className="w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Booking Flows */}
      <Card>
        <CardHeader>
          <CardTitle>Real-Time Booking Flows</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {flows.map((flow) => (
                <Card key={flow.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getBookingIcon(flow.booking_type)}
                        <div>
                          <div className="font-medium">
                            {flow.booking_reference || flow.correlation_id.slice(-8)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {flow.customer_info.name || flow.customer_info.email || 'Guest'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getStatusColor(flow.status)} text-white`}>
                          {flow.status.toUpperCase()}
                        </Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          ${flow.booking_value.toLocaleString()} {flow.currency}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{Math.round(getStepProgress(flow.steps))}%</span>
                      </div>
                      <Progress value={getStepProgress(flow.steps)} />
                    </div>

                    {/* Steps Timeline */}
                    <div className="space-y-2">
                      {flow.steps.slice(-3).map((step, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className={`w-2 h-2 rounded-full ${
                            step.status === 'completed' ? 'bg-green-500' :
                            step.status === 'failed' ? 'bg-red-500' :
                            step.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                            'bg-gray-300'
                          }`} />
                          <span className="flex-1">{step.step.replace(/_/g, ' ')}</span>
                          {step.duration_ms && (
                            <span className="text-muted-foreground">
                              {step.duration_ms}ms
                            </span>
                          )}
                          {step.error && (
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground mt-3">
                      <span>{new Date(flow.created_at).toLocaleTimeString()}</span>
                      {flow.duration_ms && (
                        <span>Duration: {Math.round(flow.duration_ms / 1000)}s</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {flows.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Active Booking Flows</h3>
                  <p className="text-muted-foreground">
                    Booking flows will appear here in real-time as customers make reservations
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};