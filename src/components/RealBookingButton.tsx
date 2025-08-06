import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBookingPayment } from '@/features/booking/hooks/useBookingPayment';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { CreditCard, Shield, Loader2 } from 'lucide-react';

interface RealBookingButtonProps {
  bookingType: 'flight' | 'hotel' | 'activity';
  bookingData: any;
  amount: number;
  currency?: string;
  className?: string;
}

export const RealBookingButton: React.FC<RealBookingButtonProps> = ({
  bookingType,
  bookingData,
  amount,
  currency = 'USD',
  className = ''
}) => {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'fund' | 'split'>('card');
  const [fundAmount, setFundAmount] = useState(0);

  const { user } = useAuth();
  const { createBookingPayment, isLoading } = useBookingPayment();

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerInfo.email || !customerInfo.firstName || !customerInfo.lastName) {
      return;
    }

    const result = await createBookingPayment({
      bookingType,
      bookingData,
      amount,
      currency,
      customerInfo,
      paymentMethod,
      fundAmount: paymentMethod === 'split' ? fundAmount : undefined
    });

    if (result.success) {
      setShowBookingForm(false);
      // Handle success - maybe redirect or show confirmation
      console.log('Booking created successfully:', result);
    }
  };

  if (!showBookingForm) {
    return (
      <Button 
        onClick={() => setShowBookingForm(true)}
        className={`btn-primary h-12 ${className}`}
        size="lg"
      >
        Book Now - {currency} {amount}
      </Button>
    );
  }

  return (
    <Card className="travel-card">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold mb-4">Complete Your Booking</h3>
        
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={customerInfo.firstName}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={customerInfo.lastName}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>

          {/* Payment Method Selection */}
          {user && (
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(value: 'card' | 'fund' | 'split') => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Credit Card</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="fund">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>Travel Fund</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="split">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <Shield className="h-4 w-4 -ml-1" />
                      <span>Split Payment</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Split Payment Amount */}
          {paymentMethod === 'split' && (
            <div>
              <Label htmlFor="fundAmount">Amount from Travel Fund</Label>
              <Input
                id="fundAmount"
                type="number"
                min="0"
                max={amount}
                value={fundAmount}
                onChange={(e) => setFundAmount(Number(e.target.value))}
                placeholder={`Max: ${amount}`}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Card payment: {currency} {amount - fundAmount}
              </p>
            </div>
          )}

          {/* Booking Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Booking Summary</h4>
            <div className="flex justify-between items-center">
              <span>{bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} Booking</span>
              <span className="font-bold">{currency} {amount}</span>
            </div>
            {paymentMethod === 'fund' && (
              <p className="text-sm text-primary mt-1">Payment via Travel Fund</p>
            )}
            {paymentMethod === 'split' && (
              <div className="text-sm mt-1">
                <p>Travel Fund: {currency} {fundAmount}</p>
                <p>Credit Card: {currency} {amount - fundAmount}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowBookingForm(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Booking...
                </>
              ) : (
                `Confirm Booking - ${currency} ${amount}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};