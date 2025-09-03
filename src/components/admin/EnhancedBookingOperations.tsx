import React, { useState, useCallback, useEffect } from 'react';
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
  Send,
  Loader2
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

  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [alertProcessingId, setAlertProcessingId] = useState<string | null>(null);
  const [isCheckingTriggers, setIsCheckingTriggers] = useState(false);

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

  const [realBookings, setRealBookings] = useState<any[]>([]);

  const fetchAlerts = useCallback(async () => {
    setAlertsLoading(true);
    setAlertsError(null);
    try {
      const { data, error } = await supabase.functions.invoke('critical-booking-alerts', {
        body: {
          action: 'get_active_alerts',
          correlationId: correlationId.getCurrentId()
        },
        headers: correlationId.getHeaders()
      });

      if (error) throw error;

      setAlerts(data?.active_alerts || []);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
      setAlertsError('Failed to load alerts');
      toast.error('Failed to load alerts');
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  // Fetch real bookings data
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data, error } = await supabase
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
          .limit(50);

        if (error) throw error;

        // Transform bookings to match component interface
        const transformedBookings = (data || []).map(booking => {
          const customerInfo = (booking.booking_data as any)?.customerInfo || {};
          return {
            id: booking.id,
            bookingReference: booking.booking_reference,
            type: booking.booking_type,
            status: booking.status,
            customerName: customerInfo.firstName && customerInfo.lastName 
              ? `${customerInfo.firstName} ${customerInfo.lastName}`
              : 'Guest User',
            customerEmail: customerInfo.email || 'no-email@example.com',
            amount: booking.total_amount || 0,
            currency: booking.currency || 'AUD',
            createdAt: new Date(booking.created_at),
            lifecycle: [
              { stage: 'Search', status: 'completed' as const },
              { stage: 'Selection', status: 'completed' as const },
              { stage: 'Payment', status: booking.status === 'confirmed' ? 'completed' as const : 'current' as const },
              { stage: 'Provider Booking', status: booking.status === 'confirmed' ? 'completed' as const : 'pending' as const },
              { stage: 'Confirmation', status: booking.status === 'confirmed' ? 'completed' as const : 'pending' as const },
              { stage: 'Travel', status: 'pending' as const }
            ]
          };
        });

        setRealBookings(transformedBookings);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        setRealBookings([]);
      }
    };

    fetchBookings();
  }, []);

  useEffect(() => {
    if (activeTab === 'alerts') {
      fetchAlerts();
    }
  }, [activeTab, fetchAlerts]);

  const performBulkOperation = useCallback(async (operationType: 'retry' | 'cancel' | 'refund') => {
    if (selectedBookings.length === 0) {
      toast.error('Please select bookings to perform operation');
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('bulk-booking-operations', {
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
      
      const { data, error } = await supabase.functions.invoke('bulk-booking-operations', {
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

  const resolveAlert = useCallback(async (alertId: string) => {
    setAlertProcessingId(alertId);
    try {
      const { data, error } = await supabase.functions.invoke('critical-booking-alerts', {
        body: {
          action: 'resolve_alert',
          booking_id: alertId,
          correlationId: correlationId.getCurrentId()
        },
        headers: correlationId.getHeaders()
      });

      if (error) throw error;

      toast.success('Alert resolved');
      fetchAlerts();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
      toast.error('Failed to resolve alert');
    } finally {
      setAlertProcessingId(null);
    }
  }, [fetchAlerts]);

  const checkTriggers = useCallback(async () => {
    setIsCheckingTriggers(true);
    try {
      const { data, error } = await supabase.functions.invoke('critical-booking-alerts', {
        body: {
          action: 'check_triggers',
          correlationId: correlationId.getCurrentId()
        },
        headers: correlationId.getHeaders()
      });

      if (error) throw error;

      const triggered = data?.alerts_triggered || 0;
      toast.success(triggered > 0 ? `${triggered} alerts triggered` : 'No new alerts');
      fetchAlerts();
    } catch (err) {
      console.error('Failed to check triggers:', err);
      toast.error('Failed to check alerts');
    } finally {
      setIsCheckingTriggers(false);
    }
  }, [fetchAlerts]);

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

  const getAlertStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-500',
          title: 'text-red-700',
          sub: 'text-red-600'
        };
      case 'high':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-500',
          title: 'text-yellow-700',
          sub: 'text-yellow-600'
        };
      default:
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-500',
          title: 'text-blue-700',
          sub: 'text-blue-600'
        };
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
                              checked={selectedBookings.length === realBookings.length}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedBookings(realBookings.map(b => b.id));
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
                        {realBookings.map((booking) => (
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
                {realBookings.map(booking => (
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
                  {alertsLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : alertsError ? (
                    <div className="text-sm text-red-500">{alertsError}</div>
                  ) : alerts.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No active alerts</div>
                  ) : (
                    <div className="space-y-4">
                      {alerts.map(alert => {
                        const styles = getAlertStyles(alert.severity);
                        return (
                          <div
                            key={alert.id}
                            className={`flex items-center gap-2 p-3 border rounded-lg ${styles.container}`}
                          >
                            <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
                            <div className="flex-1">
                              <div className={`font-medium ${styles.title}`}>{alert.message}</div>
                              {alert.booking_id && (
                                <div className={`text-sm ${styles.sub}`}>Booking {alert.booking_id}</div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resolveAlert(alert.id)}
                                disabled={alertProcessingId === alert.id}
                                className="gap-2"
                              >
                                {alertProcessingId === alert.id && (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                )}
                                Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={checkTriggers}
                                disabled={isCheckingTriggers}
                                className="gap-2"
                              >
                                {isCheckingTriggers && (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                )}
                                Check Status
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};