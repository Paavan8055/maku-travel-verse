import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  RefreshCw, 
  X, 
  DollarSign, 
  MessageSquare, 
  Mail, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye,
  RotateCcw,
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { correlationId } from '@/utils/correlationId';
import { toast } from 'sonner';

interface BookingOperation {
  id: string;
  bookingId: string;
  operationType: 'retry' | 'cancel' | 'refund' | 'communicate';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedBy: string;
  requestedAt: Date;
  completedAt?: Date;
  reason?: string;
  notes?: string;
}

interface CommunicationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'delay' | 'cancellation' | 'refund' | 'confirmation' | 'custom';
}

interface BookingLifecycleStage {
  stage: string;
  status: 'completed' | 'current' | 'pending' | 'failed';
  timestamp?: Date;
  details?: string;
}

export const EnhancedBookingOperations: React.FC = () => {
  const [activeTab, setActiveTab] = useState('operations');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [operations, setOperations] = useState<BookingOperation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [communicationText, setCommunicationText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const communicationTemplates: CommunicationTemplate[] = [
    {
      id: 'delay-notification',
      name: 'Flight Delay Notification',
      subject: 'Important Update: Flight Delay for Booking {bookingRef}',
      body: 'Dear {customerName},\n\nWe regret to inform you that your flight {flightNumber} scheduled for {departureDate} has been delayed. New departure time is {newDepartureTime}.\n\nWe apologize for any inconvenience caused.',
      type: 'delay'
    },
    {
      id: 'cancellation-notice',
      name: 'Booking Cancellation Notice',
      subject: 'Booking Cancellation Confirmation - {bookingRef}',
      body: 'Dear {customerName},\n\nYour booking {bookingRef} has been successfully cancelled as requested. Refund will be processed within 5-7 business days.\n\nThank you for choosing MAKU.Travel.',
      type: 'cancellation'
    },
    {
      id: 'refund-processed',
      name: 'Refund Processed',
      subject: 'Refund Processed for Booking {bookingRef}',
      body: 'Dear {customerName},\n\nYour refund of {refundAmount} for booking {bookingRef} has been processed successfully. You should see the amount in your account within 3-5 business days.',
      type: 'refund'
    }
  ];

  const mockBookings = [
    {
      id: 'bk-001',
      bookingReference: 'MAKU001',
      type: 'flight',
      status: 'confirmed',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      amount: 850,
      currency: 'AUD',
      createdAt: new Date('2024-01-15'),
      lifecycle: [
        { stage: 'Search', status: 'completed' as const, timestamp: new Date('2024-01-15T10:00:00') },
        { stage: 'Selection', status: 'completed' as const, timestamp: new Date('2024-01-15T10:05:00') },
        { stage: 'Payment', status: 'completed' as const, timestamp: new Date('2024-01-15T10:10:00') },
        { stage: 'Provider Booking', status: 'completed' as const, timestamp: new Date('2024-01-15T10:12:00') },
        { stage: 'Confirmation', status: 'current' as const, timestamp: new Date('2024-01-15T10:15:00') },
        { stage: 'Travel', status: 'pending' as const }
      ]
    },
    {
      id: 'bk-002',
      bookingReference: 'MAKU002',
      type: 'hotel',
      status: 'stuck',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      amount: 450,
      currency: 'AUD',
      createdAt: new Date('2024-01-16'),
      lifecycle: [
        { stage: 'Search', status: 'completed' as const },
        { stage: 'Selection', status: 'completed' as const },
        { stage: 'Payment', status: 'completed' as const },
        { stage: 'Provider Booking', status: 'failed' as const, details: 'Provider timeout after 30s' },
        { stage: 'Confirmation', status: 'pending' as const }
      ]
    }
  ];

  const performBulkOperation = useCallback(async (operationType: 'retry' | 'cancel' | 'refund') => {
    if (selectedBookings.length === 0) {
      toast.error('Please select bookings to perform operation');
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('booking-integrity-manager', {
        body: {
          operation: 'bulk_operation',
          operationType,
          bookingIds: selectedBookings,
          correlationId: correlationId.getCurrentId()
        },
        headers: correlationId.getHeaders()
      });

      if (error) throw error;

      const newOperations: BookingOperation[] = selectedBookings.map(bookingId => ({
        id: `op-${Date.now()}-${bookingId}`,
        bookingId,
        operationType,
        status: 'processing',
        requestedBy: 'admin',
        requestedAt: new Date()
      }));

      setOperations(prev => [...newOperations, ...prev]);
      setSelectedBookings([]);
      
      toast.success(`${operationType} operation initiated for ${selectedBookings.length} bookings`);
    } catch (err) {
      console.error('Bulk operation failed:', err);
      toast.error('Bulk operation failed');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedBookings]);

  const sendCommunication = useCallback(async () => {
    if (selectedBookings.length === 0 || !communicationText.trim()) {
      toast.error('Please select bookings and enter message');
      return;
    }

    setIsProcessing(true);
    
    try {
      const template = communicationTemplates.find(t => t.id === selectedTemplate);
      
      const { data, error } = await supabase.functions.invoke('booking-integrity-manager', {
        body: {
          operation: 'bulk_communication',
          bookingIds: selectedBookings,
          message: communicationText,
          template: template || null,
          correlationId: correlationId.getCurrentId()
        },
        headers: correlationId.getHeaders()
      });

      if (error) throw error;

      toast.success(`Communication sent to ${selectedBookings.length} customers`);
      setCommunicationText('');
      setSelectedTemplate('');
      setSelectedBookings([]);
    } catch (err) {
      console.error('Communication failed:', err);
      toast.error('Failed to send communication');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedBookings, communicationText, selectedTemplate, communicationTemplates]);

  const getLifecycleIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'current':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 border-2 border-muted rounded-full" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-500/10 text-green-500">Confirmed</Badge>;
      case 'stuck':
        return <Badge variant="destructive">Stuck</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Enhanced Booking Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="operations">Bulk Operations</TabsTrigger>
              <TabsTrigger value="communication">Customer Communication</TabsTrigger>
              <TabsTrigger value="lifecycle">Lifecycle Tracking</TabsTrigger>
              <TabsTrigger value="alerts">Critical Alerts</TabsTrigger>
            </TabsList>

            <TabsContent value="operations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Bulk Booking Operations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      onClick={() => performBulkOperation('retry')}
                      disabled={isProcessing || selectedBookings.length === 0}
                      className="gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Retry Selected ({selectedBookings.length})
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => performBulkOperation('cancel')}
                      disabled={isProcessing || selectedBookings.length === 0}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel Selected
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => performBulkOperation('refund')}
                      disabled={isProcessing || selectedBookings.length === 0}
                      className="gap-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      Refund Selected
                    </Button>
                  </div>

                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox 
                              checked={selectedBookings.length === mockBookings.length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedBookings(mockBookings.map(b => b.id));
                                } else {
                                  setSelectedBookings([]);
                                }
                              }}
                            />
                          </TableHead>
                          <TableHead>Booking</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell>
                              <Checkbox 
                                checked={selectedBookings.includes(booking.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedBookings(prev => [...prev, booking.id]);
                                  } else {
                                    setSelectedBookings(prev => prev.filter(id => id !== booking.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-mono text-sm">{booking.bookingReference}</div>
                                <div className="text-xs text-muted-foreground">{booking.type}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{booking.customerName}</div>
                                <div className="text-xs text-muted-foreground">{booking.customerEmail}</div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(booking.status)}</TableCell>
                            <TableCell>{booking.currency} {booking.amount}</TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" className="gap-2">
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="communication" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Customer Communication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Communication Template</label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select template or write custom message" />
                      </SelectTrigger>
                      <SelectContent>
                        {communicationTemplates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea
                      placeholder="Enter your message to customers..."
                      value={communicationText}
                      onChange={(e) => setCommunicationText(e.target.value)}
                      rows={6}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">
                      {selectedBookings.length} customers selected for communication
                    </span>
                  </div>

                  <Button 
                    onClick={sendCommunication}
                    disabled={isProcessing || selectedBookings.length === 0 || !communicationText.trim()}
                    className="w-full gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Send Communication
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lifecycle" className="space-y-4">
              <div className="grid gap-4">
                {mockBookings.map(booking => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span>{booking.bookingReference} - {booking.customerName}</span>
                        {getStatusBadge(booking.status)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          {booking.lifecycle.map((stage, index) => (
                            <React.Fragment key={stage.stage}>
                              <div className="flex flex-col items-center space-y-2">
                                {getLifecycleIcon(stage.status)}
                                <div className="text-center">
                                  <div className="text-xs font-medium">{stage.stage}</div>
                                  {stage.timestamp && (
                                    <div className="text-xs text-muted-foreground">
                                      {stage.timestamp.toLocaleTimeString()}
                                    </div>
                                  )}
                                  {stage.details && (
                                    <div className="text-xs text-red-500 max-w-20 truncate" title={stage.details}>
                                      {stage.details}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {index < booking.lifecycle.length - 1 && (
                                <div className="flex-1 h-px bg-border" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Critical Booking Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div className="flex-1">
                        <div className="font-medium text-red-700">Booking MAKU002 stuck in Provider Booking stage</div>
                        <div className="text-sm text-red-600">Provider timeout after 30s. Manual intervention required.</div>
                      </div>
                      <Button size="sm" variant="outline">
                        Resolve
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-500" />
                      <div className="flex-1">
                        <div className="font-medium text-yellow-700">3 bookings pending confirmation</div>
                        <div className="text-sm text-yellow-600">Awaiting provider response for over 10 minutes.</div>
                      </div>
                      <Button size="sm" variant="outline">
                        Check Status
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};