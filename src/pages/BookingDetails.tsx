import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthGuard } from '@/features/auth/components/AuthGuard';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Download, Calendar, Users, DollarSign, CreditCard, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookingDetailsData {
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

export const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBookingDetails = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Get all user bookings and find the specific one
      const { data, error } = await supabase.rpc('get_user_bookings');
      
      if (error) throw error;
      
      const bookings = data as unknown as BookingDetailsData[];
      const foundBooking = bookings.find(b => b.id === id);
      
      if (!foundBooking) {
        toast({
          title: "Error",
          description: "Booking not found or you don't have access to it.",
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }
      
      setBooking(foundBooking);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast({
        title: "Error",
        description: "Failed to load booking details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Paid</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Processing</Badge>;
      case 'requires_payment':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Payment Required</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Failed</Badge>;
      case 'refunded':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Refunded</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  const handleDownloadReceipt = () => {
    toast({
      title: "Coming Soon",
      description: "Receipt download functionality will be available soon.",
    });
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading booking details...</span>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!booking) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container mx-auto px-4 py-8">
            <Card>
              <CardContent className="py-12 text-center">
                <h3 className="text-xl font-semibold mb-2">Booking not found</h3>
                <p className="text-muted-foreground mb-6">The booking you're looking for doesn't exist or you don't have access to it.</p>
                <Button onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/dashboard')}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Bookings
            </Button>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-foreground">Booking #{booking.booking_reference}</h1>
                <p className="text-muted-foreground mt-1">Created on {formatDateTime(booking.created_at)}</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {getStatusBadge(booking.status)}
                <Button variant="outline" onClick={handleDownloadReceipt} className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download Receipt
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Booking Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Check-in</p>
                      <p className="font-semibold">{formatDate(booking.check_in_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Check-out</p>
                      <p className="font-semibold">{formatDate(booking.check_out_date)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Guests</p>
                      <p className="font-semibold">{booking.guest_count} guest{booking.guest_count > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  
                  {booking.booking_data && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Booking Details</h4>
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                          {JSON.stringify(booking.booking_data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Items Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {booking.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium capitalize">{item.item_type}</TableCell>
                          <TableCell>
                            <div className="max-w-xs">
                              <pre className="text-xs whitespace-pre-wrap text-muted-foreground">
                                {JSON.stringify(item.item_details, null, 2)}
                              </pre>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.unit_price, booking.currency)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(item.total_price, booking.currency)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary">{formatCurrency(booking.total_amount, booking.currency)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {booking.latest_payment ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Status</span>
                        {getPaymentStatusBadge(booking.latest_payment.status)}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Amount</span>
                        <span className="font-semibold">{formatCurrency(booking.latest_payment.amount, booking.latest_payment.currency)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Payment ID</span>
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {booking.latest_payment.stripe_payment_intent_id.slice(-8)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Date</span>
                        <span className="text-sm">{formatDateTime(booking.latest_payment.created_at)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No payment information available</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-semibold">
                        {Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24))} night{Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24)) > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Items</p>
                      <p className="font-semibold">{booking.items.length}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg. per night</p>
                      <p className="font-semibold">
                        {formatCurrency(
                          booking.total_amount / Math.max(1, Math.ceil((new Date(booking.check_out_date).getTime() - new Date(booking.check_in_date).getTime()) / (1000 * 60 * 60 * 24))),
                          booking.currency
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};