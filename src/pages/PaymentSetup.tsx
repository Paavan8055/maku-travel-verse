import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Shield, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const clientSecret = searchParams.get('client_secret');
  const paymentType = searchParams.get('type');
  const redirectTo = searchParams.get('redirect_to');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (paymentType === 'trial') {
        // Confirm setup intent for trial
        result = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}${redirectTo || '/partner-dashboard'}`,
          },
        });
      } else {
        // Confirm payment intent for immediate payment
        result = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}${redirectTo || '/partner-dashboard'}`,
          },
        });
      }

      if (result.error) {
        console.error('Payment error:', result.error);
        toast({
          title: "Payment Error",
          description: result.error.message,
          variant: "destructive"
        });
      } else {
        // Payment succeeded, user will be redirected
        toast({
          title: "Payment Processing",
          description: "Processing your payment..."
        });
      }
    } catch (error) {
      console.error('Payment submission error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {paymentType === 'trial' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-blue-800">7-Day Trial Setup</h4>
            </div>
            <p className="text-sm text-blue-700">
              We'll securely store your payment method and charge you only after your trial period ends. Cancel anytime during the trial.
            </p>
          </div>
        )}

        {paymentType === 'immediate' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-800">Immediate Payment</h4>
            </div>
            <p className="text-sm text-green-700">
              Pay now and get instant access to all partner features and priority verification.
            </p>
          </div>
        )}

        <PaymentElement 
          options={{
            layout: 'tabs',
            paymentMethodOrder: ['card', 'link'],
            fields: {
              billingDetails: 'auto'
            }
          }}
        />

        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full h-12 bg-gradient-to-r from-primary to-secondary"
      >
        {loading 
          ? "Processing..." 
          : paymentType === 'trial' 
            ? "Secure Payment Method & Start Trial" 
            : "Complete Payment"
        }
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        By proceeding, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  );
};

const PaymentSetup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stripePublishableKey, setStripePublishableKey] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [keyLoading, setKeyLoading] = useState(true);
  const [isTestMode, setIsTestMode] = useState(false);

  const clientSecret = searchParams.get('client_secret');
  const paymentType = searchParams.get('type');
  const redirectTo = searchParams.get('redirect_to');

  useEffect(() => {
    if (!clientSecret) {
      navigate('/partner-auth');
    }
  }, [clientSecret, navigate]);

  useEffect(() => {
    const fetchStripeKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-stripe-publishable-key');
        
        if (error) {
          console.error('Error fetching Stripe key:', error);
          toast({
            title: "Configuration Error",
            description: "Unable to load payment configuration. Please try again.",
            variant: "destructive"
          });
          return;
        }

        if (data?.publishableKey) {
          setStripePublishableKey(data.publishableKey);
          setIsTestMode(data.isTestMode || false);
          setStripePromise(loadStripe(data.publishableKey));
        } else {
          toast({
            title: "Configuration Error",
            description: "Stripe configuration not available.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error loading Stripe:', error);
        toast({
          title: "Error",
          description: "Failed to initialize payment system.",
          variant: "destructive"
        });
      } finally {
        setKeyLoading(false);
      }
    };

    fetchStripeKey();
  }, [toast]);

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: 'hsl(var(--primary))',
    }
  };

  const options = {
    clientSecret: clientSecret!,
    appearance,
  };

  if (!clientSecret || keyLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-sm p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Payment System Unavailable</h1>
            <p className="text-muted-foreground mb-4">
              Unable to initialize payment system. Please contact support.
            </p>
            <Button onClick={() => navigate('/partner-auth')}>
              Back to Registration
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 p-4">
      <div className="max-w-lg mx-auto pt-8">
        {isTestMode && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="font-semibold text-yellow-800">Test Mode</span>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              You're in test mode. Use test card numbers to simulate payments.
            </p>
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-yellow-800 hover:text-yellow-900">
                Show test cards
              </summary>
              <div className="mt-2 space-y-1 text-yellow-700">
                <div><strong>Visa:</strong> 4242 4242 4242 4242</div>
                <div><strong>Mastercard:</strong> 5555 5555 5555 4444</div>
                <div><strong>Declined:</strong> 4000 0000 0000 0002</div>
                <div className="text-xs mt-1">Use any future date for expiry and any 3-digit CVC</div>
              </div>
            </details>
          </div>
        )}
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-['Playfair_Display'] mb-2">
            Complete Your <span className="hero-text">Registration</span>
          </h1>
          <p className="text-muted-foreground">
            {paymentType === 'trial' 
              ? "Secure your payment method to start your 7-day trial"
              : "Complete your payment to activate your partner account"
            }
          </p>
        </div>

        <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Payment Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Elements stripe={stripePromise} options={options}>
              <PaymentForm />
            </Elements>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSetup;