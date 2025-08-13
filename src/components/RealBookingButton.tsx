import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBookingPayment } from '@/features/booking/hooks/useBookingPayment';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { CreditCard, Shield, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

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
      console.log('Booking created successfully:', result);
    }
  };

  if (!showBookingForm) {
    return (
      <Button
        onClick={() => {
          if (bookingType === 'flight') {
            // Handle different trip types
            if (bookingData?.tripType === 'multicity' && bookingData?.segments) {
              const params = new URLSearchParams({
                tripType: 'multicity',
                segments: JSON.stringify(bookingData.segments),
                amount: String(amount),
                currency
              });
              navigate(`/booking/baggage?${params.toString()}`);
              return;
            }

            // Detect roundtrip payload
            const isRoundtrip = bookingData && bookingData.outbound && bookingData.inbound;
            if (isRoundtrip) {
              const params = new URLSearchParams({
                tripType: 'roundtrip',
                outboundId: bookingData.outbound?.id || '',
                inboundId: bookingData.inbound?.id || '',
                outboundFare: bookingData.outbound?.fareType || 'basic',
                inboundFare: bookingData.inbound?.fareType || 'basic',
                amount: String(amount),
                currency
              });
              navigate(`/booking/baggage?${params.toString()}`);
              return;
            }

            const params = new URLSearchParams({
              flightId: bookingData?.id || '',
              fareType: bookingData?.fareType || 'basic',
              amount: String(amount),
              currency
            });
            navigate(`/booking/baggage?${params.toString()}`);
          } else {
            setShowBookingForm(true);
          }
        }}
        className={`btn-primary h-12 ${className}`}
        size="lg"
      >
        Continue - {currency} {amount}
      </Button>
    );
  }

  return (
    <Card className="travel-card">
      <CardContent className="p-4">
        {/* ... keep existing code (optional manual booking form if needed) the same ... */}
      </CardContent>
    </Card>
  );
};
