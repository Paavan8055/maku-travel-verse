import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/context/AuthContext';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, X, Calendar, Users, DollarSign, Loader2, Zap, TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TravelTechMetrics } from '@/components/dashboard/TravelTechMetrics';
import { SmartAnalytics } from '@/components/dashboard/SmartAnalytics';
import { RealTimeFeeds } from '@/components/dashboard/RealTimeFeeds';
import { TripTimeline } from '@/components/dashboard/TripTimeline';
import { DocumentsHub } from '@/components/dashboard/DocumentsHub';
import { SmartTripPlanner } from '@/components/dashboard/SmartTripPlanner';
import { NotificationBell } from '@/components/dashboard/NotificationBell';
import { LoyaltyWidget } from '@/components/ota/LoyaltyWidget';
import { SmartRecommendations } from '@/components/ota/SmartRecommendations';
import InteractiveWorldMap from '@/components/dream-map/InteractiveWorldMap';

interface BookingData {
  id: string;
  booking_reference: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  total_amount: number;
  currency: string;
  booking_data: any;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: string;
    item_type: string;
    item_details: any;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  latest_payment: {
    id: string;
    stripe_payment_intent_id: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
  } | null;
}

export const Dashboard: React.FC = () => {
  console.log('Dashboard: Component mounting');
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_user_bookings');
      
      if (error) throw error;
      
      setBookings((data as unknown as BookingData[]) || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      setCancelling(bookingId);
      const { data, error } = await supabase.rpc('cancel_booking', { 
        p_booking_id: bookingId 
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; message: string };
      if (result.success) {
        toast({
          title: "Success",
          description: "Booking cancelled successfully.",
        });
        fetchBookings(); // Refresh the list
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCancelling(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Confirmed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;
    fetchBookings();
  }, [authLoading, user]);

  console.log('Dashboard: Starting render');
  
  if (authLoading) {
    console.log('Dashboard: Auth loading');
    return <div>Loading auth...</div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Dashboard Test
            </h1>
            <p className="text-muted-foreground">Testing basic functionality</p>
          </div>

          <div className="p-8 text-center">
            <h2 className="text-2xl font-bold">Dashboard Simplified</h2>
            <p className="text-muted-foreground">Testing if the error persists with minimal components</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};