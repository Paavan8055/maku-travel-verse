import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, RefreshCw, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface StuckBooking {
  id: string;
  booking_reference: string;
  status: string;
  created_at: string;
  total_amount: number;
  currency: string;
  booking_type: string;
  user_id?: string;
}

export const BookingStatusResolver: React.FC = () => {
  const [stuckBookings, setStuckBookings] = useState<StuckBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState<Set<string>>(new Set());
  const [lastSummary, setLastSummary] = useState<{ success: number; failed: number } | null>(null);
  const { toast } = useToast();

  const loadStuckBookings = async () => {
    setLoading(true);
    try {
      // Find bookings that have been pending for more than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'pending')
        .lt('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading stuck bookings:', error);
        return;
      }

      setStuckBookings(data || []);
    } catch (error) {
      console.error('Failed to load stuck bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveBooking = async (bookingId: string, newStatus: 'confirmed' | 'failed') => {
    setResolving(prev => new Set(prev).add(bookingId));
    
    try {
      // First try to get payment intent status from Stripe
      const booking = stuckBookings.find(b => b.id === bookingId);
      if (booking) {
        const { data, error } = await supabase.functions.invoke('fix-stuck-bookings');
        if (error) {
          console.error('Error resolving booking:', error);
          toast({
            title: 'Resolution Failed',
            description: error.message || 'Failed to resolve booking',
            variant: 'destructive'
          });
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', bookingId);
          if (updateError) {
            console.error('Manual update failed:', updateError);
            toast({
              title: 'Manual Update Failed',
              description: updateError.message,
              variant: 'destructive'
            });
          } else {
            toast({
              title: 'Status Updated',
              description: `Booking marked as ${newStatus}`
            });
            setStuckBookings(prev => prev.filter(b => b.id !== bookingId));
          }
        } else {
          const success =
            (data?.summary?.confirmed || 0) + (data?.summary?.recovered || 0);
          const failed =
            (data?.summary?.failed || 0) +
            (data?.summary?.expired || 0) +
            (data?.summary?.recovery_failed || 0);
          setLastSummary({ success, failed });
          toast({
            title: 'Resolution Complete',
            description: `${success} succeeded, ${failed} failed`
          });
          if (data?.results) {
            setStuckBookings(prev =>
              prev
                .map(b => {
                  const result = (data.results as any[]).find(r => r.booking_id === b.id);
                  return result ? { ...b, status: result.status } : b;
                })
                .filter(b => b.status === 'pending')
            );
          } else {
            await loadStuckBookings();
          }
        }
      }
    } catch (error) {
      console.error('Failed to resolve booking:', error);
      toast({
        title: 'Resolution Error',
        description: 'Failed to resolve booking',
        variant: 'destructive'
      });
    } finally {
      setResolving(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  const runBulkResolution = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fix-stuck-bookings');
      if (error) {
        console.error('Bulk resolution error:', error);
        toast({
          title: 'Bulk Resolution Failed',
          description: error.message || 'Failed to resolve bookings',
          variant: 'destructive'
        });
      } else {
        const success =
          (data?.summary?.confirmed || 0) + (data?.summary?.recovered || 0);
        const failed =
          (data?.summary?.failed || 0) +
          (data?.summary?.expired || 0) +
          (data?.summary?.recovery_failed || 0);
        setLastSummary({ success, failed });
        toast({
          title: 'Bulk Resolution Complete',
          description: `${success} succeeded, ${failed} failed`
        });
        if (data?.results) {
          setStuckBookings(prev =>
            prev
              .map(b => {
                const result = (data.results as any[]).find(r => r.booking_id === b.id);
                return result ? { ...b, status: result.status } : b;
              })
              .filter(b => b.status === 'pending')
          );
        } else {
          await loadStuckBookings();
        }
      }
    } catch (error) {
      console.error('Bulk resolution failed:', error);
      toast({
        title: 'Bulk Resolution Failed',
        description: 'Failed to resolve bookings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStuckBookings();
    // Check every 5 minutes
    const interval = setInterval(loadStuckBookings, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getTimeSincePending = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Booking Status Resolver</h2>
          <p className="text-muted-foreground">
            Manage bookings stuck in pending status
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadStuckBookings} disabled={loading} variant="outline">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={runBulkResolution} disabled={loading || stuckBookings.length === 0}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Resolve All
          </Button>
        </div>
      </div>

      {stuckBookings.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            <strong>{stuckBookings.length} booking(s)</strong> have been pending for over 1 hour and may need manual resolution.
          </AlertDescription>
        </Alert>
      )}

      {lastSummary && (
        <Alert>
          <AlertDescription>
            Last resolution: {lastSummary.success} succeeded, {lastSummary.failed} failed
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Stuck Bookings</CardTitle>
          <CardDescription>
            Bookings that have been pending for more than 1 hour
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stuckBookings.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium">No stuck bookings found</p>
              <p className="text-muted-foreground">All bookings are processing normally</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stuckBookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{booking.booking_reference}</h3>
                        <Badge variant="outline" className="capitalize">
                          {booking.booking_type}
                        </Badge>
                        <Badge variant="destructive">
                          <Clock className="mr-1 h-3 w-3" />
                          {getTimeSincePending(booking.created_at)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Amount: {booking.currency} {booking.total_amount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(booking.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveBooking(booking.id, 'failed')}
                        disabled={resolving.has(booking.id)}
                      >
                        {resolving.has(booking.id) ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Mark Failed'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => resolveBooking(booking.id, 'confirmed')}
                        disabled={resolving.has(booking.id)}
                      >
                        {resolving.has(booking.id) ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Confirm'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};