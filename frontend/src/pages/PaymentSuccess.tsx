import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Home, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logger from "@/utils/logger";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  const sessionId = searchParams.get('session_id');
  const setupIntentId = searchParams.get('setup_intent');
  const paymentIntentId = searchParams.get('payment_intent');

  useEffect(() => {
    if (sessionId || setupIntentId || paymentIntentId) {
      verifyPayment();
    } else {
      setLoading(false);
    }
  }, [sessionId, setupIntentId, paymentIntentId]);

  const verifyPayment = async () => {
    try {
      // Call verification function based on what we have
      const { data, error } = await supabase.functions.invoke('verify-partner-payment', {
        body: {
          session_id: sessionId,
          setup_intent_id: setupIntentId,
          payment_intent_id: paymentIntentId
        }
      });

      if (error) throw error;

      setPaymentDetails(data);
      
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully"
      });

    } catch (error) {
      logger.error('Payment verification error:', error);
      toast({
        title: "Verification Error",
        description: "Unable to verify payment status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    navigate('/partner-dashboard');
  };

  const goHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">
              Payment Successful!
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Thank you for your payment. Your partner account is now being processed.
              </p>
              
              {paymentDetails?.type === 'trial_setup' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>7-Day Trial Started</strong><br />
                    Your payment method has been secured. You'll be charged after your trial ends unless you cancel.
                  </p>
                </div>
              )}

              {paymentDetails?.type === 'immediate' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-800">
                    <strong>Full Access Activated</strong><br />
                    Your payment has been processed and you now have full platform access.
                  </p>
                </div>
              )}
            </div>

            {paymentDetails && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Business Type</span>
                  <Badge variant="secondary" className="capitalize">
                    {paymentDetails.business_type}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-medium">
                    A${(paymentDetails.amount / 100).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="default">
                    {paymentDetails.status}
                  </Badge>
                </div>
              </div>
            )}

            <div className="border-t pt-6 space-y-3">
              <h4 className="font-semibold text-center">What's Next?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Check your email for account verification instructions</li>
                <li>• Access your partner dashboard to set up your business profile</li>
                <li>• Upload required documents for verification</li>
                <li>• Start listing your services once approved</li>
              </ul>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                onClick={goToDashboard}
                className="w-full h-12 bg-gradient-to-r from-primary to-secondary"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                onClick={goHome}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>

            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground">
                Need help? Contact our support team at support@maku.travel
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;