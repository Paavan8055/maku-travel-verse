import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Edit, 
  X, 
  RefreshCw, 
  Calendar, 
  DollarSign, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Phone,
  Mail
} from 'lucide-react';

interface Booking {
  id: string;
  booking_reference: string;
  booking_type: 'flight' | 'hotel' | 'activity' | 'car' | 'transfer';
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  booking_data: any;
  user_id?: string;
  payments?: any[];
}

const BookingManagementDashboard: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter, typeFilter]);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          payments (*)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setBookings((data || []) as Booking[]);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.booking_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.booking_data?.customerInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.booking_data?.customerInfo?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.booking_data?.customerInfo?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(booking => booking.booking_type === typeFilter);
    }

    setFilteredBookings(filtered);
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setIsProcessing(true);
      const { data, error } = await supabase.functions.invoke('modify-booking', {
        body: {
          booking_id: bookingId,
          modification_type: 'cancellation',
          new_data: {},
          reason: 'Customer requested cancellation'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Booking Cancelled",
          description: `Booking has been cancelled successfully`,
        });
        fetchBookings();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessRefund = async () => {
    if (!selectedBooking || !refundAmount) return;

    try {
      setIsProcessing(true);
      const { data, error } = await supabase.functions.invoke('process-refund', {
        body: {
          booking_id: selectedBooking.id,
          refund_amount: parseFloat(refundAmount),
          reason: refundReason,
          refund_type: parseFloat(refundAmount) === selectedBooking.total_amount ? 'full' : 'partial'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Refund Processed",
          description: `Refund of ${selectedBooking.currency} $${refundAmount} has been processed`,
        });
        setSelectedBooking(null);
        setRefundAmount('');
        setRefundReason('');
        fetchBookings();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      toast({
        title: "Error",
        description: "Failed to process refund",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: X },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Booking Management</h1>
        <Button onClick={fetchBookings} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Booking ref, email, name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="flight">Flight</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{booking.booking_reference}</h3>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(booking.status)}
                      <Badge variant="outline">{booking.booking_type}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{booking.currency} ${booking.total_amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(booking.created_at)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Customer</p>
                    <p>{booking.booking_data?.customerInfo?.firstName} {booking.booking_data?.customerInfo?.lastName}</p>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {booking.booking_data?.customerInfo?.email}
                    </p>
                    {booking.booking_data?.customerInfo?.phone && (
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {booking.booking_data?.customerInfo?.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="font-medium">Booking Details</p>
                    {booking.booking_type === 'hotel' && (
                      <>
                        <p>Check-in: {booking.booking_data?.checkInDate}</p>
                        <p>Check-out: {booking.booking_data?.checkOutDate}</p>
                        <p>Guests: {booking.booking_data?.guests?.adults || 1}</p>
                      </>
                    )}
                    {booking.booking_type === 'flight' && (
                      <>
                        <p>Departure: {booking.booking_data?.departureDate}</p>
                        <p>Return: {booking.booking_data?.returnDate || 'One-way'}</p>
                        <p>Passengers: {booking.booking_data?.passengers?.length || 1}</p>
                      </>
                    )}
                    {booking.booking_type === 'activity' && (
                      <>
                        <p>Date: {booking.booking_data?.selectedDate}</p>
                        <p>Time: {booking.booking_data?.selectedTime}</p>
                        <p>Participants: {booking.booking_data?.participantDetails?.length || 1}</p>
                      </>
                    )}
                  </div>

                  <div>
                    <p className="font-medium">Payment Status</p>
                    {booking.payments && booking.payments.length > 0 ? (
                      <div>
                        <p>Status: {booking.payments[0].status}</p>
                        <p>Method: {booking.payments[0].payment_method}</p>
                        {booking.payments[0].refund_amount && (
                          <p>Refunded: ${booking.payments[0].refund_amount}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No payment found</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedBooking(booking)}>
                        <DollarSign className="h-4 w-4 mr-1" />
                        Process Refund
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Process Refund - {booking.booking_reference}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="refundAmount">Refund Amount</Label>
                          <Input
                            id="refundAmount"
                            type="number"
                            max={booking.total_amount}
                            value={refundAmount}
                            onChange={(e) => setRefundAmount(e.target.value)}
                            placeholder={`Max: ${booking.total_amount.toFixed(2)}`}
                          />
                        </div>
                        <div>
                          <Label htmlFor="refundReason">Reason</Label>
                          <Textarea
                            id="refundReason"
                            value={refundReason}
                            onChange={(e) => setRefundReason(e.target.value)}
                            placeholder="Reason for refund..."
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleProcessRefund} disabled={isProcessing || !refundAmount}>
                            {isProcessing ? 'Processing...' : 'Process Refund'}
                          </Button>
                          <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={booking.status === 'cancelled' || isProcessing}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel Booking
                  </Button>
                </div>
              </div>
            ))}

            {filteredBookings.length === 0 && !isLoading && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No bookings found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingManagementDashboard;