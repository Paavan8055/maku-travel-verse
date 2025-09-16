import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PaymentCancelled = () => {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  const goToPartnerAuth = () => {
    navigate('/partner-auth');
  };

  const goHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-orange-700">
              Payment Cancelled
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Your payment was cancelled. No charges have been made to your payment method.
              </p>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-orange-800">
                  Don't worry! You can try again anytime. Your registration information has been saved.
                </p>
              </div>
            </div>

            <div className="border-t pt-6 space-y-3">
              <h4 className="font-semibold text-center">What would you like to do?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Try the payment process again</li>
                <li>• Contact our support team for assistance</li>
                <li>• Learn more about our partnership program</li>
              </ul>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                onClick={goToPartnerAuth}
                className="w-full h-12 bg-gradient-to-r from-primary to-secondary"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                onClick={goBack}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>

              <Button 
                variant="ghost" 
                onClick={goHome}
                className="w-full"
              >
                <Home className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </div>

            <div className="text-center pt-4">
              <p className="text-xs text-muted-foreground">
                Having trouble? Contact our support team at support@maku.travel
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCancelled;