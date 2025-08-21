import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import logger from "@/utils/logger";
import { 
  Search, 
  Filter, 
  Calendar, 
  Plane, 
  Building, 
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  BarChart3
} from "lucide-react";
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedBookingCard } from './AdvancedBookingCard';
import { useToast } from '@/hooks/use-toast';

interface BookingData {
  id: string;
  booking_reference: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  check_in_date: string;
  check_out_date: string;
  guest_count: number;
  total_amount: number;
  currency: string;
  booking_type: string;
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

export const BookingManagementDashboard = () => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchBookings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_bookings');
      
      if (error) {
        logger.error('Error fetching bookings:', error);
        toast({
          title: "Error",
          description: "Failed to load your bookings. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const bookingsArray = Array.isArray(data) ? (data as unknown as BookingData[]) : [];
      setBookings(bookingsArray);
      
    } catch (err) {
      logger.error('Fetch bookings exception:', err);
      toast({
        title: "Error",
        description: "Failed to load your bookings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (booking?.booking_data?.check_in_links) {
      window.open(booking.booking_data.check_in_links, '_blank');
    }
  };

  const handleModifyBooking = (bookingId: string) => {
    toast({
      title: "Modify Booking",
      description: "Booking modification feature coming soon!",
    });
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
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
        fetchBookings();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      logger.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadItinerary = (bookingId: string) => {
    toast({
      title: "Download Started",
      description: "Your itinerary will be downloaded shortly",
    });
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.booking_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.booking_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesType = typeFilter === 'all' || booking.booking_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getBookingStats = () => {
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const totalSpend = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    
    return { confirmed, pending, cancelled, totalSpend };
  };

  const stats = getBookingStats();

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <span className="text-lg">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalSpend.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Manage Bookings</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchBookings}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="flight">Flights</SelectItem>
                <SelectItem value="hotel">Hotels</SelectItem>
                <SelectItem value="activity">Activities</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bookings List */}
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No bookings found</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
              {filteredBookings.map((booking) => (
                <AdvancedBookingCard
                  key={booking.id}
                  booking={booking}
                  onViewDetails={(id) => window.open(`/booking-details/${id}`, '_blank')}
                  onCheckIn={handleCheckIn}
                  onModifyBooking={handleModifyBooking}
                  onCancelBooking={handleCancelBooking}
                  onDownloadItinerary={handleDownloadItinerary}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
