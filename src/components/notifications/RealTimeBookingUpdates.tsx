import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plane, 
  Hotel, 
  MapPin, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BookingUpdate {
  id: string;
  booking_id: string;
  booking_reference: string;
  update_type: 'status_change' | 'schedule_change' | 'gate_change' | 'reminder' | 'cancellation';
  title: string;
  message: string;
  status: 'info' | 'warning' | 'success' | 'error';
  metadata?: Record<string, any>;
  created_at: string;
  booking_type: 'hotel' | 'flight' | 'activity' | 'transfer';
}

export const RealTimeBookingUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<BookingUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    fetchBookingUpdates();

    // Subscribe to real-time booking updates
    const channel = supabase
      .channel('booking_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_updates',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newUpdate = payload.new as BookingUpdate;
          setUpdates(prev => [newUpdate, ...prev]);
          
          // Show toast for important updates
          if (newUpdate.status === 'warning' || newUpdate.status === 'error') {
            toast({
              title: newUpdate.title,
              description: newUpdate.message,
              variant: newUpdate.status === 'error' ? 'destructive' : 'default'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const fetchBookingUpdates = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('booking_updates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setUpdates(data || []);
    } catch (error) {
      console.error('Error fetching booking updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUpdateIcon = (bookingType: string, updateType: string) => {
    if (updateType === 'cancellation') return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (updateType === 'schedule_change') return <Clock className="h-4 w-4 text-orange-500" />;
    
    switch (bookingType) {
      case 'flight':
        return <Plane className="h-4 w-4 text-blue-500" />;
      case 'hotel':
        return <Hotel className="h-4 w-4 text-green-500" />;
      case 'activity':
        return <MapPin className="h-4 w-4 text-purple-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      info: 'bg-blue-100 text-blue-800',
      warning: 'bg-yellow-100 text-yellow-800',
      success: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800'
    };
    
    return variants[status as keyof typeof variants] || variants.info;
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-primary" />
          Live Booking Updates
          {updates.length > 0 && (
            <Badge variant="secondary">{updates.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {updates.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {updates.map((update) => (
              <div
                key={update.id}
                className="p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getUpdateIcon(update.booking_type, update.update_type)}
                    <h4 className="font-medium">{update.title}</h4>
                    <Badge className={getStatusBadge(update.status)}>
                      {update.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(update.created_at)}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {update.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    {update.booking_reference}
                  </span>
                  
                  {update.metadata?.action_url && (
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All Up to Date!</h3>
            <p className="text-muted-foreground">
              No recent updates for your bookings.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};