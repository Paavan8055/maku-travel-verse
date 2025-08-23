
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';

const HotelCheckoutTest = () => {
  const navigate = useNavigate();

  const handlePayment = () => {
    // Mock payment test
    alert('Payment test completed successfully!');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold mb-8">Hotel Checkout Test</h1>
        
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <p className="text-muted-foreground">Test the hotel payment flow</p>
              <Button onClick={handlePayment} className="w-full">
                <CreditCard className="h-4 w-4 mr-2" />
                Complete Test Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HotelCheckoutTest;
