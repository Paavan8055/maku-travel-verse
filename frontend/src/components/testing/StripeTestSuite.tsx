import React, { useState } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  paymentIntentId?: string;
  bookingId?: string;
}

interface StripeTestSuiteProps {
  enableAutoRun?: boolean;
}

export const StripeTestSuite: React.FC<StripeTestSuiteProps> = ({
  enableAutoRun = false
}) => {
  const [tests, setTests] = useState<TestResult[]>([
    {
      id: 'hotel-booking-4242',
      name: 'Hotel Booking with Test Card 4242',
      status: 'pending'
    },
    {
      id: 'flight-booking-4242',
      name: 'Flight Booking with Test Card 4242',
      status: 'pending'
    },
    {
      id: 'activity-booking-4242',
      name: 'Activity Booking with Test Card 4242',
      status: 'pending'
    },
    {
      id: 'webhook-verification',
      name: 'Webhook Event Processing',
      status: 'pending'
    },
    {
      id: 'payment-failure-handling',
      name: 'Payment Failure & Rollback',
      status: 'pending'
    },
    {
      id: 'guest-checkout-flow',
      name: 'Guest Checkout Flow',
      status: 'pending'
    }
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const { toast } = useToast();

  const updateTestStatus = (testId: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(test => 
      test.id === testId ? { ...test, ...updates } : test
    ));
  };

  const runHotelBookingTest = async (): Promise<void> => {
    const testId = 'hotel-booking-4242';
    updateTestStatus(testId, { status: 'running' });
    const startTime = Date.now();

    try {
      // Create test hotel booking
      const { data, error } = await supabase.functions.invoke('create-hotel-booking', {
        body: {
          hotelId: 'TEST_HOTEL_001',
          checkInDate: '2025-09-01',
          checkOutDate: '2025-09-03',
          guests: 2,
          rooms: 1,
          customerInfo: {
            email: 'test@maku.travel',
            firstName: 'Test',
            lastName: 'User',
            phone: '+61400000000'
          },
          amount: 29900, // $299.00
          currency: 'AUD',
          useTestCard: true,
          testCardNumber: '4242424242424242'
        }
      });

      if (error) throw error;

      const duration = Date.now() - startTime;
      
      if (data.success && data.paymentIntentId) {
        updateTestStatus(testId, {
          status: 'passed',
          duration,
          paymentIntentId: data.paymentIntentId,
          bookingId: data.bookingId
        });
      } else {
        throw new Error(data.error || 'Booking creation failed');
      }
    } catch (error) {
      updateTestStatus(testId, {
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message
      });
    }
  };

  const runFlightBookingTest = async (): Promise<void> => {
    const testId = 'flight-booking-4242';
    updateTestStatus(testId, { status: 'running' });
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke('create-flight-booking', {
        body: {
          origin: 'SYD',
          destination: 'MEL',
          departureDate: '2025-09-15',
          passengers: 1,
          cabinClass: 'economy',
          customerInfo: {
            email: 'test@maku.travel',
            firstName: 'Test',
            lastName: 'User'
          },
          amount: 19900, // $199.00
          currency: 'AUD',
          useTestCard: true,
          testCardNumber: '4242424242424242'
        }
      });

      if (error) throw error;

      const duration = Date.now() - startTime;
      
      if (data.success) {
        updateTestStatus(testId, {
          status: 'passed',
          duration,
          paymentIntentId: data.paymentIntentId,
          bookingId: data.bookingId
        });
      } else {
        throw new Error(data.error || 'Flight booking failed');
      }
    } catch (error) {
      updateTestStatus(testId, {
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message
      });
    }
  };

  const runWebhookTest = async (): Promise<void> => {
    const testId = 'webhook-verification';
    updateTestStatus(testId, { status: 'running' });
    const startTime = Date.now();

    try {
      // Simulate webhook event processing
      const { data, error } = await supabase.functions.invoke('test-webhook-processing', {
        body: {
          eventType: 'payment_intent.succeeded',
          testMode: true
        }
      });

      if (error) throw error;

      updateTestStatus(testId, {
        status: 'passed',
        duration: Date.now() - startTime
      });
    } catch (error) {
      updateTestStatus(testId, {
        status: 'failed',
        duration: Date.now() - startTime,
        error: error.message
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setOverallProgress(0);

    const testFunctions = [
      runHotelBookingTest,
      runFlightBookingTest,
      runWebhookTest
    ];

    for (let i = 0; i < testFunctions.length; i++) {
      await testFunctions[i]();
      setOverallProgress(((i + 1) / testFunctions.length) * 100);
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunning(false);
    
    const passed = tests.filter(t => t.status === 'passed').length;
    const total = tests.length;
    
    toast({
      title: "Test Suite Complete",
      description: `${passed}/${total} tests passed`,
      variant: passed === total ? "default" : "destructive"
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      passed: 'default',
      failed: 'destructive',
      running: 'secondary',
      pending: 'outline'
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Stripe Test Card 4242 Verification Suite
        </CardTitle>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Progress value={overallProgress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-1">
              {passedTests} passed, {failedTests} failed, {tests.length} total
            </p>
          </div>
          
          <Button 
            onClick={runAllTests}
            disabled={isRunning}
            className="min-w-[120px]"
          >
            {isRunning ? 'Running...' : 'Run All Tests'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {tests.map((test) => (
            <div
              key={test.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <h4 className="font-medium">{test.name}</h4>
                  {test.duration && (
                    <p className="text-sm text-muted-foreground">
                      Completed in {test.duration}ms
                    </p>
                  )}
                  {test.error && (
                    <p className="text-sm text-red-500 mt-1">{test.error}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {test.paymentIntentId && (
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {test.paymentIntentId.substring(0, 15)}...
                  </code>
                )}
                {getStatusBadge(test.status)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Test Card Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Card Number:</strong> 4242 4242 4242 4242</p>
              <p><strong>Expiry:</strong> Any future date</p>
            </div>
            <div>
              <p><strong>CVC:</strong> Any 3 digits</p>
              <p><strong>ZIP:</strong> Any valid postal code</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};